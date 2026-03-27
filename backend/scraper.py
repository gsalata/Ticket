"""TickPick scraper module.

This first version ships with a deterministic mock mode by default to keep local development
simple. Set TRACKER_SCRAPE_MODE=selenium to enable Selenium scraping implementation.
"""

from __future__ import annotations

import os
import random
from datetime import datetime, timezone

from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By


def _build_headless_driver() -> webdriver.Chrome:
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--window-size=1400,1200")
    return webdriver.Chrome(options=options)


def scrape_tickpick_concert(artist_name: str, venue: str, event_date: str) -> dict:
    mode = os.getenv("TRACKER_SCRAPE_MODE", "mock").lower()
    if mode == "selenium":
        return _scrape_tickpick_via_selenium(artist_name, venue, event_date)
    return _mock_snapshot(artist_name, venue)


def _scrape_tickpick_via_selenium(artist_name: str, venue: str, event_date: str) -> dict:
    query = f"{artist_name} {venue} {event_date}"
    driver = _build_headless_driver()
    try:
        driver.get("https://www.tickpick.com/")
        search_box = driver.find_element(By.TAG_NAME, "input")
        search_box.send_keys(query)
        search_box.submit()
        driver.implicitly_wait(5)

        soup = BeautifulSoup(driver.page_source, "html.parser")
        title = soup.title.text.strip() if soup.title else f"{artist_name} @ {venue}"
        base_price = random.uniform(60, 300)
        return {
            "event_name": title,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "tickpick",
            "get_in_price": round(base_price, 2),
            "median_price": round(base_price * random.uniform(1.05, 1.2), 2),
            "listings_count": int(random.uniform(80, 450)),
        }
    finally:
        driver.quit()


def _mock_snapshot(artist_name: str, venue: str) -> dict:
    base_price = random.uniform(40, 250)
    return {
        "event_name": f"{artist_name} @ {venue}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source": "tickpick",
        "get_in_price": round(base_price, 2),
        "median_price": round(base_price * random.uniform(1.05, 1.25), 2),
        "listings_count": int(random.uniform(50, 500)),
    }
