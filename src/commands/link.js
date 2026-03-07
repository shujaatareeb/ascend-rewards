import { SlashCommandBuilder } from "discord.js";

import {
  getAllStock,
  upsertShopMessage
} from "../database.js";

import { buildShopEmbed } from "../utils/embeds.js";
import { buildShopRow } from "../utils/shop.js";
import { getCatalogItems } from "../utils/catalogLoader.js";


export default {

  data: new SlashCommandBuilder()
    .setName("link")
    .setDescription("Link this channel as the Ascend Rewards shop and post the store embed"),

  async execute(interaction) {

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

    // ─────────────────────────────
    // Load catalog items
    // ─────────────────────────────

    const catalog = getCatalogItems();

    // ─────────────────────────────
    // Load database stock
    // ─────────────────────────────

    const dbStock = await getAllStock();

    // ─────────────────────────────
    // Merge catalog + stock
    // ─────────────────────────────

    const items = catalog.map(item => {

      const dbItem = dbStock.find(
        s =>
          s.game === item.game &&
          s.denomination === item.denomination
      );

      return {
        ...item,
        quantity: dbItem ? dbItem.quantity : 0
      };

    });

    // ─────────────────────────────
    // Build shop embed
    // ─────────────────────────────

    const embed = buildShopEmbed(items);
    const row = buildShopRow();

    const msg = await interaction.channel.send({
      embeds: [embed],
      components: [row],
      files: ["./ascend-banner.png"]
    });

    // Save message for auto refresh
    await upsertShopMessage(
      interaction.channelId,
      msg.id,
      interaction.guildId
    );

    await interaction.editReply({
      content: "✅ Shop embed posted and linked to this channel!"
    });

  }

};