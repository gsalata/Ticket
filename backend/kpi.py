"""Portfolio metric calculations."""

from __future__ import annotations

from statistics import mean, pstdev


def calculate_portfolio_stats(closed_trades: list[dict]) -> dict | None:
    if not closed_trades:
        return None

    profits = [float(t.get("profit", 0) or 0) for t in closed_trades]
    total_trades = len(profits)
    winning_profits = [p for p in profits if p > 0]

    win_count = len(winning_profits)
    win_rate_pct = (win_count / total_trades) * 100
    total_profit = sum(profits)
    avg_profit_per_trade = total_profit / total_trades

    cumulative = []
    running_total = 0.0
    for p in profits:
        running_total += p
        cumulative.append(running_total)

    peak = max(cumulative) if cumulative else 0
    trough = min(cumulative) if cumulative else 0
    max_drawdown_pct = ((trough - peak) / peak * 100) if peak > 0 else 0

    avg_daily_return = mean(profits)
    std_daily_return = pstdev(profits) if len(profits) > 1 else 0
    sharpe_ratio = (avg_daily_return / std_daily_return) if std_daily_return > 0 else 0

    avg_win = mean(winning_profits) if winning_profits else 0
    losses = [abs(p) for p in profits if p < 0]
    avg_loss = mean(losses) if losses else 1
    win_rate = win_count / total_trades
    loss_rate = 1 - win_rate
    kelly = ((win_rate * avg_win) - (loss_rate * avg_loss)) / avg_win * 100 if avg_win > 0 else 0

    return {
        "total_trades": total_trades,
        "winning_trades": win_count,
        "win_rate_pct": round(win_rate_pct, 1),
        "total_profit": round(total_profit, 2),
        "avg_profit_per_trade": round(avg_profit_per_trade, 2),
        "max_drawdown_pct": round(max_drawdown_pct, 1),
        "sharpe_ratio": round(sharpe_ratio, 2),
        "kelly_criterion_pct": round(kelly, 1),
    }
