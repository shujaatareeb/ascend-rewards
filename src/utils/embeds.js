import { EmbedBuilder } from "discord.js";



// ─────────────────────────────────────────────
// Shop embed
// ─────────────────────────────────────────────

export function buildShopEmbed() {

  const embed = new EmbedBuilder()
    .setTitle("Ascend Rewards")
    .setDescription(
      "Use your Ascend Credits to request your favorite items from the Ascend Shop.\n\n" +
      "Click 🛒 **Redeem** to start a purchase or 💰 **View Credits** to check your balance."
    )
    .setColor(0x5865f2)
    .setImage("attachment://ascend-banner.png")
    .setFooter({
      text: "Ascend Rewards • Powered by Ascend Credits"
    })
    .setTimestamp();

  return embed;
}


// ─────────────────────────────────────────────
// Balance embed
// ─────────────────────────────────────────────

export function buildBalanceEmbed(user, member) {

  return new EmbedBuilder()
    .setTitle("💰 Ascend Credits — Balance")
    .setColor(0x57F287)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      {
        name: "✅ Available Balance",
        value: `**${user.balance} AC**`,
        inline: true,
      },
      {
        name: "⏳ Balance on Hold",
        value: `**${user.balance_hold} AC**`,
        inline: true,
      },
      {
        name: "🧾 Credits Spent",
        value: `**${user.credits_spent} AC**`,
        inline: true,
      }
    )
    .setFooter({ text: `Ascend Rewards • ${member.user.tag}` })
    .setTimestamp();

}


// ─────────────────────────────────────────────
// Purchase confirmation embed
// ─────────────────────────────────────────────

export function buildConfirmationEmbed(stock, user) {

  const remaining = user.balance - stock.ac_cost;

  return new EmbedBuilder()
    .setTitle("Redemption Request")
    .setColor(0xFEE75C)
    .setDescription("Please review your order before confirming.")
    .addFields(
      { name: "Game", value: stock.game, inline: true },
      { name: "Denomination", value: stock.denomination, inline: true },
      { name: "Cost", value: `**${stock.ac_cost} AC**`, inline: true },
      {
        name: "Balance After Redemption",
        value: `${user.balance} AC → **${remaining} AC**`,
        inline: false,
      }
    )
    .setFooter({ text: "Ascend Rewards • Confirm or cancel below" })
    .setTimestamp();

}


// ─────────────────────────────────────────────
// Ticket purchase summary embed
// ─────────────────────────────────────────────

export function buildTicketSummaryEmbed(ticket) {

  return new EmbedBuilder()
    .setTitle("Order Redemption Summary")
    .setColor(0x5865F2)
    .addFields(
      { name: "User", value: `<@${ticket.user_id}>`, inline: true },
      { name: "Request ID", value: `\`${ticket.id}\``, inline: true },
      { name: "Game", value: ticket.game, inline: true },
      { name: "Denomination", value: ticket.denomination, inline: true },
      { name: "Credits Used", value: `**${ticket.ac_cost} AC**`, inline: true },
      { name: "Status", value: "⏳ Pending Admin Review", inline: false }
    )
    .setFooter({ text: "Ascend Rewards • Admin actions below" })
    .setTimestamp();

}


// ─────────────────────────────────────────────
// Transcript embed
// ─────────────────────────────────────────────

export function buildTranscriptEmbed(ticket, closedBy) {

  const statusEmoji = {
    approved: "✅",
    cancelled: "❌",
    closed: "🔒",
  }[ticket.status] ?? "🔒";

  return new EmbedBuilder()
    .setTitle(`📁 Ticket Transcript — \`${ticket.id}\``)
    .setColor(0x99AAB5)
    .addFields(
      { name: "User", value: `<@${ticket.user_id}>`, inline: true },
      { name: "Game", value: ticket.game, inline: true },
      { name: "Denomination", value: ticket.denomination, inline: true },
      { name: "Credits", value: `${ticket.ac_cost} AC`, inline: true },
      {
        name: `${statusEmoji} Final Status`,
        value: ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1),
        inline: true,
      },
      {
        name: "Closed By",
        value: closedBy ? `<@${closedBy}>` : "System",
        inline: true,
      }
    )
    .setFooter({ text: "Ascend Rewards • Ticket Archive" })
    .setTimestamp();

}


// ─────────────────────────────────────────────
// Admin log embed
// ─────────────────────────────────────────────

export function buildAdminLogEmbed(action, admin, fields = {}) {

  const embed = new EmbedBuilder()
    .setTitle("Admin Action Log")
    .setColor(0x5865F2)
    .addFields(
      {
        name: "Admin",
        value: `<@${admin.id}>`,
        inline: true
      },
      {
        name: "Action",
        value: action,
        inline: true
      }
    )
    .setTimestamp();

  /* add extra fields dynamically */

  for (const [key, value] of Object.entries(fields)) {

    embed.addFields({
      name: key,
      value: String(value),
      inline: true
    });

  }

  return embed;
}