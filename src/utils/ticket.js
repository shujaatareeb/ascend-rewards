import {
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";

/* ───────────────── ID generator ───────────────── */

export function generateTicketId() {

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";

  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }

  return `ASC-${suffix}`;
}


/* ───────────────── Thread creation ───────────────── */

export async function createTicketThread(client, ticketId) {

  if (!process.env.DISCORD_GUILD_ID) {
    throw new Error("❌ DISCORD_GUILD_ID missing in .env");
  }

  if (!process.env.TICKET_CHANNEL_ID) {
    throw new Error("❌ TICKET_CHANNEL_ID missing in .env");
  }

  const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID);

  if (!guild) {
    throw new Error("❌ Guild not found");
  }

  const channel = await guild.channels.fetch(process.env.TICKET_CHANNEL_ID);

  if (!channel) {
    throw new Error("❌ Ticket channel not found");
  }

  if (channel.type !== ChannelType.GuildText) {
    throw new Error("❌ Ticket channel must be a text channel");
  }

  /* Create PRIVATE thread */

  const thread = await channel.threads.create({
    name: `ticket-${ticketId}`,
    type: ChannelType.PrivateThread,
    autoArchiveDuration: 1440,
    invitable: false,
    reason: "Ascend Rewards Ticket"
  });

  return thread;
}


/* ───────────────── Admin action buttons ───────────────── */

export function buildAdminButtons(ticketId, takenAction = null) {

  const disabled =
    takenAction === "approve" ||
    takenAction === "cancel" ||
    takenAction === "reopened";

  const approveBtn = new ButtonBuilder()
    .setCustomId(`ticket_approve:${ticketId}`)
    .setLabel(
      takenAction === "approve"
        ? "✅ Code Delivered"
        : "✅ Deliver Code"
    )
    .setStyle(ButtonStyle.Success)
    .setDisabled(disabled);

  const cancelBtn = new ButtonBuilder()
    .setCustomId(`ticket_cancel:${ticketId}`)
    .setLabel(
      takenAction === "cancel"
        ? "❌ Cancelled"
        : "❌ Cancel"
    )
    .setStyle(ButtonStyle.Danger)
    .setDisabled(disabled);

  const closeBtn = new ButtonBuilder()
    .setCustomId(`ticket_close:${ticketId}`)
    .setLabel("Close Ticket")
    .setStyle(ButtonStyle.Secondary);

  return new ActionRowBuilder().addComponents(
    approveBtn,
    cancelBtn,
    closeBtn
  );
}


/* ───────────────── Confirm purchase buttons ───────────────── */

export function buildConfirmButtons(stockId, takenAction = null) {

  const done = takenAction !== null;

  const confirmBtn = new ButtonBuilder()
    .setCustomId(`confirm_purchase:${stockId}`)
    .setLabel(
      takenAction === "confirm"
        ? "✅ Requested!"
        : "✅ Request"
    )
    .setStyle(ButtonStyle.Success)
    .setDisabled(done);

  const cancelBtn = new ButtonBuilder()
    .setCustomId(`cancel_purchase:${stockId}`)
    .setLabel(
      takenAction === "cancel"
        ? "❌ Cancelled"
        : "❌ Cancel"
    )
    .setStyle(ButtonStyle.Danger)
    .setDisabled(done);

  return new ActionRowBuilder().addComponents(
    confirmBtn,
    cancelBtn
  );
}


/* ───────────────── Transcript buttons ───────────────── */

export function buildTranscriptButtons(ticketId) {

  const viewBtn = new ButtonBuilder()
    .setCustomId(`transcript_view:${ticketId}`)
    .setLabel("View Details")
    .setStyle(ButtonStyle.Secondary);

  const reopenBtn = new ButtonBuilder()
    .setCustomId(`transcript_reopen:${ticketId}`)
    .setLabel("Open Ticket Again")
    .setStyle(ButtonStyle.Primary);

  return new ActionRowBuilder().addComponents(
    viewBtn,
    reopenBtn
  );
}