import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { pool, getUser } from "../database.js";
import { logAdmin } from "../utils/logger.js";

export default {

  data: new SlashCommandBuilder()
    .setName("sethold")
    .setDescription("Set a user's hold balance (Admin only)")
    .addUserOption(o =>
      o.setName("user")
       .setDescription("Target user")
       .setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("amount")
       .setDescription("Hold balance")
       .setRequired(true)
       .setMinValue(0)
    ),

  async execute(interaction, client) {

    const isAdmin =
      interaction.member.roles.cache.has(process.env.ADMIN_ROLE_ID) ||
      interaction.member.permissions.has("Administrator");

    if (!isAdmin) {
      return interaction.reply({
        content: "❌ Admin only command.",
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const target = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");

    const before = await getUser(target.id);

    await pool.query(
      `UPDATE users SET balance_hold = $2 WHERE user_id = $1`,
      [target.id, amount]
    );

    const embed = new EmbedBuilder()
      .setTitle("Hold Balance Set")
      .setColor(0xFEE75C)
      .addFields(
        { name: "User", value: `<@${target.id}>`, inline: true },
        { name: "Previous Hold", value: `${before.balance_hold} AC`, inline: true },
        { name: "New Hold Balance", value: `${amount} AC`, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    /* ADMIN LOG */

    await logAdmin(client, "Set Hold Balance", interaction.user, {
      "User": `${target.tag} (${target.id})`,
      "Previous Hold": `${before.balance_hold} AC`,
      "New Hold": `${amount} AC`
    });

  }

};