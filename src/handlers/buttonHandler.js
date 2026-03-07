import {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";
import {
  getUser,
  getAvailableStock,
  getStockById,
  holdCredits,
  refundCredits,
  approveCredits,
  createTicket,
  getTicket,
  updateTicketStatus,
  setTicketTranscript,
  logCredit,
} from "../database.js";

import {
  buildBalanceEmbed,
  buildTicketSummaryEmbed,
  buildTranscriptEmbed,
} from "../utils/embeds.js";

import {
  generateTicketId,
  createTicketThread,
  buildAdminButtons,
  buildConfirmButtons,
  buildTranscriptButtons,
} from "../utils/ticket.js";

import { logAdmin } from "../utils/logger.js";

const GAME_IMAGES = {
  "Genshin Impact - Genesis Crystals":
    "https://cdn2.unipin.com/images/icon/product/icon_genshin_impact.jpg",

  "BGMI - Unknown Cash":
    "https://cdn2.unipin.com/images/icon/product/icon_battlegrounds_mobile_india.jpg",

  "Minecraft - Minecoins":
    "https://cdn2.unipin.com/images/icon/product/icon_minecraft.jpg",

  "Mobile Legends - Diamonds":
    "https://cdn2.unipin.com/images/icon/product/icon_mobile_legends.jpg",

  "Roblox - USD Credits":
    "https://cdn2.unipin.com/images/icon/product/icon_roblox.jpg",

  "Steam - Steam Wallet Balance":
    "https://cdn2.unipin.com/images/icon/product/icon_steam.jpg",

  "Valorant - Valorant Points":
    "https://cdn2.unipin.com/images/icon/product/icon_valorant.jpg"
};

/* ───────────────── Helpers ───────────────── */

function isMod(member) {
  return (
    member.roles.cache.has(process.env.MOD_ROLE_ID) ||
    member.roles.cache.has(process.env.ADMIN_ROLE_ID) ||
    member.permissions.has("Administrator")
  );
}

/* ───────────────── Dispatcher ───────────────── */

export async function buttonHandler(client, interaction) {

  const { customId } = interaction;

  if (customId === "shop_redeem") return handleShopRedeem(client, interaction);
  if (customId === "shop_viewcredits") return handleShopViewCredits(client, interaction);
  if (customId === "shop_back") return handleShopBack(client, interaction);

  if (customId.startsWith("confirm_purchase:")) {
    const stockId = parseInt(customId.split(":")[1]);
    return handleConfirmPurchase(client, interaction, stockId);
  }

  if (customId.startsWith("cancel_purchase:")) {
    return handleCancelPurchase(client, interaction);
  }

  if (customId.startsWith("ticket_approve:")) {
    return handleTicketApprove(client, interaction, customId.split(":")[1]);
  }

  if (customId.startsWith("ticket_cancel:")) {
    return handleTicketCancel(client, interaction, customId.split(":")[1]);
  }

  if (customId.startsWith("ticket_close:")) {
    return handleTicketClose(client, interaction, customId.split(":")[1]);
  }

  if (customId.startsWith("transcript_view:")) {
    return handleTranscriptView(client, interaction, customId.split(":")[1]);
  }

  if (customId.startsWith("transcript_reopen:")) {
    return handleTranscriptReopen(client, interaction, customId.split(":")[1]);
  }

}

/* ───────────────── Redeem Button ───────────────── */

async function handleShopRedeem(client, interaction) {

  const stock = await getAvailableStock();

  if (!stock.length) {
    return interaction.reply({
      content: "❌ No packages available right now.",
      ephemeral: true
    });
  }

  const user = await getUser(interaction.user.id);

  const games = [...new Set(stock.map(s => s.game))];


  const embed = new EmbedBuilder()
  .setTitle("Ascend Rewards")
  .setDescription(
    "**Available Games**\n\n" +
    games.map(g => `• **${g}**`).join("\n") +
    "\n\nSelect a title from the dropdown below."
  )
  .addFields({
    name: "💳 Available Balance",
    value: `**${user.balance} AC**`
  })
  .setColor(0x5865F2);

  const menu = new StringSelectMenuBuilder()
    .setCustomId("game_select")
    .setPlaceholder("Choose a title")
    .addOptions(
      games.map(game =>
        new StringSelectMenuOptionBuilder()
          .setLabel(game)
          .setValue(`game:${game}`)
          .setDescription("View available packages")
      )
    );

  return interaction.reply({
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(menu)],
    ephemeral: true
  });

}
async function handleGameSelect(client, interaction) {

  const selectedGame = interaction.values[0].split(":")[1];

  const stock = await getAvailableStock();
  const user = await getUser(interaction.user.id);

  const items = stock.filter(s => s.game === selectedGame);

  if (!items.length) {
    return interaction.update({
      content: "❌ No packages available.",
      embeds: [],
      components: []
    });
  }

  const embed = new EmbedBuilder()
    .setTitle(selectedGame)
    .setDescription("Select a package below.")
    .setThumbnail(GAME_IMAGES[selectedGame] || null)
    .addFields({
      name: "💳 Available Balance",
      value: `**${user.balance} AC**`
    })
    .setColor(0x5865F2);

  const menu = new StringSelectMenuBuilder()
    .setCustomId("package_select")
    .setPlaceholder("Choose a package")
    .addOptions(
      items.map(s =>
        new StringSelectMenuOptionBuilder()
          .setLabel(`${s.denomination}`)
          .setValue(`stock:${s.id}`)
          .setDescription(`${s.ac_cost} AC`)
      )
    );

  const backBtn = new ButtonBuilder()
    .setCustomId("shop_back")
    .setLabel("⬅ Back")
    .setStyle(ButtonStyle.Secondary);

  await interaction.update({
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(menu),
      new ActionRowBuilder().addComponents(backBtn)
    ]
  });

}
async function handleShopBack(client, interaction) {

  const stock = await getAvailableStock();
  const user = await getUser(interaction.user.id);

  const games = [...new Set(stock.map(s => s.game))];

  const embed = new EmbedBuilder()
    .setTitle("Ascend Rewards")
    .setDescription(
      "**Available Games**\n\n" +
      games.map(g => `• **${g}**`).join("\n") +
      "\n\nSelect a title from the dropdown below."
    )
    .addFields({
      name: "💳 Available Balance",
      value: `**${user.balance} AC**`
    })
    .setColor(0x5865F2);

  const menu = new StringSelectMenuBuilder()
    .setCustomId("game_select")
    .setPlaceholder("Choose a title")
    .addOptions(
      games.map(game =>
        new StringSelectMenuOptionBuilder()
          .setLabel(game)
          .setValue(`game:${game}`)
          .setDescription("View available packages")
      )
    );

  await interaction.update({
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(menu)]
  });

}
async function handleShopViewCredits(client, interaction) {

  const user = await getUser(interaction.user.id);
  const member = interaction.guild
  ? await interaction.guild.members.fetch(interaction.user.id)
  : null;

  const embed = new EmbedBuilder()
    .setTitle("💳 Ascend Credits Balance")
    .setColor(0x5865F2)
    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      {
        name: "Balance",
        value: `**${user.balance} AC**`,
        inline: true
      },
      {
        name: "Hold Balance",
        value: `**${user.balance_hold} AC**`,
        inline: true
      },
      {
        name: "Total Spent",
        value: `**${user.total_spent ?? 0} AC**`,
        inline: true
      }
    )
    .setFooter({ text: interaction.user.tag })
    .setTimestamp();

  return interaction.reply({
    embeds: [embed],
    ephemeral: true
  });

}

