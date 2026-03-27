"""SQLite database helpers for the ticket tracker."""

from __future__ import annotations

import argparse
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parents[1] / "data" / "tracker.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS concerts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  artist TEXT,
  venue TEXT NOT NULL,
  city TEXT,
  event_date DATETIME NOT NULL,
  tracking_start DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tracking_end DATETIME,
  status TEXT DEFAULT 'active',
  user_notes TEXT
);

CREATE TABLE IF NOT EXISTS price_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  concert_id TEXT NOT NULL,
  timestamp DATETIME NOT NULL,
  source TEXT DEFAULT 'tickpick',
  get_in_price REAL,
  median_price REAL,
  listings_count INTEGER,
  price_change_24h_pct REAL,
  price_change_7d_pct REAL,
  FOREIGN KEY(concert_id) REFERENCES concerts(id),
  UNIQUE(concert_id, timestamp)
);

CREATE TABLE IF NOT EXISTS user_trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  concert_id TEXT NOT NULL,
  buy_price REAL,
  buy_qty INTEGER,
  buy_date DATETIME NOT NULL,
  sell_price REAL,
  sell_qty INTEGER,
  sell_date DATETIME,
  profit REAL,
  profit_pct REAL,
  status TEXT,
  notes TEXT,
  FOREIGN KEY(concert_id) REFERENCES concerts(id)
);

CREATE TABLE IF NOT EXISTS trading_signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  concert_id TEXT NOT NULL,
  timestamp DATETIME NOT NULL,
  signal TEXT,
  confidence_pct REAL,
  expected_profit_per_ticket REAL,
  profit_margin_pct REAL,
  target_buy_price REAL,
  target_sell_price REAL,
  rationale TEXT,
  FOREIGN KEY(concert_id) REFERENCES concerts(id)
);

CREATE TABLE IF NOT EXISTS portfolio_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  calculated_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  total_trades INTEGER,
  winning_trades INTEGER,
  win_rate_pct REAL,
  total_profit REAL,
  sharpe_ratio REAL,
  max_drawdown_pct REAL,
  kelly_criterion_pct REAL
);

CREATE INDEX IF NOT EXISTS idx_concert_timestamp ON price_snapshots(concert_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_event_date ON concerts(event_date);
"""


def get_conn() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_conn() as conn:
        conn.executescript(SCHEMA)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--init", action="store_true", help="Initialize schema")
    args = parser.parse_args()
    if args.init:
        init_db()
        print(f"Initialized database at {DB_PATH}")


if __name__ == "__main__":
    main()
