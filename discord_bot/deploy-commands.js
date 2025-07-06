import config from '../config.js';
import { REST, Routes } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { client_id, guild_id, token } = config.discord_bot.config;

const commands = [];
const foldersPath = path.join(__dirname, 'commands');

try {
    fs.accessSync(foldersPath, fs.constants.R_OK);
} catch (error) {
    console.error(`[ERROR] Commands directory not found or not readable: ${foldersPath}`, error);
    process.exit(1);
}

const commandFolders = fs.readdirSync(foldersPath)
    .filter(folder => fs.lstatSync(path.join(foldersPath, folder)).isDirectory()); // Ensure only directories

const rest = new REST().setToken(token);


(async () => {
    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const fileUrl = new URL(`file://${filePath}`).href;

            try {
                const commandModule = await import(fileUrl);
                const command = commandModule.default;

                if (command && 'data' in command && 'execute' in command) {
                    commands.push(command.data.toJSON());
                } else {
                    console.log(`[WARNING] The command at ${filePath} is missing required "data" and/or "execute" properties, or is not a default export.`);
                }
            } catch (error) {
                console.error(`[ERROR] Failed to load command from ${filePath}:`, error);
            }
        }
    }

    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const data = await rest.put(
            Routes.applicationGuildCommands(client_id, guild_id),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();