/* ───────────────── Confirm Purchase ───────────────── */

async function handleConfirmPurchase(client, interaction, stockId) {

  await interaction.deferUpdate();

  const stock = await getStockById(stockId);
  const user = await getUser(interaction.user.id);

  /* Check stock availability */

  if (!stock || !stock.enabled || !stock.game_enabled) {
    return interaction.message.edit({
      content: "❌ This item is no longer available.",
      embeds: [],
      components: []
    });
  }

  /* Check credits */

  if (user.balance < stock.ac_cost) {
    return interaction.message.edit({
      embeds: [
        new EmbedBuilder()
          .setTitle("❌ Insufficient Credits")
          .setDescription(
            `You need **${stock.ac_cost} AC** but only have **${user.balance} AC**`
          )
          .setColor(0xED4245)
      ],
      components: []
    });
  }

  /* Generate ticket ID */

  const ticketId = generateTicketId();

  /* Create private thread */

  const ticketThread = await createTicketThread(
  client,
  interaction.user.username,
  stock.denomination
);

  /* Add buyer to thread */

  try {
    await ticketThread.members.add(interaction.user.id);
  } catch (err) {
    console.error("Failed to add user to thread:", err.message);
  }

  /* Hold credits */

  await holdCredits(interaction.user.id, stock.ac_cost);

  await logCredit(
    interaction.user.id,
    stock.ac_cost,
    "deduct",
    `Purchase ${ticketId}`,
    null
  );

  /* Create ticket in database */

  const ticket = await createTicket(
    ticketId,
    interaction.user.id,
    stock.game,
    stock.denomination,
    stock.ac_cost,
    ticketThread.id
  );

  /* Send ticket message (mention ONLY once) */

  await ticketThread.send({
    content: `<@${interaction.user.id}> <@&${process.env.ADMIN_ROLE_ID}>`,
    embeds: [buildTicketSummaryEmbed(ticket)],
    components: [buildAdminButtons(ticketId)]
  });

  /* Helper message */

  await ticketThread.send({
    content:
      `Thank you for your request!\n` +
      `An **admin will share your code shortly.**`
  });

  /* Update shop message */

  await interaction.editReply({
  embeds: [
    new EmbedBuilder()
      .setTitle("✅ Request Confirmed")
      .setDescription(
        `Your ticket has been created: <#${ticketThread.id}>`
      )
      .setColor(0x57F287)
  ],
  components: [] // ✅ removes buttons
});

  /* DM user */

  try {

    const dbUser = await getUser(interaction.user.id);

    const ticketLink =
      `https://discord.com/channels/${interaction.guild.id}/${ticketThread.id}`;

    await interaction.user.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("Redemption Requested")
          .setDescription("You have requested to redeem Ascend Credits")
          .setColor(0x5865F2)
          .addFields(
              { name: "Game", value: stock.game, inline: true },
              { name: "Package", value: stock.denomination, inline: true },
              { name: "Cost", value: `${stock.ac_cost} AC`, inline: true },
            
              { name: "Ticket", value: ticketId, inline: true },
              { name: "Current Balance", value: `${dbUser.balance} AC`, inline: true },
              { name: "Open Ticket", value: ticketLink, inline: true }
            )
      ]
    });

  } catch {}

}

