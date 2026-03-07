import { SlashCommandBuilder } from "discord.js";
import { query } from "../database.js";
import { refreshAllShopMessages } from "../utils/shop.js";
import { logAdmin } from "../utils/logger.js";

export default {

  data: new SlashCommandBuilder()
    .setName("enablestock")
    .setDescription("Enable a package")
    .addStringOption(option =>
      option
        .setName("game")
        .setDescription("Select a game")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption(option =>
      option
        .setName("stock")
        .setDescription("Package")
        .setRequired(true)
        .setAutocomplete(true)
    ),

  /* ───────── AUTOCOMPLETE ───────── */

  async autocomplete(interaction) {

    const focused = interaction.options.getFocused(true);

    /* GAME LIST */

    if (focused.name === "game") {

      const { rows } = await query(`
        SELECT DISTINCT game
        FROM stock
        WHERE enabled = false
        ORDER BY game
      `);

      const filtered = rows
        .filter(g =>
          g.game.toLowerCase().includes(focused.value.toLowerCase())
        )
        .slice(0, 25)
        .map(g => ({
          name: g.game,
          value: g.game
        }));

      return interaction.respond(filtered);
    }

    /* STOCK LIST */

    if (focused.name === "stock") {

      const game = interaction.options.getString("game");

      if (!game) return interaction.respond([]);

      const { rows } = await query(`
        SELECT id, denomination
        FROM stock
        WHERE game = $1
        AND enabled = false
        ORDER BY ac_cost
      `, [game]);

      const filtered = rows
        .filter(s =>
          s.denomination.toLowerCase().includes(focused.value.toLowerCase())
        )
        .slice(0, 25)
        .map(s => ({
          name: s.denomination,
          value: String(s.id)
        }));

      return interaction.respond(filtered);
    }

  },

  /* ───────── EXECUTE ───────── */

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

    const stockId = interaction.options.getString("stock");

    /* get stock info */

    const { rows } = await query(`
      SELECT game, denomination
      FROM stock
      WHERE id = $1
    `, [stockId]);

    const item = rows[0];

    if (!item) {
      return interaction.reply({
        content: "❌ Stock not found.",
        ephemeral: true
      });
    }

    /* enable package */

    await query(`
      UPDATE stock
      SET enabled = true
      WHERE id = $1
    `, [stockId]);

    /* refresh shop */

    await refreshAllShopMessages(client);

    await interaction.reply({
      content: `✅ Package **${item.denomination}** enabled.`,
      ephemeral: true
    });

    /* admin log */

    await logAdmin(client, "Stock Enabled", interaction.user, {
      Game: item.game,
      Denomination: item.denomination
    });

  }

};