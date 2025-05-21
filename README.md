# aoi-command-manager-v2

A command manager for aoi.js that handles slash commands with ease.

## Features

- 🔄 Automatic command synchronization with Discord API
- 📁 Easy command loading from directories
- ✅ Command validation
- 📊 Command status display
- 🔍 Update checker
- 🛠️ Built-in functions for aoi.js

## Installation

```bash
npm install aoi-command-manager-v2
```

## Quick Start

```javascript
const { AoiClient } = require('aoi.js')
const { ApplicationCommandManager } = require('aoi-command-manager-v2')

const bot = new AoiClient({
    token: 'YOUR_BOT_TOKEN',
    prefix: '!',
    intents: ['Guilds', 'GuildMessages']
})

// Initialize the command manager
new ApplicationCommandManager(bot, {
    path: './commands', // Path to your commands directory
    showTable: true, // Show command table (default: true)
    validateCommands: true, // Validate commands (default: true)
    checkUpdates: true // Check for updates (default: true)
})
```

## Command Structure

```javascript
module.exports = {
    name: 'ping',
    type: 'slash',
    code: async (d) => {
        return d.reply('Pong!')
    },
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check bot latency')
}
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| path | string | undefined | Path to commands directory |
| showTable | boolean | true | Show command table after loading |
| validateCommands | boolean | true | Validate commands before loading |
| checkUpdates | boolean | true | Check for package updates |

## Built-in Functions

### $applicationCommandSync
Syncs commands with Discord API.

```javascript
$applicationCommandSync[guildId1,guildId2] // Optional guild IDs
```

### $applicationCommandReload
Reloads all commands from the directory.

```javascript
$applicationCommandReload
```

## Command Table

The command table shows the status of each loaded command:

```
Loaded Slash Commands
|---------|--------|-------|
| Name    | Status | Error |
|---------|--------|-------|
| ping    |   ✅   |       |
| help    |   ❌   | Missing description |
|---------|--------|-------|
```

## License

MIT