/* ───────────────── Cancel Purchase ───────────────── */

async function handleCancelPurchase(client, interaction) {

  await interaction.update({
    embeds: [
      new EmbedBuilder()
        .setTitle("❌ Purchase Cancelled")
        .setDescription("Your redemption request has been cancelled.")
        .setColor(0xED4245)
    ],
    components: []
  });

}

/* ───────────────── Ticket Approve ───────────────── */

async function handleTicketApprove(client, interaction, ticketId) {

  if (!isMod(interaction.member)) {
    return interaction.reply({
      content: "❌ Mod only.",
      ephemeral: true
    });
  }
  await interaction.deferUpdate();

  const ticket = await getTicket(ticketId);

  if (!ticket) {
    return interaction.followUp({
      content: "❌ Ticket not found.",
      ephemeral: true
    });
  }

  await approveCredits(ticket.user_id, ticket.ac_cost);
  await updateTicketStatus(ticketId, "approved");

  /* UPDATE TICKET EMBED */

  await interaction.editReply({
    embeds: [buildTicketSummaryEmbed({ ...ticket, status: "approved" })],
    components: [buildAdminButtons(ticketId, "approve")],
  });

  /* 🎉 POST REDEMPTION MESSAGE */

  /* 🎉 POST REDEMPTION MESSAGE IN PURCHASES CHANNEL */

const purchasesChannel = client.channels.cache.get(process.env.PURCHASES_CHANNEL_ID);

if (purchasesChannel) {

  await purchasesChannel.send({
    embeds: [
      new EmbedBuilder()
        .setTitle("🎉 New Redemption!")
        .setColor(0x57F287)
        .setDescription(
          `<@${ticket.user_id}> just redeemed **${ticket.denomination}** for **${ticket.game}**!`
        )
        .addFields({
          name: "💳 Credits Used",
          value: `${ticket.ac_cost} AC`
        })
        .setTimestamp()
    ]
  });

}

  /* DM USER */

  try {

  const user = await client.users.fetch(ticket.user_id);
  const dbUser = await getUser(ticket.user_id); 
  const ticketLink = `https://discord.com/channels/${interaction.guild.id}/${ticket.channel_id}`;

  await user.send({
    embeds: [
      new EmbedBuilder()
        .setTitle("✅ Code Delivered")
        .setDescription("Thank you for redeeming Ascend Credits!")
        .setColor(0x57F287)
        .addFields(
          { name: "Game", value: ticket.game, inline: true },
          { name: "Package", value: ticket.denomination, inline: true },
          { name: "Cost", value: `${ticket.ac_cost} AC`, inline: true },
        
          { name: "Ticket", value: ticketId, inline: true },
          { name: "Current Balance", value: `${dbUser.balance} AC`, inline: true },
          { name: "Get Your Code", value: `${ticketLink}`, inline: true }
        )
    ]
  });

} catch {}

  /* ADMIN LOG */

  await logAdmin(client, "Ticket Approved", interaction.user, {
    Ticket: ticketId,
    User: `<@${ticket.user_id}>`
  });

}

