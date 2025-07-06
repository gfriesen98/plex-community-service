import config from '../config.js';
import fs from 'node:fs';
import path from 'node:path';
import { Client, Collection, Events, GatewayIntentBits, Partials } from 'discord.js';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { token, rules, prefix } = config.discord_bot.config;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel, Partials.Message, Partials.Reaction],
});

client.commands = new Collection();

(async () => {
    const folderPath = path.join(__dirname, 'commands');

    try {
        fs.accessSync(folderPath, fs.constants.R_OK);
    } catch (error) {
        console.error(`[bot] [ERROR] Commands directory not found or not readable: ${folderPath}`, error);
        return;
    }

    const commandFolders = fs.readdirSync(folderPath)
        .filter(folder => fs.lstatSync(path.join(folderPath, folder)).isDirectory());

    for (const folder of commandFolders) {
        const commandsPath = path.join(folderPath, folder);
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);

            const fileUrl = new URL(`file://${filePath}`).href;

            try {
                const commandModule = await import(fileUrl);

                const command = commandModule.default;

                if (command && 'data' in command && 'execute' in command) {
                    client.commands.set(command.data.name, command);
                } else {
                    console.log(`[bot] [WARNING] the command at ${filePath} is missing required 'data' and/or 'execute' properties, or is not a default export.`);
                }
            } catch (error) {
                console.error(`[bot] [ERROR] Failed to load command from ${filePath}:`, error);
            }
        }
    }
    console.log(`[bot] Loaded ${client.commands.size} commands.`);
})();


client.once(Events.ClientReady, ready => {
    console.log(`[bot] Ready, logged in as ${ready.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // begin check for command (any channel)
    if (!message.content.startsWith(prefix)) return;

    let command = message.content.slice(prefix.length).split(" ");
    let args = command.slice(1).join(" ");
    command = command[0];
    return;
    // not implemented
    // switch (command) {
    //     case "help":
    //         return await message.channel.send("HELP> MEE HELP MEEE");

    //     case "lookup":
    //         if (!args) return await message.channel.send("g!lookup [query]");
    //         return await message.channel.send("Lookup " + args);

    //     default:
    //         return;
    // }
});

client.on('messageReactionAdd', async (reaction, user) => {
    // When a reaction is received, check if the structure is partial
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('[bot] Something went wrong when fetching the message:', error);
            return;
        }
    }

    // react to rules to get role
    if (reaction.message.id === rules.rules_message_id) {
        const emoji = reaction.emoji;
        if (emoji.name !== rules.rules_reaction_emoji_name) return;

        console.log("[bot] rules have been agreed to");
        const guild = reaction.message.guild;
        const member = guild.members.cache.get(user.id);

        for (const roleId of rules.roles_id) {
            const role = guild.roles.cache.get(roleId.id);
            if (!role) {
                console.log(`[bot] [ERROR] Role not found with ID ${roleId}`);
                return;
            }

            try {
                await member.roles.add(role);
                console.log(`[bot] Role ${role.name} has been added to ${user.username}`);
            } catch (error) {
                console.error(`[bot] [ERROR] Failed to add role: ${error}`);
            }
        }
    } else {
        return;
    }
});

console.log('[bot] Registering InteractionCreate handler.'); // Add this line

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.user.bot) return; // Bots shouldn't trigger other bot commands

    const commandName = interaction.commandName;

    const command = interaction.client.commands.get(commandName);

    if (!command) {
        console.error(`[bot] [ERROR] (Check 1) No local command object matching "${commandName}" was found in client.commands.`);

        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: `Error: The command \`/${commandName}\` was not found or is not ready. Please try again in a moment.`,
                ephemeral: true,
            }).catch(e => console.error("Failed to reply to unknown command:", e));
        }
        return;
    }

    try {
        await command.execute(interaction);
        console.log(`[bot] Successfully executed command: /${commandName}`);
    } catch (error) {
        console.error(`[bot] [ERROR] An error occurred during execution of /${commandName}:`, error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: "There was an error executing this command", ephemeral: true });
        } else {
            await interaction.reply({ content: "There was an error executing this command", ephemeral: true });
        }
    }
});

client.login(token);

