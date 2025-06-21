const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const Logging = require('../../../util/logging');
const { parseDiscordRequestString } = require('../../../util/common');
const { request_url_template, channels } = require('../../../config').discord_bot.config;
const path = require('path');

const logger = new Logging('daily', path.resolve(__dirname, '..', '..', '..', 'logs'));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('request')
        .setDescription("Request stuff")
        .addStringOption(option => option.setName("requests").setDescription("Comma seperated input of content names. Ex: Movie (2024), Show (1999)").setRequired(true)),
    async execute(interaction) {
        try {
            const requests = interaction.options.getString("requests");
            if (!requests) await interaction.followUp("Give me a list of stuff you want");
            const requests_split = requests.split(",").map(n => n.trim());
            const date = new Date();
            const date_string = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
            const running_user = interaction.user.username;
    
            const urls = [];
            let obj = {};
            for (let request of requests_split) {
                if (request_url_template !== false && typeof request_url_template === 'string' && request_url_template.length > 0) {
                    const uri_encoded = encodeURIComponent(request);
                    const url = request_url_template.replace("{query}", uri_encoded);
                    obj = {
                        request: request,
                        url,
                        message: `**${request}**\n> [link](${url})`
                    };
                } else {
                    obj = {
                        request: request,
                        url: "none",
                        message: `**${request}**\n`
                    }
                }
    
                urls.push(obj.message);
            }
    
            const target_channel = await interaction.client.channels.fetch(channels.requests);
            let message = `## Request from ${running_user} on ${date_string}\n`
            message += urls.join('\n');
            await target_channel.send(message);
            
            await logger.write('request', true, parseDiscordRequestString(message));
    
            await interaction.reply({
                content: "I got u",
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            console.error(error);
        }
    }
}