/* ───────────────── Ticket Cancel ───────────────── */

async function handleTicketCancel(client, interaction, ticketId) {

  if (!isMod(interaction.member)) return interaction.reply({ content: "❌ Mod only.", ephemeral: true });

  await interaction.deferUpdate();

  const ticket = await getTicket(ticketId);

  await refundCredits(ticket.user_id, ticket.ac_cost);
  await updateTicketStatus(ticketId, "cancelled");

  await interaction.editReply({
    embeds: [buildTicketSummaryEmbed({ ...ticket, status: "cancelled" })],
    components: [buildAdminButtons(ticketId, "cancel")],
  });

  const user = await client.users.fetch(ticket.user_id);

  try {
    const dbUser = await getUser(ticket.user_id); 
    await user.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("❌ Redemption Cancelled")
          .setDescription("Your redemption request has been cancelled and your Ascend Credits have been refunded!")
          .setColor(0xED4245)
          .addFields(
            { name: "Game", value: ticket.game, inline: true },
            { name: "Package", value: ticket.denomination, inline: true },
            { name: "Credits Refunded", value: `${ticket.ac_cost} AC`, inline: true },
          
            { name: "Ticket", value: ticketId, inline: true },
            { name: "Current Balance", value: `${dbUser.balance} AC`, inline: true }
          )
      ]
    });
  } catch {}

  await logAdmin(client, "Ticket Cancelled", interaction.user, {
    Ticket: ticketId,
    User: `<@${ticket.user_id}>`
  });

}

async function handleTicketClose(client, interaction, ticketId) {

  if (!isMod(interaction.member)) {
    return interaction.reply({
      content: "❌ Mod only.",
      ephemeral: true
    });
  }

  await interaction.deferUpdate();

  const ticket = await getTicket(ticketId);
  if (!ticket) return;

  const thread = interaction.channel;

  /* Update ticket status */

  await updateTicketStatus(ticketId, "closed");

  const members = thread.members.cache;

  for (const member of members.values()) {

    if (member.id !== client.user.id) {
      await thread.members.remove(member.id).catch(() => {});
    }

  }

  /* Build thread link for buttons */

  const threadLink = `https://discord.com/channels/${interaction.guild.id}/${thread.id}`;

  /* Send transcript inside the thread (ONLY ONCE) */

  if (!ticket.transcript_message_id) {

    const transcriptMsg = await thread.send({
      content: `🔒 Ticket closed by ${interaction.user}`,
      embeds: [buildTranscriptEmbed(ticket, interaction.user.id)],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel("View Thread")
            .setStyle(ButtonStyle.Link)
            .setURL(threadLink)
            .setEmoji("🧵"),
          new ButtonBuilder()
            .setCustomId(`transcript_reopen:${ticketId}`)
            .setLabel("Reopen")
            .setStyle(ButtonStyle.Success)
            .setEmoji("🔓")
            .setDisabled(false) 
        )
      ]
    });

    await setTicketTranscript(ticketId, transcriptMsg.id);

    /* Also post to log channel */

    const logChannel = client.channels.cache.get(process.env.TICKET_TRANSCRIPTS_CHANNEL_ID);

    if (logChannel) {
      await logChannel.send({
        embeds: [buildTranscriptEmbed(ticket, interaction.user.id)],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setLabel("View Thread")
              .setStyle(ButtonStyle.Link)
              .setURL(threadLink)
              .setEmoji("🧵"),
            new ButtonBuilder()
              .setCustomId(`transcript_reopen:${ticketId}`)
              .setLabel("Reopen")
              .setStyle(ButtonStyle.Success)
              .setEmoji("🔓")
              .setDisabled(false)
          )
        ]
      });
    }
  }

  /* Lock and archive the thread */

  await thread.setLocked(true).catch(() => {});
  await thread.setArchived(true).catch(() => {});

  /* DM user */

  const user = await client.users.fetch(ticket.user_id).catch(() => null);

  try {
    if (user) {
      await user.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("Ticket Closed")
            .setColor(0xED4245)
            .setDescription("Your redemption ticket has been closed.")
            .addFields(
              { name: "Ticket",    value: ticketId,           inline: true },
              { name: "Game",      value: ticket.game,        inline: true },
              { name: "Package",   value: ticket.denomination, inline: true },
              { name: "Closed By", value: interaction.user.tag }
            )
            .setFooter({ text: "Ascend Rewards" })
            .setTimestamp()
        ]
      });
    }
  } catch {}

  /* Admin log */

  await logAdmin(client, "Ticket Closed", interaction.user, {
    Ticket: ticketId,
    User: `<@${ticket.user_id}>`
  });
}

