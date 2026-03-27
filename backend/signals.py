"""Trading signal helpers."""

from __future__ import annotations

from datetime import datetime, timezone


def generate_buy_signal(latest_snapshot: dict, avg_listings_7d: float, median_price_30d: float, days_to_concert: int) -> dict | None:
    confidence = 0
    rationale: list[str] = []

    if latest_snapshot.get("price_change_24h_pct", 0) < -5:
        confidence += 25
        rationale.append("Get-in price dropped >5% in 24h")

    listings = latest_snapshot.get("listings_count") or 0
    if avg_listings_7d > 0 and listings > avg_listings_7d * 1.3:
        confidence += 20
        rationale.append("Listings surged above 7d average")

    median_price = latest_snapshot.get("median_price") or 0
    if days_to_concert < 7 and median_price_30d > 0 and median_price < median_price_30d * 0.95:
        confidence += 30
        rationale.append("Near event and below 30d median")

    buy_price = latest_snapshot.get("get_in_price")
    if not buy_price:
        return None

    target_sell_price = buy_price * 1.15
    expected_profit = target_sell_price - buy_price
    net_expected_value = expected_profit - (buy_price * 0.03)

    if confidence >= 60:
        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "signal": "BUY",
            "confidence_pct": confidence,
            "expected_profit_per_ticket": round(net_expected_value, 2),
            "profit_margin_pct": round((expected_profit / buy_price) * 100, 1),
            "target_buy_price": round(buy_price, 2),
            "target_sell_price": round(target_sell_price, 2),
            "rationale": " | ".join(rationale) if rationale else "Scoring threshold reached",
        }

    return None
