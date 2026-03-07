import { buildAdminLogEmbed } from './embeds.js';

/**
 * Send a log message to the Admin Logs channel.
 * @param {import('discord.js').Client} client
 * @param {string} action  – short description, e.g. "Approved Ticket"
 * @param {import('discord.js').User} admin  – the admin/mod who acted
 * @param {Record<string, string>} fields – additional key-value pairs to show
 */
export async function logAdmin(client, action, admin, fields = {}) {
  try {
    const channelId = process.env.ADMIN_LOGS_CHANNEL_ID;
    if (!channelId) return;
    const channel = client.channels.cache.get(channelId);
    if (!channel) return;
    const embed = buildAdminLogEmbed(action, admin, fields);
    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error('[logger] Failed to send admin log:', err);
  }
}
