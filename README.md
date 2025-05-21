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

const client = new AoiClient({
    token: "TU_TOKEN",
    prefix: "!",
    intents: ["MessageContent", "Guilds", "GuildMessages"],
    events: ["onMessage", "onInteractionCreate"]
});

// Inicializar el gestor de comandos con opciones
const apps = new ApplicationCommandManager(client, {
    // Ruta a la carpeta de comandos
    path: './slashcommands',
    // IDs de servidores específicos (opcional, si no se especifica son comandos globales)
    guildIds: ['ID_SERVIDOR_1', 'ID_SERVIDOR_2'],
    // Mostrar tabla de comandos cargados (por defecto: true)
    showTable: true
});

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

## Opciones de Configuración

| Opción | Tipo | Descripción | Por defecto |
|--------|------|-------------|-------------|
| path | string | Ruta a la carpeta de comandos | undefined |
| guildIds | string[] | IDs de servidores para comandos específicos | undefined |
| showTable | boolean | Mostrar tabla de comandos cargados | true |

## Ejemplo de Salida

```
╭───────────────────────────────╮
│   Comandos de barra cargados  │
│ Name │Status│Guild/Global│
├───────────────────────────────┤
│ ping │ ✅  │ Global     │
│ help │ ✅  │ Guild      │
│ info │ ✅  │ Global     │
╰───────────────────────────────╯
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