// import config from '../config.js';
// // const fs = require('node:fs');
// import fs from 'node:fs';
// // const path = require('node:path');
// import path from 'node:path';
// import { Client, Collection, Events, GatewayIntentBits, Partials } from 'discord.js';
// // const { Client, Collection, Events, GatewayIntentBits, Partials } = require('discord.js');
// const { token, rules, prefix } = config.discord_bot.config;


// const client = new Client({
//     intents: [
//         GatewayIntentBits.Guilds,
//         GatewayIntentBits.GuildMembers,
//         GatewayIntentBits.GuildMessages,
//         GatewayIntentBits.GuildMessageReactions,
//         GatewayIntentBits.MessageContent,
//     ],
//     partials: [Partials.Channel, Partials.Message, Partials.Reaction],
// });

// client.commands = new Collection();

// const folderPath = path.join(import.meta.dirname, 'commands');
// const commandFolders = fs.readdirSync(folderPath);

// for (const folder of commandFolders) {
//     const commandsPath = path.join(folderPath, folder);
//     const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
//     for (const file of commandFiles) {
//         const filePath = path.join(commandsPath, file);
//         const command = require(filePath);
//         if ('data' in command && 'execute' in command) {
//             client.commands.set(command.data.name, command);
//         } else {
//             console.log(`[bot] [WARNING] the command at ${filePath} is missing required 'data' and/or 'execute' propterties`);
//         }
//     }
// }

// client.once(Events.ClientReady, ready => {
//     console.log(`[bot] Ready, logged in as ${ready.user.tag}`);
// });

// client.on('messageCreate', async (message) => {
//     if (message.author.bot) return;

//     // begin check for command (any channel)
//     if (!message.content.startsWith(prefix)) return;

//     let command = message.content.slice(prefix.length).split(" ");
//     let args = command.slice(1).join(" ");
//     command = command[0];
//     return;
//     // not implemented
//     // switch (command) {
//     //     case "help":
//     //         return await message.channel.send("HELP> MEE HELP MEEE");

//     //     case "lookup":
//     //         if (!args) return await message.channel.send("g!lookup [query]");
//     //         return await message.channel.send("Lookup " + args);

//     //     default:
//     //         return;
//     // }
// });

// client.on('messageReactionAdd', async (reaction, user) => {
//     // When a reaction is received, check if the structure is partial
//     if (reaction.partial) {
//         try {
//             await reaction.fetch();
//         } catch (error) {
//             console.error('[bot] Something went wrong when fetching the message:', error);
//             return;
//         }
//     }

//     // react to rules to get role
//     if (reaction.message.id === rules.rules_message_id) {
//         const emoji = reaction.emoji;
//         if (emoji.name !== rules.rules_reaction_emoji_name) return;

//         console.log("[bot] rules have been agreed to");
//         const guild = reaction.message.guild;
//         const member = guild.members.cache.get(user.id);

//         for (const roleId of rules.roleId) {
//             const role = guild.roles.cache.get(roleId);
//             if (!role) {
//                 console.log(`[bot] [ERROR] Role not found with ID ${roleId}`);
//                 return;
//             }

//             try {
//                 await member.roles.add(role);
//                 console.log(`[bot] Role ${role.name} has been added to ${user.username}`);
//             } catch (error) {
//                 console.error(`[bot] [ERROR] Failed to add role: ${error}`);
//             }
//         }
//     } else {
//         return;
//     }
// });

// client.on(Events.InteractionCreate, async interaction => {
//     if (!interaction.isChatInputCommand()) return;
//     if (!interaction.isCommand()) return;
//     if (interaction.user.bot) return;
//     const command = interaction.client.commands.get(interaction.commandName);
//     if (!command) {
//         console.error(`[bot] [ERROR] No command matching ${interaction.commandName} was found`);
//         return;
//     }

//     try {
//         await command.execute(interaction);
//     } catch (error) {
//         console,error(`[bot] [ERROR] `, error);
//         if (interaction.replied || interaction.deferred) {
//             await interaction.followUp({ content: "There was an error executing this command" });
//         } else {
//             await interaction.reply({ content: "There was an error executing this command" });
//         }
//     }
// });

// client.login(token);