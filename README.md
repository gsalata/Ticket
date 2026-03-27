# Concert Ticket Sales Tracker (Free First Version)

This repository contains a zero-cost MVP for tracking concert ticket prices with a TickPick-first workflow.

## What is included

- Flask backend API with SQLite schema initialization.
- TickPick scraper module (mock mode by default, Selenium mode optional).
- Background daemon for periodic snapshot collection.
- Excel export endpoint using openpyxl.
- Minimal React frontend scaffold.

## Quick start

```bash
python3 -m pip install -r requirements.txt
python3 backend/db.py --init
python3 -m backend.app
```

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

## API endpoints

- `GET /api/health`
- `POST /api/concerts`
- `GET /api/concerts`
- `GET /api/dashboard`
- `POST /api/concerts/<concert_id>/refresh`
- `GET /api/concerts/<concert_id>/price-history`
- `GET /api/concerts/<concert_id>/signal`
- `POST /api/export`
