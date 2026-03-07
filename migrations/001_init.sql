-- Ascend Rewards Bot - Database Schema
-- Run this once to initialise your PostgreSQL database

CREATE TABLE IF NOT EXISTS users (
  user_id       TEXT    PRIMARY KEY,
  balance       INTEGER NOT NULL DEFAULT 0,
  balance_hold  INTEGER NOT NULL DEFAULT 0,
  credits_spent INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS stock (
  id            SERIAL  PRIMARY KEY,
  game          TEXT    NOT NULL,
  denomination  TEXT    NOT NULL,
  ac_cost       INTEGER NOT NULL,
  enabled       BOOLEAN NOT NULL DEFAULT true,
  game_enabled  BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS tickets (
  id                    TEXT        PRIMARY KEY,            -- e.g. ASC-AB12CD
  user_id               TEXT        NOT NULL,
  game                  TEXT        NOT NULL,
  denomination          TEXT        NOT NULL,
  ac_cost               INTEGER     NOT NULL,
  status                TEXT        NOT NULL DEFAULT 'pending',  -- pending | approved | cancelled | closed
  channel_id            TEXT,
  transcript_message_id TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_log (
  id         SERIAL      PRIMARY KEY,
  user_id    TEXT        NOT NULL,
  amount     INTEGER     NOT NULL,
  type       TEXT        NOT NULL,   -- add | set | deduct | refund | approved
  reason     TEXT,
  admin_id   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shop_messages (
  channel_id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  guild_id   TEXT NOT NULL
);