#!/usr/bin/env python3
"""Background daemon that scrapes all active concerts."""

from __future__ import annotations

import logging

from backend.db import get_conn
from backend.scraper import scrape_tickpick_concert
from daemon.db_helper import insert_snapshot

logging.basicConfig(
    filename='/tmp/ticket-tracker-daemon.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)


def main() -> None:
    with get_conn() as conn:
        concerts = conn.execute(
            "SELECT id, artist, venue, event_date FROM concerts WHERE status='active'"
        ).fetchall()

    logging.info("Found %s active concerts", len(concerts))
    for concert in concerts:
        try:
            snapshot = scrape_tickpick_concert(concert["artist"], concert["venue"], concert["event_date"])
            insert_snapshot(concert["id"], snapshot)
            logging.info("Scraped %s", concert["id"])
        except Exception as exc:  # noqa: BLE001
            logging.exception("Error scraping concert %s: %s", concert["id"], exc)


if __name__ == '__main__':
    main()
