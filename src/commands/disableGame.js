import { SlashCommandBuilder } from "discord.js";
import { refreshAllShopMessages } from "../utils/shop.js";
import { query } from "../database.js";
import { logAdmin } from "../utils/logger.js";

export default {
  data: new SlashCommandBuilder()
    .setName("disablegame")
    .setDescription("Disable a game in the shop")
    .addStringOption(option =>
      option
        .setName("game")
        .setDescription("Game to disable")
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    try {

      const focused = interaction.options.getFocused();

      // only show enabled games
      const { rows } = await query(`
        SELECT DISTINCT game
        FROM stock
        WHERE game_enabled = true
        ORDER BY game
      `);

      const results = rows
        .filter(g =>
          g.game.toLowerCase().includes(focused.toLowerCase())
        )
        .slice(0, 25)
        .map(g => ({
          name: g.game,
          value: g.game
        }));

      await interaction.respond(results);

    } catch (err) {

      console.error("Autocomplete error:", err);
      await interaction.respond([]);

    }
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
      SET game_enabled = false
      WHERE game = $1
    `, [game]);

    // refresh shop message
    await refreshAllShopMessages(client);

    await interaction.reply({
      content: `❌ Game **${game}** disabled and shop updated.`,
      ephemeral: true
    });
    await logAdmin(client, "Game Disabled", interaction.user, {
      Game: game
    });

  }
};
