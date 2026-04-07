import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { setChatRewardConfig, getChatRewardConfig } from "../database.js";
import { logAdmin } from "../utils/logger.js";

export default {
  data: new SlashCommandBuilder()
    .setName("setchat")
    .setDescription("Set chat engagement reward (Admin only)")
    .addIntegerOption(opt =>
      opt.setName("messages").setDescription("Number of messages to send").setRequired(true).setMinValue(1)
    )
    .addIntegerOption(opt =>
      opt.setName("duration").setDescription("Time window in seconds").setRequired(true).setMinValue(5)
    )
    .addIntegerOption(opt =>
      opt.setName("credits").setDescription("Credits awarded when threshold is hit").setRequired(true).setMinValue(1)
    ),

  async execute(interaction, client) {
    const isAdmin =
      interaction.member.roles.cache.has(process.env.ADMIN_ROLE_ID) ||
      interaction.member.permissions.has("Administrator");

    if (!isAdmin) {
      return interaction.reply({ content: "❌ Admin only.", ephemeral: true });
    }

    const messages = interaction.options.getInteger("messages");
    const duration = interaction.options.getInteger("duration");
    const credits  = interaction.options.getInteger("credits");

    await setChatRewardConfig(messages, duration, credits, interaction.user.id);

    const embed = new EmbedBuilder()
      .setTitle("✅ Chat Reward Set")
      .setColor(0x5865F2)
      .addFields(
        { name: "Messages Required", value: `${messages}`, inline: true },
        { name: "Time Window",       value: `${duration}s`, inline: true },
        { name: "Credits Reward",    value: `${credits} AC`, inline: true },
      )
      .setDescription(`Users will earn **${credits} AC** for sending **${messages} messages** within **${duration} seconds**.`)
      .setFooter({ text: "Ascend Rewards" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });

    await logAdmin(client, "Set Chat Reward", interaction.user, {
      Messages: messages,
      Duration: `${duration}s`,
      Credits: `${credits} AC`,
    });
  },
};
