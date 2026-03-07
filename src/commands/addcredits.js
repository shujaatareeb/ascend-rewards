import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { addCredits, logCredit } from "../database.js";
import { logAdmin } from "../utils/logger.js";

export default {

  data: new SlashCommandBuilder()
    .setName("addcredits")
    .setDescription("Add Ascend Credits to a user (Admin only)")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("Target user")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("amount")
        .setDescription("Amount of AC to add")
        .setRequired(true)
        .setMinValue(1)
    )
    .addStringOption(option =>
      option
        .setName("reason")
        .setDescription("Reason (optional)")
        .setRequired(false)
    ),

  async execute(interaction, client) {

    /* ───────── ADMIN CHECK ───────── */

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

    /* ───────── GET OPTIONS ───────── */

    const target = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");
    const reason =
      interaction.options.getString("reason") ?? "No reason provided";

    /* ───────── ADD CREDITS ───────── */

    const updated = await addCredits(target.id, amount);

    await logCredit(
      target.id,
      amount,
      "add",
      reason,
      interaction.user.id
    );

    /* ───────── RESPONSE EMBED ───────── */

    const embed = new EmbedBuilder()
      .setTitle("✅ Credits Added")
      .setColor(0x57F287)
      .addFields(
        { name: "User", value: `<@${target.id}>`, inline: true },
        { name: "Added", value: `**${amount} AC**`, inline: true },
        { name: "New Balance", value: `**${updated.balance} AC**`, inline: true },
        { name: "Reason", value: reason }
      )
      .setFooter({ text: "Ascend Rewards" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    /* ───────── DM USER ───────── */

    try {

      const dmEmbed = new EmbedBuilder()
        .setAuthor({
          name: "Ascend Rewards",
          iconURL: "attachment://ascendlogo.png"
        })
        .setTitle("Credits Added to Your Account")
        .setColor(0x57F287)
        .setDescription("🎉 Your **Ascend Credits** balance has been updated.")
        .addFields(
          { name: "💰 Credits Added", value: `\`${amount} AC\``, inline: true },
          { name: "📊 New Balance", value: `\`${updated.balance} AC\``, inline: true },
          { name: "📝 Reason", value: reason, inline: false }
        )
        .setFooter({ text: "Ascend Rewards • Credits System" })
        .setTimestamp();

      await target.send({
        embeds: [dmEmbed],
        files: ["./ascendlogo.png"] // correct path
      });

    } catch {
      // Ignore if user has DMs disabled
    }

    /* ───────── ADMIN LOG ───────── */

    await logAdmin(client, "Add Credits", interaction.user, {
      User: `${target.tag} (${target.id})`,
      Amount: `${amount} AC`,
      Balance: `${updated.balance} AC`,
      Reason: reason
    });

  }

};