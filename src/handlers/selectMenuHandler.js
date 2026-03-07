import {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { getStockById, getUser, getAvailableStock } from "../database.js";
import { buildConfirmationEmbed } from "../utils/embeds.js";
import { buildConfirmButtons } from "../utils/ticket.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const catalogPath = path.join(__dirname, "..", "data", "catalog.json");
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

/* ───────────── GAME IMAGES ───────────── */

const GAME_IMAGES = {
  "Genshin Impact - Genesis Crystals":
    "https://dqdiyeivuyewpjzrujaa.supabase.co/storage/v1/object/public/artemis/Genshin%20Impact.png",

  "BGMI - Unknown Cash":
    "https://dqdiyeivuyewpjzrujaa.supabase.co/storage/v1/object/public/artemis/bgmi.png",

  "Minecraft - Minecoins":
    "https://dqdiyeivuyewpjzrujaa.supabase.co/storage/v1/object/public/artemis/Minecraft%20Image.jpg",

  "Mobile Legends - Diamonds":
    "https://public-assets-412869001590.s3.ap-south-1.amazonaws.com/discord-bot-images/Frame1566663017.jpeg",

  "Roblox - USD Credits":
    "https://dqdiyeivuyewpjzrujaa.supabase.co/storage/v1/object/public/artemis/Roblox%20Image.png",

  "Steam - Steam Wallet Balance":
    "https://dqdiyeivuyewpjzrujaa.supabase.co/storage/v1/object/public/artemis/Steam%20Image.png",

  "Valorant - Valorant Points":
    "https://dqdiyeivuyewpjzrujaa.supabase.co/storage/v1/object/public/artemis/Valorant%20Image.png"
};

export async function selectMenuHandler(client, interaction) {

  const { customId } = interaction;

  /* ───────────── GAME SELECT ───────────── */

  if (customId === "game_select") {

    const game = interaction.values[0].split(":")[1];

    const stock = await getAvailableStock();
    const items = stock
      .filter(s => s.game === game)
      .sort((a, b) => a.ac_cost - b.ac_cost);

    if (!items.length) {
      return interaction.update({
        content: "❌ No packages available for this game.",
        embeds: [],
        components: []
      });
    }

    const user = await getUser(interaction.user.id);

    const product = catalog.products.find(p => p.game === game);
    const description = product?.description ?? "";

    let offers = "";

    for (const item of items) {
      offers += `• **${item.denomination} → ${item.ac_cost} AC**\n`;
    }

    const embed = new EmbedBuilder()
      .setTitle(`🎮 ${game}`)
      .setDescription(
        `${description}\n\n` +
        `**Available Offers**\n${offers}\n` +
        `Select a package from the dropdown below.`
      )
      .setThumbnail(GAME_IMAGES[game] || null)
      .addFields({
        name: "💳 Available Balance",
        value: `**${user.balance} AC**`
      })
      .setColor(0x5865F2);

    const options = items.map(item =>
      new StringSelectMenuOptionBuilder()
        .setValue(String(item.id))
        .setLabel(item.denomination)
        .setDescription(`${item.ac_cost} AC`)
    );

    const menu = new StringSelectMenuBuilder()
      .setCustomId("stock_select")
      .setPlaceholder("Select a package")
      .addOptions(options);

    const row1 = new ActionRowBuilder().addComponents(menu);

    const backButton = new ButtonBuilder()
      .setCustomId("shop_back")
      .setLabel("Back")
      .setEmoji("⬅")
      .setStyle(ButtonStyle.Secondary);

    const row2 = new ActionRowBuilder().addComponents(backButton);

    return interaction.update({
      embeds: [embed],
      components: [row1, row2]
    });
  }

  /* ───────────── PACKAGE SELECT ───────────── */

  if (customId === "stock_select") {

    const stockId = Number(interaction.values[0]);

    if (!stockId) {
      return interaction.update({
        content: "❌ Invalid package selected.",
        embeds: [],
        components: []
      });
    }

    const stock = await getStockById(stockId);

    if (!stock || !stock.enabled || !stock.game_enabled) {
      return interaction.update({
        content: "❌ This item is no longer available.",
        embeds: [],
        components: []
      });
    }

    const user = await getUser(interaction.user.id);

    if (user.balance < stock.ac_cost) {
      return interaction.update({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌ Insufficient Credits")
            .setColor(0xED4245)
            .setDescription(
              `You need **${stock.ac_cost} AC** but only have **${user.balance} AC**`
            )
        ],
        components: []
      });
    }

    const embed = buildConfirmationEmbed(stock, user);
    const row = buildConfirmButtons(stockId);

    return interaction.update({
      embeds: [embed],
      components: [row]
    });
  }

}