/* ───────────────── Transcript Reopen (Thread) ───────────────── */

async function handleTranscriptReopen(client, interaction, ticketId) {
   await interaction.deferUpdate();

  if (!isMod(interaction.member)) {
    return interaction.reply({
      content: "❌ Mod only.",
      ephemeral: true
    });
  }

  const ticket = await getTicket(ticketId);

  if (!ticket) {
    return interaction.reply({
      content: "❌ Ticket not found.",
      ephemeral: true
    });
  }

  if (ticket.status === "reopened") {
    return interaction.reply({
      content: "⚠️ Ticket already reopened.",
      ephemeral: true
    });
  }

  const thread = await interaction.guild.channels
    .fetch(ticket.channel_id)
    .catch(() => null);

  if (!thread) {
    return interaction.reply({
      content: "❌ Ticket thread not found.",
      ephemeral: true
    });
  }

  /* Unlock + unarchive */

  await thread.setArchived(false).catch(() => {});
  await thread.setLocked(false).catch(() => {});

  const user = await client.users.fetch(ticket.user_id).catch(() => null);

  /* Re-add user */

  if (user) {
    await thread.members.add(ticket.user_id).catch(() => {});
  }

  /* Add admin reopening */

  await thread.members.add(interaction.user.id).catch(() => {});

  await updateTicketStatus(ticketId, "reopened");
  const threadLink = `https://discord.com/channels/${interaction.guild.id}/${thread.id}`;

await interaction.editReply({
  components: [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("View Thread")
        .setStyle(ButtonStyle.Link)
        .setURL(threadLink)
        .setEmoji("🧵"),
      new ButtonBuilder()
        .setCustomId(`transcript_reopen:${ticketId}`)
        .setLabel("Reopened")
        .setStyle(ButtonStyle.Success)
        .setEmoji("🔓")
        .setDisabled(true)
    )
  ]
});

  /* Notify thread */

  await thread.send({
    content: `🔓 <@${ticket.user_id}> <@&${process.env.ADMIN_ROLE_ID}> ticket reopened by ${interaction.user}`,
    embeds: [
      buildTicketSummaryEmbed({
        ...ticket,
        status: "reopened"
      })
    ],
    components: [buildAdminButtons(ticketId, "reopened")]
  });

  /* Update transcript message */

  const logChannel = client.channels.cache.get(
    process.env.TICKET_TRANSCRIPTS_CHANNEL_ID
  );

  if (logChannel && ticket.transcript_message_id) {

    const msg = await logChannel.messages
      .fetch(ticket.transcript_message_id)
      .catch(() => null);

    const updatedTicket = await getTicket(ticketId);

    const threadLink = `https://discord.com/channels/${interaction.guild.id}/${thread.id}`;

    if (msg) {
  await msg.edit({
    embeds: [buildTranscriptEmbed(updatedTicket, interaction.user.id)],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("View Thread")
          .setStyle(ButtonStyle.Link)
          .setURL(threadLink)
          .setEmoji("🧵"),
        new ButtonBuilder()
          .setCustomId(`transcript_reopen:${ticketId}`)
          .setLabel("Reopened")
          .setStyle(ButtonStyle.Success)
          .setEmoji("🔓")
          .setDisabled(true)
      )
    ]
  });
}
  }

  /* DM user */

  try {
    const threadLink = `https://discord.com/channels/${interaction.guild.id}/${thread.id}`;

    if (user) {
      await user.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("Ticket Reopened")
            .setDescription("Your redemption request has been reopened.")
            .setColor(0x5865F2)
            .addFields(
              { name: "Game", value: ticket.game, inline: true },
              { name: "Package", value: ticket.denomination, inline: true },
              { name: "Cost", value: `${ticket.ac_cost} AC`, inline: true },
              { name: "Ticket", value: `${threadLink}`, inline: true }
            )
            .setFooter({ text: "Ascend Rewards" })
            .setTimestamp()
        ]
      });
    }
  } catch {}

  await logAdmin(client, "Ticket Reopened", interaction.user, {
    Ticket: ticketId,
    User: `<@${ticket.user_id}>`
  });
}
