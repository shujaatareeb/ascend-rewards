import { SlashCommandBuilder } from "discord.js";
import { query } from "../database.js";
import { refreshAllShopMessages } from "../utils/shop.js";
import { logAdmin } from "../utils/logger.js";

export default {
  data: new SlashCommandBuilder()
    .setName("enablegame")
    .setDescription("Enable a game in the shop")
    .addStringOption(option =>
      option
        .setName("game")
        .setDescription("Game to enable")
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {

    const focused = interaction.options.getFocused();

    // only show disabled games
    const { rows } = await query(`
      SELECT DISTINCT game
      FROM stock
      WHERE game_enabled = false
      ORDER BY game
    `);

    const filtered = rows
      .filter(g =>
        g.game.toLowerCase().includes(focused.toLowerCase())
      )
      .slice(0, 25)
      .map(g => ({
        name: g.game,
        value: g.game
      }));

    await interaction.respond(filtered);
  },

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

    const game = interaction.options.getString("game");

    await query(`
      UPDATE stock
      SET game_enabled = true
      WHERE game = $1
    `, [game]);

    // refresh shop
    await refreshAllShopMessages(client);

    await interaction.reply({
      content: `✅ Game **${game}** enabled and shop updated.`,
      ephemeral: true
    });

    // ADMIN LOG
    await logAdmin(client, "Game Enabled", interaction.user, {
      Game: game
    });

  }
};