# aoi-command-manager-v2

A command manager for aoi.js that handles slash commands with ease.

## Features

- 🔄 Automatic command synchronization with Discord API
- 📁 easy way to create, edit a slash command
- ✅ Command validation and error checking

## Installation

```bash
npm install aoi-command-manager-v2
```

## Quick Start

```javascript
const { AoiClient } = require('aoi.js')
const { ApplicationCommandManager } = require('aoi-command-manager-v2')

const bot = new AoiClient({
    token: "YOUR TOKEN",
    prefix: "!",
    intents: ["MessageContent", "Guilds", "GuildMessages"],
    events: ["onMessage", "onInteractionCreate"],
    database: {
        type: "aoi.db",
        db: require("@aoijs/aoi.db"),
        dbType: "KeyValue",
        tables: ["main"],
        securityKey: "a-32-characters-long-string-here"
    }
});

// Initialize the command manager
new ApplicationCommandManager(bot, {
    path: './slashcommads', // Path to your commands directory
    showTable: true, // Show command table (default: true)
    validateCommands: true, // Validate commands (default: true)
    checkUpdates: true // Check for updates (default: true)
})

client.loadCommands("./commands")
```

Examples:

## Command Structure

```javascript
module.exports = {
    name: 'ping',
    type: 'slash',
    prototype: "interaction",
    code: `$interactionReply[My ping is $pingms]`
}
```

## Slash Structure

```javascript
const { SlashCommandBuilder } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
    .setName('ping')
	.setDescription("shows the bot's ping")
}
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| path | string |-| Path to commands directory |
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

### $applicationCommandValidate
Validates all slash commands and displays any errors found.

```javascript
$applicationCommandValidate
```

Example output:
```
Slash Command Validation Errors:
❌ ping: Missing description
❌ help: Name must be between 1 and 32 characters
❌ settings: Option 'channel' missing description
```

## Command Table

The command table shows the status of each loaded command
