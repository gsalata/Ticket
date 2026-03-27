# Dashboard research notes (Quant-style ticket analytics)

## Goal
Design a dashboard inspired by quant market terminals (similar interaction model to quantdata-style pages) for ticket inventory and pricing.

## Library shortlist from `tiffapedia/resources-datavis`
The referenced curated list includes these relevant React/web options:
- Plotly.js
- ECharts
- Recharts
- nivo
- Victory

Source: https://github.com/tiffapedia/resources-datavis

## Recommended stack for this project
1. **Plotly.js + react-plotly.js** (already in this repo)
   - Strong financial-style and analytical chart support.
   - Fast to iterate for multi-panel dashboards.
2. **Optional later: Apache ECharts**
   - Excellent for larger, highly interactive dashboards and heatmaps.
3. Keep styling lightweight in custom CSS / inline for now.

## High-priority visuals for ticket trading dashboard
1. **KPI strip**
   - Latest get-in
   - Latest median
   - Spread % (median - get-in)
   - Listings count
   - Snapshot count
2. **Price trend chart**
   - Dual line: get-in and median over time.
3. **Liquidity chart**
   - Listings over time (bar chart).
4. **Spread monitor**
   - Area chart of spread (median - get-in).
5. **Volatility chart**
   - Rolling standard deviation of get-in price.
6. **Price vs liquidity scatter**
   - Relationship between price and available listings.

## UX principles applied
- Dark quant-style visual language.
- Left rail for instrument selection (concerts).
- Right pane for analytics.
- One-click refresh and one-click export.
- Clear signal and rationale near charts.

## Future additions
- Multi-concert heatmap by day/time.
- Event calendar timeline view.
- Portfolio PnL curve and drawdown chart.
- Alert thresholds and webhook notifications.
