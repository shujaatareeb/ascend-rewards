/**
 * Run once with: node src/deploy-commands.js
 * Registers all slash commands to your guild.
 */

import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { readdirSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';

config();

// Resolve directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load commands
const commands = [];
const commandsPath = join(__dirname, 'commands');
const files = readdirSync(commandsPath).filter((f) => f.endsWith('.js'));

for (const file of files) {
  const mod = await import(pathToFileURL(join(commandsPath, file)));
  commands.push(mod.default.data.toJSON());

  console.log(`↳ Loaded command: ${mod.default.data.name}`);
}

// Create REST instance
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

console.log(`\nRegistering ${commands.length} commands to guild ${process.env.DISCORD_GUILD_ID}...`);

try {
  await rest.put(
    Routes.applicationGuildCommands(
      process.env.DISCORD_APPLICATION_ID ?? process.env.DISCORD_CLIENT_ID,
      process.env.DISCORD_GUILD_ID
    ),
    { body: commands }
  );

  console.log("✅ All commands registered successfully.");
} catch (err) {
  console.error("❌ Failed to register commands:", err);
}