# GEX Terminal Trading API

FastAPI backend for GEX Terminal paper trading system.

## Features

- **Signal Generation** (`POST /signals`): Momentum + GEX-based trading signals
- **Trade History** (`GET /trades`): Fetch closed trades from database
- **Performance Metrics** (`GET /performance`): P&L, win rate, sharpe ratio, max drawdown
- **Discord Alerts** (`POST /webhook/discord`): Real-time trade notifications
- **Alpaca Integration**: Paper trading via Alpaca Markets API

## Setup

### 1. Install Dependencies

```bash
cd /Users/Honeybot/.openclaw/workspace/mission-control/src/app/api
pip install -r requirements.txt
```

### 2. Environment Variables

Create `.env` file:

```bash
# Alpaca Paper Trading
ALPACA_API_KEY=your_alpaca_key
ALPACA_SECRET_KEY=your_alpaca_secret

# Discord Webhook (optional)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

# Supabase (if using cloud)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key
```

### 3. Run the API

```bash
python trading_api.py
```

Or with uvicorn directly:

```bash
uvicorn trading_api:app --reload --port 8000
```

### 4. API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Signals
- `POST /signals` - Generate trading signal
- Request: `{"symbol": "AAPL", "strategy": "momentum_20d"}`
- Response: Signal object with confidence, entry price, metadata

### Trades
- `GET /trades` - Get trade history
- Query params: `?symbol=AAPL&limit=50`
- Response: Array of trade objects

### Performance
- `GET /performance` - Get P&L metrics
- Response: Win rate, sharpe ratio, max drawdown, equity

### Discord
- `POST /webhook/discord` - Send alert
- Request: `{"title": "New Trade", "message": "Bought AAPL"}`

### Alpaca
- `GET /alpaca/account` - Get account info
- `POST /alpaca/order` - Place paper trade

## Integration with GEX Terminal

The frontend (`/gex-terminal/`) connects to these endpoints for:
1. Real-time trading signals
2. Historical trade analysis
3. Performance dashboard
4. Discord notifications

## Next Steps

1. Get Alpaca API keys from https://alpaca.markets
2. Set up Discord webhook for alerts
3. Test endpoints with Swagger UI
4. Integrate with GEX Terminal frontend

## Architecture

```
GEX Terminal (Next.js)  ←→  Trading API (FastAPI)  ←→  Alpaca (Paper Trading)
                                    ↓
                              Discord Alerts
                                    ↓
                              Supabase/SQLite (Logs)
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `ALPACA_API_KEY` | Yes | Alpaca API key |
| `ALPACA_SECRET_KEY` | Yes | Alpaca secret key |
| `DISCORD_WEBHOOK_URL` | No | Discord webhook for alerts |
| `SUPABASE_URL` | No | Supabase project URL |
| `SUPABASE_KEY` | No | Supabase anon key |

## Testing

Test the API with curl:

```bash
# Health check
curl http://localhost:8000/health

# Generate signal
curl -X POST http://localhost:8000/signals \
  -H "Content-Type: application/json" \
  -d '{"symbol": "AAPL", "strategy": "momentum_20d"}'

# Get trades
curl "http://localhost:8000/trades?symbol=AAPL&limit=10"

# Get performance
curl http://localhost:8000/performance
```
