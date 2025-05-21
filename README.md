# aoi-command-manager

Un gestor de comandos de aplicación para sincronizar fácilmente tus Slash Commands con la API de Discord usando aoi.js.

## Características

- Carga automática de comandos desde un directorio
- Sincronización de comandos con Discord
- Soporte para comandos globales y por servidor
- Sistema de cooldown integrado
- Soporte para comandos de tipo Slash y Context Menu
- Validación de comandos
- Manejo de errores mejorado
- Soporte completo para TypeScript

## Instalación

```bash
npm install aoi-command-manager
```

## Uso

```javascript
const { AoiClient } = require('aoi.js');
const { ApplicationCommandManager } = require('aoi-command-manager');

const bot = new AoiClient({
    token: 'tu-token',
    prefix: '!',
    intents: ['GUILDS', 'GUILD_MESSAGES']
});

// Inicializar el gestor de comandos
new ApplicationCommandManager(bot);

// Cargar comandos desde un directorio
await bot.slashCommandManager.load('./commands');

// Sincronizar comandos con Discord
// Para comandos globales:
await bot.slashCommandManager.sync();

// Para comandos específicos de servidor:
await bot.slashCommandManager.sync(['ID_DEL_SERVIDOR']);
```

## Estructura de Comandos

```typescript
interface ICommand {
    data: SlashCommandBuilder | Record<string, any>;
    type?: ApplicationCommandType;
    guildOnly?: boolean;
    cooldown?: number;
    permissions?: bigint[];
}
```

### Ejemplo de Comando

```javascript
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Responde con Pong!'),
    cooldown: 5000, // 5 segundos de cooldown
    guildOnly: true,
    async execute(interaction) {
        await interaction.reply('Pong!');
    }
};
```

## Funciones de Aoi.js

### $applicationCommandSync
Sincroniza los comandos con Discord.

```javascript
$applicationCommandSync[guildIDs?]
```

### $applicationCommandReload
Recarga los comandos desde el directorio especificado.

```javascript
$applicationCommandReload
```

### $applicationCommandCooldown
Verifica el cooldown de un comando para un usuario específico.

```javascript
$applicationCommandCooldown[commandName;userId]
```

## Contribuir

Las contribuciones son bienvenidas. Por favor, asegúrate de:

1. Hacer fork del repositorio
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia ISC - ver el archivo [LICENSE](LICENSE) para más detalles.