const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bing')
        .setDescription("Replies with bong"),
    async execute(interaction) {
        await interaction.reply("bong");
    }
}