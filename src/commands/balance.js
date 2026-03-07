import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { getUser } from "../database.js";
import { buildBalanceEmbed } from "../utils/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Check Ascend Credits balance")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("User to check balance for")
        .setRequired(false)
    ),

  async execute(interaction) {

    await interaction.deferReply({ ephemeral: true });

    const targetUser = interaction.options.getUser("user") || interaction.user;

    if (
      targetUser.id !== interaction.user.id &&
      !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
    ) {
      return interaction.editReply({
        content: "❌ Only admins can check other users' balances."
      });
    }

    const user   = await getUser(targetUser.id);
    const member = await interaction.guild.members.fetch(targetUser.id);

    const embed = buildBalanceEmbed(user, member);

    await interaction.editReply({
      embeds: [embed]
    });

  },
};
