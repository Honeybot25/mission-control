# GEX Terminal - Quick Start Guide

## What This Is

A real-time trading dashboard that shows:
- Gamma exposure (GEX) levels by strike price
- AI-generated trading signals (BUY/SELL/HOLD)
- Performance metrics (P&L, win rate, Sharpe ratio)
- Trade history with detailed logs

## Accessing the Dashboard

**Live URL:** https://gex-terminal.vercel.app

**Local:** http://localhost:3000/gex-terminal

## How to Use

### 1. Select a Ticker
Click any ticker button (SPY, QQQ, NVDA, etc.) to view its GEX data.

### 2. Read the Signal
The dashboard shows:
- Current price
- Max Pain strike (pinning level)
- Zero Gamma strike (flip point)
- AI Signal (Bullish/Bearish/Neutral)

### 3. Check Performance
The performance panel shows:
- Total P&L
- Win rate
- Sharpe ratio
- Max drawdown

### 4. View Trade History
Click "Trade History" to see all closed trades with P&L details.

## Discord Alerts

Get notified on your phone when:
- New trading signals generated
- Trades executed
- System errors occur

**Setup:** Provide Discord webhook URL to enable alerts.

## API Endpoints

- `/api/signals` - Recent trading signals
- `/api/trades` - Trade history with P&L
- `/api/performance` - Performance metrics

## Support

For issues or questions, check:
- `docs/ARCHITECTURE.md` - Technical details
- `/api/webhook/alerts` - Discord integration docs

---

*Built for R's personal trading use*