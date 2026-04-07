export * from "./utils/format.js";
import {
  Client,
  GatewayIntentBits,
  Collection,
  ActivityType
} from "discord.js";

import { config } from "dotenv";
import { readdirSync } from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import { dirname, join } from "path";

import { interactionHandler } from "./handlers/interactionHandler.js";
import { syncCatalogToStock } from "./database.js";
import { refreshAllShopMessages } from "./utils/shop.js";

config();


// ─────────────────────────────────────────────
// Validate env
// ─────────────────────────────────────────────

const REQUIRED_ENV = [
  "DISCORD_BOT_TOKEN",
  "DISCORD_GUILD_ID",
  "MOD_ROLE_ID",
  "ADMIN_ROLE_ID",
  "PURCHASES_CHANNEL_ID",
  "TICKET_CATEGORY_ID",
  "TICKET_TRANSCRIPTS_CHANNEL_ID",
  "ADMIN_LOGS_CHANNEL_ID",
  "DATABASE_URL",
];

const missing = REQUIRED_ENV.filter((k) => !process.env[k]);

if (missing.length > 0) {
  console.error("❌ Missing required environment variables:\n  " + missing.join("\n  "));
  process.exit(1);
}


// ─────────────────────────────────────────────
// Client
// ─────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();


// ─────────────────────────────────────────────
// Load commands
// ─────────────────────────────────────────────

const commandsPath = join(__dirname, "commands");
const commandFiles = readdirSync(commandsPath).filter((f) => f.endsWith(".js"));

for (const file of commandFiles) {

  const mod = await import(pathToFileURL(join(commandsPath, file)));

  client.commands.set(mod.default.data.name, mod.default);

  console.log(`↳ Command loaded: ${mod.default.data.name}`);

}


// ─────────────────────────────────────────────
// Ready event
// ─────────────────────────────────────────────

client.once("clientReady", async () => {

  console.log(`\n✅ Ascend Rewards Bot is online as ${client.user.tag}`);
  console.log(`Guild: ${process.env.DISCORD_GUILD_ID}`);

  client.user.setActivity("Ascend Rewards Shop", {
    type: ActivityType.Watching,
  });

  try {

    console.log("🔄 Syncing catalog to stock database...");

    await syncCatalogToStock();

    console.log("✅ Catalog synced successfully.");

    // IMPORTANT: refresh shop embed after sync
    await refreshAllShopMessages(client);

    console.log("🛍️ Shop messages refreshed.");

  } catch (err) {

    console.error("❌ Failed to sync catalog:", err);

  }

});


// ─────────────────────────────────────────────
// Interactions
// ─────────────────────────────────────────────

client.on("interactionCreate", (interaction) =>
  interactionHandler(client, interaction)
);


// ─────────────────────────────────────────────
// Error handling
// ─────────────────────────────────────────────

client.on("error", (err) =>
  console.error("[discord] Client error:", err)
);

process.on("unhandledRejection", (err) =>
  console.error("[process] Unhandled rejection:", err)
);
import {
  getChatRewardConfig,
  trackMessage,
  resetChatTracking,
  addCredits,
  logCredit,
} from "./database.js";

// Add this after interactionCreate:
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;   // ignore DMs

  const config = await getChatRewardConfig();
  if (!config) return;          // no reward set yet

  const count = await trackMessage(message.author.id);

  if (count >= config.messages) {
    // Threshold hit — award immediately and reset
    await resetChatTracking(message.author.id);
    const updated = await addCredits(message.author.id, config.credits);
    await logCredit(message.author.id, config.credits, "add", "Chat engagement reward", "system");

    try {
      await message.author.send(
        `🎉 You earned **${config.credits} AC** for being active in chat! New balance: **${updated.balance} AC**`
      );
    } catch {
      // User has DMs off — silently skip
    }
  }
});

// ─────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────

client.login(process.env.DISCORD_BOT_TOKEN);
