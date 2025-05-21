import { Collection, RESTPostAPIApplicationCommandsJSONBody, SlashCommandBuilder, ApplicationCommandType, ApplicationCommandDataResolvable } from 'discord.js'
import { lstat, readdir } from 'fs/promises'
import type { AoiClient, AwaitCommand } from 'aoi.js'
import { join } from 'path'
import colors from 'colors'

export interface ICommand extends AwaitCommand {
    data: SlashCommandBuilder | Record<string, any>
    type?: ApplicationCommandType
}

type CommandData = RESTPostAPIApplicationCommandsJSONBody

export interface ApplicationCommandManagerOptions {
    path?: string
    guildIds?: string[]
    showTable?: boolean
}

export class ApplicationCommandManager {
    #bot: AoiClient & { slashCommandManager: ApplicationCommandManager }
    #commands: Collection<string, CommandData>
    #directory: string | null = null
    #options: ApplicationCommandManagerOptions

    constructor(bot: AoiClient, options: ApplicationCommandManagerOptions = {}) {
        this.#bot = bot as any
        this.#commands = new Collection()
        this.#bot.slashCommandManager = this
        this.#options = {
            path: options.path,
            guildIds: options.guildIds,
            showTable: options.showTable ?? true
        }
        this.#addPlugins()
        
