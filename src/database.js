import pg from "pg";
import { config } from "dotenv";
import fs from "fs";
import path from "path";

config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const AC_RATE = 10;

/* ─────────────────────────────────────────────
   Query Helper (FIX FOR YOUR ERROR)
───────────────────────────────────────────── */

export async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}

/* ─────────────────────────────────────────────
   Load catalog JSON
───────────────────────────────────────────── */

const catalogPath = path.join(process.cwd(), "src", "data", "catalog.json");

let catalog = { products: [] };

try {
  const raw = fs.readFileSync(catalogPath, "utf8");
  catalog = JSON.parse(raw);
  console.log("Catalog loaded");
} catch (err) {
  console.error("Failed to load catalog.json", err);
}

/* ─────────────────────────────────────────────
   Sync catalog → stock table
───────────────────────────────────────────── */

export async function syncCatalogToStock() {

  for (const product of catalog.products) {

    for (const denom of product.denominations) {

      const acCost = Math.round(denom.discounted_price * AC_RATE);

      const exists = await query(
        `SELECT id FROM stock
         WHERE game=$1 AND denomination=$2`,
        [product.game, denom.amount]
      );

      if (exists.rows.length === 0) {

        await query(
          `INSERT INTO stock (game, denomination, ac_cost, enabled, game_enabled)
           VALUES ($1,$2,$3,true,true)`,
          [product.game, denom.amount, acCost]
        );

        console.log(`➕ Added catalog item: ${product.game} - ${denom.amount}`);
      }
    }

  }

}

/* ─────────────────────────────────────────────
   User helpers
───────────────────────────────────────────── */

async function ensureUser(userId) {

  await query(
    `INSERT INTO users (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );

}

export async function getUser(userId) {

  await ensureUser(userId);

  const res = await query(
    `SELECT * FROM users WHERE user_id=$1`,
    [userId]
  );

  return res.rows[0];

}

export async function addCredits(userId, amount) {

  await ensureUser(userId);

  const res = await query(
    `UPDATE users
     SET balance = balance + $2
     WHERE user_id=$1
     RETURNING *`,
    [userId, amount]
  );

  return res.rows[0];

}

export async function setCredits(userId, amount) {

  await ensureUser(userId);

  const res = await query(
    `UPDATE users
     SET balance=$2
     WHERE user_id=$1
     RETURNING *`,
    [userId, amount]
  );

  return res.rows[0];

}

export async function holdCredits(userId, amount) {

  const res = await query(
    `UPDATE users
     SET balance = balance - $2,
         balance_hold = balance_hold + $2
     WHERE user_id=$1
     RETURNING *`,
    [userId, amount]
  );

  return res.rows[0];

}

export async function approveCredits(userId, amount) {

  const res = await query(
    `UPDATE users
     SET balance_hold = balance_hold - $2,
         credits_spent = credits_spent + $2
     WHERE user_id=$1
     RETURNING *`,
    [userId, amount]
  );

  return res.rows[0];

}

export async function refundCredits(userId, amount) {

  const res = await query(
    `UPDATE users
     SET balance = balance + $2,
         balance_hold = balance_hold - $2
     WHERE user_id=$1
     RETURNING *`,
    [userId, amount]
  );

  return res.rows[0];

}

/* ─────────────────────────────────────────────
   Stock helpers
───────────────────────────────────────────── */

export async function getAllStock() {

  const res = await query(
    `SELECT *
     FROM stock
     ORDER BY game, ac_cost`
  );

  return res.rows;

}

export async function getAvailableStock() {

  const res = await query(
    `SELECT *
     FROM stock
     WHERE enabled = true
     AND game_enabled = true
     ORDER BY game, ac_cost`
  );

  return res.rows;

}

export async function getStockById(id) {

  const res = await query(
    `SELECT *
     FROM stock
     WHERE id=$1`,
    [id]
  );

  return res.rows[0] ?? null;

}

/* ─────────────────────────────────────────────
   Enable / Disable Helpers
───────────────────────────────────────────── */

export async function enableGame(game) {

  await query(
    `UPDATE stock
     SET game_enabled = true
     WHERE game=$1`,
    [game]
  );

}

export async function disableGame(game) {

  await query(
    `UPDATE stock
     SET game_enabled = false
     WHERE game=$1`,
    [game]
  );

}

export async function enableStock(id) {

  await query(
    `UPDATE stock
     SET enabled = true
     WHERE id=$1`,
    [id]
  );

}

export async function disableStock(id) {

  await query(
    `UPDATE stock
     SET enabled = false
     WHERE id=$1`,
    [id]
  );

}

/* ─────────────────────────────────────────────
   Ticket helpers
───────────────────────────────────────────── */

export async function createTicket(
  id,
  userId,
  game,
  denomination,
  acCost,
  channelId
) {

  const res = await query(
    `INSERT INTO tickets
     (id,user_id,game,denomination,ac_cost,channel_id)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [id, userId, game, denomination, acCost, channelId]
  );

  return res.rows[0];

}

export async function getTicket(id) {

  const res = await query(
    `SELECT * FROM tickets WHERE id=$1`,
    [id]
  );

  return res.rows[0] ?? null;

}

export async function updateTicketStatus(id, status, channelId = undefined) {

  const extra = channelId !== undefined ? ", channel_id=$3" : "";
  const params =
    channelId !== undefined ? [id, status, channelId] : [id, status];

  const res = await query(
    `UPDATE tickets
     SET status=$2,
         updated_at=NOW()
     ${extra}
     WHERE id=$1
     RETURNING *`,
    params
  );

  return res.rows[0];

}

export async function setTicketTranscript(id, messageId) {

  await query(
    `UPDATE tickets
     SET transcript_message_id=$2
     WHERE id=$1`,
    [id, messageId]
  );

}

/* ─────────────────────────────────────────────
   Shop message helpers
───────────────────────────────────────────── */

export async function upsertShopMessage(channelId, messageId, guildId) {

  await query(
    `INSERT INTO shop_messages (channel_id,message_id,guild_id)
     VALUES ($1,$2,$3)
     ON CONFLICT (channel_id)
     DO UPDATE SET message_id=$2`,
    [channelId, messageId, guildId]
  );

}

export async function getAllShopMessages() {

  const res = await query(
    `SELECT * FROM shop_messages`
  );

  return res.rows;

}

/* ─────────────────────────────────────────────
   Credit log
───────────────────────────────────────────── */

export async function logCredit(
  userId,
  amount,
  type,
  reason,
  adminId
) {

  await query(
    `INSERT INTO credit_log
     (user_id,amount,type,reason,admin_id)
     VALUES ($1,$2,$3,$4,$5)`,
    [userId, amount, type, reason, adminId]
  );

}

export { pool };