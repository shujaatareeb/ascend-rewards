import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { setCredits, getUser, logCredit } from "../database.js";
import { logAdmin } from "../utils/logger.js";

export default {

  data: new SlashCommandBuilder()
    .setName("setcredits")
    .setDescription("Set a user's Ascend Credits to a specific amount (Admin only)")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("Target user")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("amount")
        .setDescription("New AC balance")
        .setRequired(true)
        .setMinValue(0)
    ),

  async execute(interaction, client) {

    const isAdmin =
      interaction.member.roles.cache.has(process.env.ADMIN_ROLE_ID) ||
      interaction.member.permissions.has("Administrator");

    if (!isAdmin) {
      return interaction.reply({
        content: "❌ You need the **Admin** role to use this command.",
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const target = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");

    const before = await getUser(target.id);
    const updated = await setCredits(target.id, amount);

    await logCredit(
      target.id,
      amount,
      "set",
      `Set from ${before.balance} to ${amount}`,
      interaction.user.id
    );

    /* ADMIN RESPONSE */

    const embed = new EmbedBuilder()
      .setTitle("Credits Set")
      .setColor(0xFEE75C)
      .addFields(
        { name: "User", value: `<@${target.id}>`, inline: true },
        { name: "Previous Balance", value: `${before.balance} AC`, inline: true },
        { name: "New Balance", value: `**${amount} AC**`, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    /* DM USER */

    try {

      const dmEmbed = new EmbedBuilder()
        .setTitle("Credits Updated")
        .setColor(0xFEE75C)
        .setDescription("Your Ascend Credits balance has been updated by an administrator.")
        .addFields(
          { name: "Previous Balance", value: `${before.balance} AC`, inline: true },
          { name: "New Balance", value: `${amount} AC`, inline: true }
        )
        .setFooter({ text: "Ascend Rewards" })
        .setTimestamp();

      await target.send({ embeds: [dmEmbed] });

    } catch {
      // Ignore if user has DMs disabled
    }

    /* ADMIN LOG */

    await logAdmin(client, "Set Credits", interaction.user, {
      User: `${target.tag} (${target.id})`,
      Previous: `${before.balance} AC`,
      NewBalance: `${amount} AC`
    });

  }

};