        if (this.#options.path) {
            this.load(this.#options.path).then(() => {
                setTimeout(() => {
                    if (this.#bot.isReady()) {
                        this.sync(this.#options.guildIds)
                        if (this.#options.showTable) {
                            this.#showCommandTable()
                        }
                    }
                }, 5000)
            })
        }
    }

    #showCommandTable() {
        const commands = Array.from(this.#commands.entries()).map(([name, data]) => ({
            name,
            status: '✅',
            scope: this.#options.guildIds ? 'Guild' : 'Global'
        }))

        console.log(colors.yellow('╭───────────────────────────────╮'))
        console.log(colors.yellow('│   Comandos de barra cargados  │'))
        console.log(colors.yellow('│ Name │Status│Guild/Global│'))
        console.log(colors.yellow('├───────────────────────────────┤'))
        commands.forEach(cmd => {
            console.log(colors.yellow(`│ ${cmd.name.padEnd(4)} │ ${cmd.status} │ ${cmd.scope.padEnd(10)} │`))
        })
        console.log(colors.yellow('╰───────────────────────────────╯'))
    }

    /**
     * Load all application commands inside a directory.
     * @param dir - Application commands directory.
     * @throws {Error} If the directory is invalid or commands are invalid
     */
    async load(dir: string): Promise<void> {
        try {
            const root = process.cwd()
            const files = await readdir(join(root, dir))

            this.#directory = dir

            for (const file of files) {
                const filePath = join(root, dir, file)
                const stat = await lstat(filePath)
                
                if (stat.isDirectory()) {
                    await this.load(join(dir, file))
                    continue
                }
                
                if (!file.endsWith('.js') && !file.endsWith('.ts')) continue
                
                try {
                    const data: ICommand | ICommand[] = require(filePath)
                    if (Array.isArray(data)) {
                        for (const d of data) {
                            this.#validateAndAddCommand(d)
                        }
                    } else {
                        this.#validateAndAddCommand(data)
                    }
                } catch (error: unknown) {
                    console.error(`Error loading command from ${filePath}:`, error instanceof Error ? error.message : String(error))
                }
            }
        } catch (error: unknown) {
            throw new Error(`Failed to load commands: ${error instanceof Error ? error.message : String(error)}`)
        }
    }

    /**
     * Validate and add a command to the collection
     * @private
     */
    #validateAndAddCommand(command: ICommand): void {
        if (!command.data || !command.data.name) {
            throw new Error('Invalid command structure: missing data or name')
        }

        if (command.data instanceof SlashCommandBuilder) {
            const jsonData = command.data.toJSON()
            this.#commands.set(command.data.name, jsonData)
        } else {
            const jsonData = command.data as CommandData
            this.#commands.set(command.data.name, jsonData)
        }
    }

    /**
     * Sync all application commands with the Discord API.
     * @param guildIDs - Optional array of guild IDs to sync commands to
     * @throws {Error} If guild IDs are invalid or sync fails
     */
    async sync(guildIDs?: string[]): Promise<void> {
        try {
            const commands = this.getCommands()
            
            if (Array.isArray(guildIDs)) {
                await Promise.all(guildIDs.map(async guildId => {
                    const guild = this.#bot.guilds.cache.get(guildId) ?? await this.#bot.guilds.fetch(guildId)
                    if (!guild) throw new Error(`Invalid Guild ID: ${guildId}`)
                    await guild.commands.set(commands)
                }))
            } else {
                if (!this.#bot.application) throw new Error('Bot application not found')
                await this.#bot.application.commands.set(commands)
            }
        } catch (error: unknown) {
            throw new Error(`Failed to sync commands: ${error instanceof Error ? error.message : String(error)}`)
        }
    }

    /**
     * Clear all cached commands.
     * @returns {ApplicationCommandManager}
     */
    clearCommands(): ApplicationCommandManager {
        this.#commands.clear()
        return this
    }

    /**
     * Returns the number of cached commands.
     * @returns {number}
     */
    commandSize(): number {
        return this.#commands.size
    }

    /**
     * Get all registered commands
     * @returns {ApplicationCommandDataResolvable[]}
     */
    getCommands(): ApplicationCommandDataResolvable[] {
        return Array.from(this.#commands.values())
    }

    /**
     * Command specifications directory.
     */
    get directory(): string | null {
        return this.#directory
    }

    #addPlugins(): void {
        // Sync commands function
        this.#bot.functionManager.createFunction({
            name: '$applicationCommandSync',
            type: 'djs',
            code: async function(d: any) {
                const data = d.util.aoiFunc(d)
                const guildIDs = data.inside.splits

                if (!(d.bot.slashCommandManager instanceof ApplicationCommandManager))
                    return d.aoiError.fnError(d, 'custom', {
                        inside: data.inside
                    }, 'Cannot find an instance of ApplicationCommandManager!')
                
                if (d.bot.slashCommandManager.commandSize() === 0)
                    return d.aoiError.fnError(d, 'custom', {
                        inside: data.inside
                    }, 'Cannot sync empty commands!')

                try {
                    await (
                        d.bot.slashCommandManager as ApplicationCommandManager
                    ).sync(guildIDs.length > 0 ? guildIDs : undefined)

                    return {
                        code: d.util.setCode(data)
                    }
                } catch (error: unknown) {
                    return d.aoiError.fnError(d, 'custom', {
                        inside: data.inside
                    }, `Failed to sync commands: ${error instanceof Error ? error.message : String(error)}`)
                }
            }
        } as any)

        // Reload commands function
        this.#bot.functionManager.createFunction({
            name: '$applicationCommandReload',
            type: 'djs',
            code: async (d: any) => {
                const data = d.util.aoiFunc(d)
                if (!(d.bot.slashCommandManager instanceof ApplicationCommandManager))
                    return d.aoiError.fnError(d, 'custom', {
                        inside: data.inside
                    }, 'Cannot find an instance of ApplicationCommandManager!')

                if (!d.bot.slashCommandManager.directory) 
                    return d.aoiError.fnError(
                        d,
                        'custom',
                        {},
                        'Cannot find a specification directory!'
                    )
                
                try {
                    await (
                        d.bot.slashCommandManager as ApplicationCommandManager
                    ).load(d.bot.slashCommandManager.directory)
                    data.result = true
                } catch (error: unknown) {
                    data.result = false
                    console.error('Failed to reload commands:', error instanceof Error ? error.message : String(error))
                }

                return {
                    code: d.util.setCode(data)
                }
            }
        } as any)
    }
}