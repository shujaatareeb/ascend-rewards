import { buttonHandler } from "./buttonHandler.js";
import { selectMenuHandler } from "./selectMenuHandler.js";

export async function interactionHandler(client, interaction) {

  try {

    /* ───────────── AUTOCOMPLETE ───────────── */

    if (interaction.isAutocomplete()) {

      const command = client.commands.get(interaction.commandName);

      if (!command || !command.autocomplete) return;

      await command.autocomplete(interaction);
      return;

    }


    /* ───────────── SLASH COMMAND ───────────── */

    if (interaction.isChatInputCommand()) {

      const command = client.commands.get(interaction.commandName);

      if (!command) return;

      await command.execute(interaction, client);
      return;

    }


    /* ───────────── BUTTON ───────────── */

    if (interaction.isButton()) {

      await buttonHandler(client, interaction);
      return;

    }


    /* ───────────── SELECT MENU ───────────── */

    if (interaction.isStringSelectMenu()) {

      await selectMenuHandler(client, interaction);
      return;

    }

  } catch (err) {

    console.error(
      `[interaction] Error in "${interaction.customId ?? interaction.commandName}":`,
      err
    );

    const payload = {
      content: "❌ Something went wrong. Please try again or contact an admin.",
      ephemeral: true
    };

    try {

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload);
      } else {
        await interaction.reply(payload);
      }

    } catch (_) {}

  }

}