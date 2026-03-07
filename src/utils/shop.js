import { getAllShopMessages, getAllStock } from "../database.js";
import { buildShopEmbed } from "./embeds.js";
import { getCatalogItems } from "./catalogLoader.js";

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";


// ─────────────────────────────────────────────
// Shop buttons
// ─────────────────────────────────────────────

export function buildShopRow() {

  return new ActionRowBuilder().addComponents(

    new ButtonBuilder()
      .setCustomId("shop_redeem")
      .setLabel("🛒 Redeem")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("shop_viewcredits")
      .setLabel("💰 View Credits")
      .setStyle(ButtonStyle.Secondary)

  );

}


// ─────────────────────────────────────────────
// Refresh shop messages
// ─────────────────────────────────────────────

export async function refreshAllShopMessages(client) {

  try {

    // Load catalog items
    const catalogItems = getCatalogItems();

    // Load stock from DB
    const stockRows = await getAllStock();

    // Load shop messages
    const shopMessages = await getAllShopMessages();

    // Map stock quantities
    const quantityMap = {};

    for (const row of stockRows) {
      quantityMap[row.id] = row.quantity;
    }

    // Merge catalog + quantity
    const items = catalogItems.map(item => ({
      ...item,
      quantity: quantityMap[item.id] ?? 0
    }));


    const embed = buildShopEmbed(items);
    const row = buildShopRow();


    for (const shop of shopMessages) {

      const channel = await client.channels.fetch(shop.channel_id).catch(() => null);
      if (!channel) continue;

      const message = await channel.messages.fetch(shop.message_id).catch(() => null);
      if (!message) continue;

      await message.edit({
        embeds: [embed],
        components: [row]
      });

    }

  } catch (err) {

    console.error("[shop] refreshAllShopMessages error:", err);

  }

}
const catalogItems = getCatalogItems();
console.log("Catalog items loaded:", catalogItems.length);