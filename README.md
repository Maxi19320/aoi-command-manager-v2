# aoi-command-manager

Un gestor de comandos de barra (slash commands) para aoi.js que permite cargar y sincronizar comandos de manera eficiente.

## Instalación

```bash
npm install aoi-command-manager
```

## Uso

```javascript
const { AoiClient } = require('aoi.js');
const { ApplicationCommandManager } = require('aoi-command-manager');
const { join } = require('path');

const client = new AoiClient({
    token: "TU_TOKEN",
    prefix: "!",
    intents: ["MessageContent", "Guilds", "GuildMessages"],
    events: ["onMessage", "onInteractionCreate"]
});

// Inicializar el gestor de comandos
const apps = new ApplicationCommandManager(client);

// Cargar comandos desde un directorio
apps.load(join(__dirname, 'slashcommands'), true).then(() => {
    setTimeout(function () {
        if (client.isReady()) {
            apps.sync()
            console.log('╭───────────────────────────────╮'.yellow)
            console.log('│   Comandos de barra cargados  │'.yellow)
            console.log('╰───────────────────────────────╯'.yellow)
        }
    }, 5000)
});

// Para sincronizar comandos específicos de servidor:
// apps.sync(['ID_DEL_SERVIDOR']);

client.onMessage();
```

## Estructura de un Comando

```javascript
module.exports = {
    name: "ping",
    type: "slash",
    code: `
        $interactionReply[Pong! 🏓]
    `,
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Muestra la latencia del bot"),
    cooldown: 5000 // Cooldown en milisegundos (opcional)
}
```

## Características

- Carga automática de comandos desde un directorio
- Sincronización con Discord API
- Soporte para comandos globales y por servidor
- Sistema de cooldown integrado
- Totalmente tipado con TypeScript
- Compatible con aoi.js

## Funciones Disponibles

- `$applicationCommandSync[guildIDs?]` - Sincroniza los comandos con Discord
- `$applicationCommandReload` - Recarga los comandos
- `$applicationCommandCooldown[commandName;userId]` - Verifica el cooldown de un comando

## Licencia

MIT