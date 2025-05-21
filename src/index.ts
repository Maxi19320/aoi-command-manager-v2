import { Collection, RESTPostAPIApplicationCommandsJSONBody, SlashCommandBuilder, ApplicationCommandType, ApplicationCommandDataResolvable } from 'discord.js'
import { lstat, readdir } from 'fs/promises'
import type { AoiClient, AwaitCommand } from 'aoi.js'
import { join } from 'path'
import colors from 'colors'
import { Table } from 'console-table-printer'

export class CommandManagerError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'CommandManagerError'
    }
}

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
        if (!bot) {
            throw new CommandManagerError('Bot instance is required')
        }

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
            }).catch(error => {
                console.error(colors.red('Error loading commands:'), error.message)
            })
        }
    }

    #showCommandTable() {
        const commands = Array.from(this.#commands.entries()).map(([name, data]) => ({
            Name: name,
            Status: '✅',
            Scope: this.#options.guildIds ? 'Guild' : 'Global',
            Description: (data as any).description || 'No description'
        }))

        const table = new Table({
            title: 'Loaded Slash Commands',
            columns: [
                { name: 'Name', alignment: 'left' },
                { name: 'Status', alignment: 'center' },
                { name: 'Scope', alignment: 'center' },
                { name: 'Description', alignment: 'left' }
            ]
        })

        commands.forEach(cmd => table.addRow(cmd))
        table.printTable()
    }

    /**
     * Load all application commands inside a directory.
     * @param dir - Application commands directory.
     * @throws {CommandManagerError} If the directory is invalid or commands are invalid
     */
    async load(dir: string): Promise<void> {
        try {
            if (!dir) {
                throw new CommandManagerError('Directory path is required')
            }

            const root = process.cwd()
            const fullPath = join(root, dir)

            try {
                await lstat(fullPath)
            } catch {
                throw new CommandManagerError(`Directory "${dir}" does not exist`)
            }

            const files = await readdir(fullPath)
            if (files.length === 0) {
                throw new CommandManagerError(`No files found in directory "${dir}"`)
            }

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
                    console.error(colors.red(`Error loading command from ${filePath}:`), error instanceof Error ? error.message : String(error))
                }
            }

            if (this.#commands.size === 0) {
                throw new CommandManagerError(`No valid commands found in directory "${dir}"`)
            }
        } catch (error: unknown) {
            if (error instanceof CommandManagerError) {
                throw error
            }
            throw new CommandManagerError(`Failed to load commands: ${error instanceof Error ? error.message : String(error)}`)
        }
    }

    /**
     * Validate and add a command to the collection
     * @private
     */
    #validateAndAddCommand(command: ICommand): void {
        if (!command.data) {
            throw new CommandManagerError('Command must have a data property')
        }

        if (!command.data.name) {
            throw new CommandManagerError('Command must have a name')
        }

        if (typeof command.data.name !== 'string') {
            throw new CommandManagerError('Command name must be a string')
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
     * @throws {CommandManagerError} If guild IDs are invalid or sync fails
     */
    async sync(guildIDs?: string[]): Promise<void> {
        try {
            if (!this.#bot.isReady()) {
                throw new CommandManagerError('Bot is not ready')
            }

            const commands = this.getCommands()
            
            if (Array.isArray(guildIDs)) {
                for (const guildId of guildIDs) {
                    try {
                        const guild = this.#bot.guilds.cache.get(guildId) ?? await this.#bot.guilds.fetch(guildId)
                        if (!guild) {
                            throw new CommandManagerError(`Invalid Guild ID: ${guildId}`)
                        }
                        await guild.commands.set(commands)
                    } catch (error) {
                        throw new CommandManagerError(`Failed to sync commands to guild ${guildId}: ${error instanceof Error ? error.message : String(error)}`)
                    }
                }
            } else {
                if (!this.#bot.application) {
                    throw new CommandManagerError('Bot application not found')
                }
                await this.#bot.application.commands.set(commands)
            }
        } catch (error: unknown) {
            if (error instanceof CommandManagerError) {
                throw error
            }
            throw new CommandManagerError(`Failed to sync commands: ${error instanceof Error ? error.message : String(error)}`)
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
                    console.error(colors.red('Failed to reload commands:'), error instanceof Error ? error.message : String(error))
                }

                return {
                    code: d.util.setCode(data)
                }
            }
        } as any)
    }
}