# Ascend Rewards Bot  v2.0

Discord bot that rewards engagement with **Ascend Credits (AC)**, runs a stock-based shop, and handles moderator-approved redemption tickets with full transcript archiving.

---

## Quick Start

### 1. Prerequisites
- Node.js 18+
- PostgreSQL database

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
Copy `.env.example` to `.env` and fill in every value:

| Variable | Description |
|---|---|
| `DISCORD_BOT_TOKEN` | Bot token from Discord Developer Portal |
| `DISCORD_APPLICATION_ID` | Application (client) ID from Developer Portal |
| `DISCORD_GUILD_ID` | Your server's ID |
| `MOD_ROLE_ID` | Role ID for moderators |
| `ADMIN_ROLE_ID` | Role ID for admins |
| `PURCHASES_CHANNEL_ID` | Channel for approved redemption announcements |
| `TICKET_CATEGORY_ID` | Category ID where ticket channels are created |
| `TICKET_TRANSCRIPTS_CHANNEL_ID` | Channel where closed ticket transcripts are stored |
| `ADMIN_LOGS_CHANNEL_ID` | Channel for all admin action logs |
| `DATABASE_URL` | PostgreSQL connection string |

### 4. Run database migration
```bash
psql $DATABASE_URL -f migrations/001_init.sql
```

### 5. Deploy slash commands
```bash
npm run deploy
```

### 6. Start the bot
```bash
npm start
```

---

## Commands

| Command | Role | Description |
|---|---|---|
| `/link` | Admin | Post the shop embed in the current channel |
| `/addstock` | Admin | Add a new item to the shop |
| `/removestock` | Admin | Remove an item from the shop by ID |
| `/addcredits` | Admin | Add AC to a user (with optional reason) |
| `/setcredits` | Admin | Set a user's AC balance to an exact amount |
| `/balance` | Anyone | Check your own AC balance |

---

## User Flow

1. **Shop** – Use `/link` in a channel. The bot posts the shop embed.
2. **Redeem** – Click **🛒 Redeem** → select a package → review the confirmation embed (Game / Denomination / AC Cost / Your Balance) → click **✅ Confirm**.
3. **Ticket** – A ticket channel is created automatically. Credits are put **on hold**. The order summary is posted with admin buttons.
4. **Admin actions** (Mods/Admins only):
   - **✅ Approve** → Credits move to "Credits Spent". Announcement posted in Purchases channel.
   - **❌ Cancel** → Credits refunded to user's balance.
   - **🔒 Close Ticket** → Transcript saved in Transcripts channel. Channel deleted.
5. **Transcripts** – Each archived ticket has **📄 View Details** and **🔓 Open Ticket Again** buttons.

---

## Balance Fields

| Field | Meaning |
|---|---|
| ✅ Available Balance | Credits ready to spend |
| ⏳ Balance on Hold | Credits reserved for pending tickets |
| 🧾 Credits Spent | Lifetime total of approved purchases |
