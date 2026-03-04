# GEX Terminal - System Architecture

## Overview

GEX Terminal is a real-time trading dashboard with paper trading integration, performance analytics, and Discord notifications.

## Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Data:** Polygon.io (market data), Alpaca (paper trading)
- **Database:** Supabase (primary), SQLite (fallback)
- **Notifications:** Discord webhooks
- **Hosting:** Vercel

## Architecture Diagram

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User Browser  │────▶│  GEX Terminal UI │◀────│   Next.js API   │
│                 │     │  (Next.js/React) │     │    Routes       │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                         │
                              ┌──────────────────────────┼──────────┐
                              │                          │          │
                              ▼                          ▼          ▼
                    ┌─────────────────┐      ┌──────────────────┐
                    │ TraderBot API   │      │   Market Data    │
                    │ (Alpaca/Paper)  │      │  (Polygon.io)   │
                    └────────┬────────┘      └──────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Database      │
                    │ (Supabase/SQLite)│
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Discord       │
                    │   Alerts        │
                    └─────────────────┘
```

## API Routes

### `/api/signals`
- **GET:** Fetch recent trading signals
- **Query params:** `ticker`, `limit`
- **Response:** Array of signal objects

### `/api/trades`
- **GET:** Fetch closed trades with P&L
- **Query params:** `status`, `limit`
- **Response:** Array of trade objects

### `/api/performance`
- **GET:** Aggregate performance metrics
- **Response:** P&L, win rate, Sharpe ratio, etc.

### `/api/webhook/alerts`
- **POST:** Send Discord alerts
- **Body:** `{ type, message, data }`

## Data Flow

1. **Market Data:** Polygon.io provides real-time GEX calculations
2. **Signals:** TraderBot generates BUY/SELL/HOLD signals
3. **Execution:** Alpaca paper trading executes signals
4. **Logging:** All trades logged to database
5. **Notifications:** Discord alerts on key events
6. **Dashboard:** UI displays real-time data

## Signal Schema

```json
{
  "timestamp": "2026-03-02T10:06:00Z",
  "ticker": "AAPL",
  "signal": "BUY|SELL|HOLD",
  "confidence": 0.85,
  "price": 185.42,
  "gex_level": 2500000,
  "strike": 185.00,
  "expiration": "2026-03-07",
  "strategy": "gamma_squeeze|momentum|mean_reversion"
}
```

## Environment Variables

```env
# Market Data
POLYGON_API_KEY=your_polygon_key

# Trading
ALPACA_API_KEY=your_alpaca_key
ALPACA_SECRET_KEY=your_alpaca_secret

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key

# Notifications
DISCORD_WEBHOOK_URL=your_discord_webhook

# Feature Flags
NEXT_PUBLIC_USE_MOCK=false
```

## Local Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Open http://localhost:3000/gex-terminal
```

## Deployment

```bash
# Deploy to Vercel
vercel --prod
```

## Troubleshooting

**Issue:** No data loading  
**Fix:** Check POLYGON_API_KEY in environment

**Issue:** Discord alerts not sending  
**Fix:** Verify DISCORD_WEBHOOK_URL is set

**Issue:** Database errors  
**Fix:** Check Supabase credentials or use SQLite fallback

---

*Last updated: March 2, 2026*