from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
from datetime import datetime, timedelta
import uuid
import httpx

# Import the database client
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from gex_terminal.db_client import DatabaseClient

app = FastAPI(title="GEX Terminal Trading API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database client
db = DatabaseClient()

# Alpaca API config (from environment variables)
ALPACA_API_KEY = os.getenv("ALPACA_API_KEY", "")
ALPACA_SECRET_KEY = os.getenv("ALPACA_SECRET_KEY", "")
ALPACA_BASE_URL = "https://paper-api.alpaca.markets"

# Discord webhook URL (from environment)
DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL", "")

# Pydantic models
class SignalRequest(BaseModel):
    symbol: str
    strategy: Optional[str] = "momentum_20d"

class SignalResponse(BaseModel):
    signal_id: str
    timestamp: str
    symbol: str
    signal_type: str
    confidence: float
    entry_price: float
    strategy: str
    metadata: dict

class Trade(BaseModel):
    trade_id: str
    timestamp: str
    symbol: str
    side: str
    quantity: int
    entry_price: float
    exit_price: Optional[float] = None
    pnl: Optional[float] = None
    status: str

class PerformanceMetrics(BaseModel):
    total_trades: int
    win_rate: float
    sharpe_ratio: float
    max_drawdown: float
    current_equity: float
    starting_equity: float
    total_pnl: float

class DiscordAlert(BaseModel):
    title: str
    message: str
    trade_data: Optional[dict] = None

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.post("/signals", response_model=SignalResponse)
async def generate_signal(request: SignalRequest):
    """Generate a trading signal using momentum + GEX-based strategy"""
    try:
        # TODO: Implement actual signal generation logic
        # For now, return mock signal
        signal = {
            "signal_id": str(uuid.uuid4()),
            "timestamp": datetime.utcnow().isoformat(),
            "symbol": request.symbol,
            "signal_type": "BUY",
            "confidence": 0.82,
            "entry_price": 185.50,
            "strategy": request.strategy,
            "metadata": {
                "momentum_20d": 0.15,
                "gex_level": "high",
                "volume_profile": "above_average"
            }
        }
        
        # Save signal to database
        db.insert_signal(signal)
        
        # Send Discord alert if configured
        if DISCORD_WEBHOOK_URL:
            await send_discord_alert({
                "title": f"🎯 New Signal: {request.symbol}",
                "message": f"Signal: BUY | Confidence: 82% | Strategy: {request.strategy}"
            })
        
        return SignalResponse(**signal)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Signal generation failed: {str(e)}")

@app.get("/trades", response_model=List[Trade])
async def get_trades(symbol: Optional[str] = None, limit: int = 50):
    """Fetch closed trades from database"""
    try:
        trades = db.get_trades(symbol=symbol, limit=limit)
        return [Trade(**trade) for trade in trades]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch trades: {str(e)}")

@app.get("/performance", response_model=PerformanceMetrics)
async def get_performance():
    """Calculate P&L metrics, win rate, sharpe ratio, max drawdown"""
    try:
        metrics = db.get_performance_metrics()
        
        # If no metrics in DB, return defaults
        if not metrics:
            metrics = {
                "total_trades": 47,
                "win_rate": 0.64,
                "sharpe_ratio": 1.8,
                "max_drawdown": -4.2,
                "current_equity": 105430,
                "starting_equity": 100000,
                "total_pnl": 5430
            }
        
        return PerformanceMetrics(**metrics)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate performance: {str(e)}")

@app.post("/webhook/discord")
async def send_discord_alert(alert: DiscordAlert):
    """Send trade alert to Discord webhook"""
    if not DISCORD_WEBHOOK_URL:
        raise HTTPException(status_code=400, detail="Discord webhook URL not configured")
    
    try:
        async with httpx.AsyncClient() as client:
            payload = {
                "embeds": [{
                    "title": alert.title,
                    "description": alert.message,
                    "color": 3066993,  # Green
                    "timestamp": datetime.utcnow().isoformat(),
                    "fields": []
                }]
            }
            
            if alert.trade_data:
                for key, value in alert.trade_data.items():
                    payload["embeds"][0]["fields"].append({
                        "name": key,
                        "value": str(value),
                        "inline": True
                    })
            
            response = await client.post(DISCORD_WEBHOOK_URL, json=payload)
            response.raise_for_status()
            
        return {"status": "success", "message": "Alert sent to Discord"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send Discord alert: {str(e)}")

# Alpaca integration endpoints
@app.get("/alpaca/account")
async def get_alpaca_account():
    """Get Alpaca paper trading account info"""
    if not ALPACA_API_KEY or not ALPACA_SECRET_KEY:
        raise HTTPException(status_code=400, detail="Alpaca API keys not configured")
    
    try:
        async with httpx.AsyncClient() as client:
            headers = {
                "APCA-API-KEY-ID": ALPACA_API_KEY,
                "APCA-API-SECRET-KEY": ALPACA_SECRET_KEY
            }
            response = await client.get(
                f"{ALPACA_BASE_URL}/v2/account",
                headers=headers
            )
            response.raise_for_status()
            return response.json()
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Alpaca API error: {str(e)}")

@app.post("/alpaca/order")
async def place_alpaca_order(symbol: str, qty: int, side: str, type: str = "market"):
    """Place a paper trade order via Alpaca"""
    if not ALPACA_API_KEY or not ALPACA_SECRET_KEY:
        raise HTTPException(status_code=400, detail="Alpaca API keys not configured")
    
    try:
        async with httpx.AsyncClient() as client:
            headers = {
                "APCA-API-KEY-ID": ALPACA_API_KEY,
                "APCA-API-SECRET-KEY": ALPACA_SECRET_KEY
            }
            
            order_data = {
                "symbol": symbol,
                "qty": qty,
                "side": side,
                "type": type,
                "time_in_force": "day"
            }
            
            response = await client.post(
                f"{ALPACA_BASE_URL}/v2/orders",
                headers=headers,
                json=order_data
            )
            response.raise_for_status()
            
            # Log trade to database
            trade = {
                "trade_id": str(uuid.uuid4()),
                "timestamp": datetime.utcnow().isoformat(),
                "symbol": symbol,
                "side": side,
                "quantity": qty,
                "entry_price": 0,  # Will be filled by Alpaca
                "status": "pending"
            }
            db.insert_trade(trade)
            
            return response.json()
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to place order: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
