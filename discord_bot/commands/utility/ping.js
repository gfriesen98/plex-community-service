import { SlashCommandBuilder } from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName('bing')
        .setDescription("Replies with bong"),
    async execute(interaction) {
        await interaction.reply("bong");
    }
}