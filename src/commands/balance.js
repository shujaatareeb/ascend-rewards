import { SlashCommandBuilder } from 'discord.js';
import { getUser } from '../database.js';
import { buildBalanceEmbed } from '../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your Ascend Credits balance'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const user   = await getUser(interaction.user.id);
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const embed  = buildBalanceEmbed(user, member);

    await interaction.editReply({ embeds: [embed] });
  },
};
