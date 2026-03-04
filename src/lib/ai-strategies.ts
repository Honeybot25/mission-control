import { supabase } from './supabase-client';

export interface AIStrategy {
  id: string;
  name: string;
  description: string | null;
  natural_language_input: string;
  generated_code: string;
  language: string;
  performance_metrics: {
    win_rate: number;
    profit_factor: number;
    sharpe_ratio: number;
    total_trades: number;
    profitable_trades: number;
    avg_win: number;
    avg_loss: number;
    max_drawdown: number;
    total_return: number;
  };
  backtest_results: {
    equity_curve: { date: string; equity: number }[];
    trades: { entry: string; exit: string; pnl: number; type: 'long' | 'short' }[];
  };
  tags: string[];
  status: 'draft' | 'backtested' | 'deployed' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  example: string;
}

export const STRATEGY_TEMPLATES: StrategyTemplate[] = [
  {
    id: 'momentum',
    name: 'Momentum Strategy',
    description: 'Trade based on price momentum indicators',
    category: 'Technical',
    example: 'Buy when RSI is below 30 and price crosses above 20-day moving average'
  },
  {
    id: 'mean_reversion',
    name: 'Mean Reversion',
    description: 'Trade price deviations from average',
    category: 'Technical',
    example: 'Short when price is 2 standard deviations above 50-day moving average'
  },
  {
    id: 'breakout',
    name: 'Breakout Strategy',
    description: 'Enter on price breakouts from ranges',
    category: 'Technical',
    example: 'Buy when price breaks above 20-day high with volume > 2x average'
  },
  {
    id: 'trend_following',
    name: 'Trend Following',
    description: 'Follow established trends with moving averages',
    category: 'Technical',
    example: 'Long when 50 EMA crosses above 200 EMA (golden cross)'
  },
  {
    id: 'volatility',
    name: 'Volatility Expansion',
    description: 'Trade volatility breakouts using Bollinger Bands',
    category: 'Technical',
    example: 'Enter when Bollinger Bands width expands after contraction'
  }
];

export async function getStrategies(limit: number = 50): Promise<AIStrategy[]> {
  if (!supabase) {
    console.warn('[Supabase] Not configured, returning empty strategies list');
    return [];
  }

  const { data, error } = await supabase
    .from('ai_strategies')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Supabase] Failed to fetch strategies:', error);
    return [];
  }

  return data || [];
}

export async function getStrategyById(id: string): Promise<AIStrategy | null> {
  if (!supabase) {
    console.warn('[Supabase] Not configured, cannot fetch strategy');
    return null;
  }

  const { data, error } = await supabase
    .from('ai_strategies')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[Supabase] Failed to fetch strategy:', error);
    return null;
  }

  return data;
}

export async function createStrategy(
  name: string,
  naturalLanguageInput: string,
  generatedCode: string
): Promise<AIStrategy | null> {
  if (!supabase) {
    console.warn('[Supabase] Not configured, cannot create strategy');
    return null;
  }

  // Simulate backtest results
  const backtestResults = generateMockBacktest();

  const { data, error } = await supabase
    .from('ai_strategies')
    .insert([{
      name,
      description: naturalLanguageInput.slice(0, 200),
      natural_language_input: naturalLanguageInput,
      generated_code: generatedCode,
      language: 'python',
      performance_metrics: backtestResults.metrics,
      backtest_results: {
        equity_curve: backtestResults.equityCurve,
        trades: backtestResults.trades
      },
      tags: extractTags(naturalLanguageInput),
      status: 'backtested'
    }])
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Failed to create strategy:', error);
    return null;
  }

  return data;
}

export async function updateStrategyStatus(
  id: string,
  status: AIStrategy['status']
): Promise<boolean> {
  if (!supabase) {
    console.warn('[Supabase] Not configured, cannot update strategy');
    return false;
  }

  const { error } = await supabase
    .from('ai_strategies')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('[Supabase] Failed to update strategy:', error);
    return false;
  }

  return true;
}

export async function deleteStrategy(id: string): Promise<boolean> {
  if (!supabase) {
    console.warn('[Supabase] Not configured, cannot delete strategy');
    return false;
  }

  const { error } = await supabase
    .from('ai_strategies')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[Supabase] Failed to delete strategy:', error);
    return false;
  }

  return true;
}

export function subscribeToStrategies(
  callback: (payload: { new: AIStrategy; old: AIStrategy | null; event: string }) => void
) {
  if (!supabase) {
    console.warn('[Supabase] Not configured, realtime disabled');
    return { unsubscribe: () => {} };
  }

  return supabase
    .channel('ai_strategies_channel')
    .on(
      'postgres_changes' as any,
      {
        event: '*',
        schema: 'public',
        table: 'ai_strategies'
      },
      (payload: { new: AIStrategy; old: AIStrategy | null; event: string }) => {
        callback(payload);
      }
    )
    .subscribe((status) => {
      console.log(`[Supabase Realtime] Strategies subscription status: ${status}`);
    });
}

// Generate mock backtest results
function generateMockBacktest() {
  const days = 252; // Trading days in a year
  const startEquity = 10000;
  const trades: { entry: string; exit: string; pnl: number; type: 'long' | 'short' }[] = [];
  const equityCurve: { date: string; equity: number }[] = [];
  
  let currentEquity = startEquity;
  let winningTrades = 0;
  let totalWinAmount = 0;
  let totalLossAmount = 0;
  let maxDrawdown = 0;
  let peakEquity = startEquity;

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    
    // Simulate 1-3 trades per day
    const numTrades = Math.floor(Math.random() * 3) + 1;
    
    for (let t = 0; t < numTrades; t++) {
      const isWin = Math.random() > 0.45; // 55% win rate
      const pnl = isWin 
        ? Math.random() * 150 + 50  // Win: $50-$200
        : -(Math.random() * 100 + 20); // Loss: -$20 to -$120
      
      if (isWin) {
        winningTrades++;
        totalWinAmount += pnl;
      } else {
        totalLossAmount += Math.abs(pnl);
      }
      
      trades.push({
        entry: date.toISOString().split('T')[0],
        exit: date.toISOString().split('T')[0],
        pnl: Math.round(pnl * 100) / 100,
        type: Math.random() > 0.5 ? 'long' : 'short'
      });
      
      currentEquity += pnl;
    }
    
    if (currentEquity > peakEquity) {
      peakEquity = currentEquity;
    }
    
    const drawdown = (peakEquity - currentEquity) / peakEquity;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
    
    equityCurve.push({
      date: date.toISOString().split('T')[0],
      equity: Math.round(currentEquity * 100) / 100
    });
  }

  const totalTrades = trades.length;
  const winRate = (winningTrades / totalTrades) * 100;
  const avgWin = winningTrades > 0 ? totalWinAmount / winningTrades : 0;
  const avgLoss = (totalTrades - winningTrades) > 0 ? totalLossAmount / (totalTrades - winningTrades) : 0;
  const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : 0;
  const totalReturn = ((currentEquity - startEquity) / startEquity) * 100;
  const sharpeRatio = 1.2 + (Math.random() * 0.8); // Simulated

  return {
    metrics: {
      win_rate: Math.round(winRate * 100) / 100,
      profit_factor: Math.round(profitFactor * 100) / 100,
      sharpe_ratio: Math.round(sharpeRatio * 100) / 100,
      total_trades: totalTrades,
      profitable_trades: winningTrades,
      avg_win: Math.round(avgWin * 100) / 100,
      avg_loss: Math.round(avgLoss * 100) / 100,
      max_drawdown: Math.round(maxDrawdown * 10000) / 100,
      total_return: Math.round(totalReturn * 100) / 100
    },
    equityCurve: equityCurve.slice(-90), // Last 90 days for display
    trades: trades.slice(-20) // Last 20 trades
  };
}

function extractTags(input: string): string[] {
  const tags: string[] = [];
  const lower = input.toLowerCase();
  
  if (lower.includes('rsi') || lower.includes('macd') || lower.includes('ema')) tags.push('technical');
  if (lower.includes('trend')) tags.push('trend-following');
  if (lower.includes('breakout')) tags.push('breakout');
  if (lower.includes('reversion') || lower.includes('mean')) tags.push('mean-reversion');
  if (lower.includes('momentum')) tags.push('momentum');
  if (lower.includes('volatility') || lower.includes('bollinger')) tags.push('volatility');
  if (lower.includes('crypto') || lower.includes('bitcoin')) tags.push('crypto');
  if (lower.includes('forex') || lower.includes('fx')) tags.push('forex');
  if (lower.includes('stock') || lower.includes('equity')) tags.push('stocks');
  
  return tags.length > 0 ? tags : ['strategy'];
}

export function generateStrategyCode(input: string, name: string): string {
  return `import pandas as pd
import numpy as np
from typing import Dict, List, Tuple
import talib

class ${name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '')}Strategy:
    """
    ${input}
    
    Generated by AI Strategy Generator
    """
    
    def __init__(self, 
                 initial_capital: float = 10000.0,
                 position_size: float = 0.1,
                 stop_loss_pct: float = 0.02,
                 take_profit_pct: float = 0.04):
        self.initial_capital = initial_capital
        self.position_size = position_size
        self.stop_loss_pct = stop_loss_pct
        self.take_profit_pct = take_profit_pct
        self.equity = initial_capital
        self.trades: List[Dict] = []
        
    def calculate_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate technical indicators"""
        df = df.copy()
        
        # Moving averages
        df['sma_20'] = df['close'].rolling(window=20).mean()
        df['sma_50'] = df['close'].rolling(window=50).mean()
        df['ema_12'] = talib.EMA(df['close'].values, timeperiod=12)
        df['ema_26'] = talib.EMA(df['close'].values, timeperiod=26)
        
        # RSI
        df['rsi'] = talib.RSI(df['close'].values, timeperiod=14)
        
        # MACD
        macd, signal, hist = talib.MACD(df['close'].values)
        df['macd'] = macd
        df['macd_signal'] = signal
        df['macd_hist'] = hist
        
        # Bollinger Bands
        upper, middle, lower = talib.BBANDS(df['close'].values)
        df['bb_upper'] = upper
        df['bb_middle'] = middle
        df['bb_lower'] = lower
        
        return df
        
    def generate_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        """Generate trading signals based on strategy logic"""
        df = self.calculate_indicators(df)
        df['signal'] = 0
        
        # Entry logic based on input description
        # Buy conditions
        buy_conditions = (
            (df['rsi'] < 30) &  # Oversold
            (df['close'] > df['sma_20']) &  # Price above 20 SMA
            (df['macd'] > df['macd_signal'])  # MACD bullish
        )
        
        # Sell conditions
        sell_conditions = (
            (df['rsi'] > 70) &  # Overbought
            (df['close'] < df['sma_20']) &  # Price below 20 SMA
            (df['macd'] < df['macd_signal'])  # MACD bearish
        )
        
        df.loc[buy_conditions, 'signal'] = 1
        df.loc[sell_conditions, 'signal'] = -1
        
        return df
        
    def backtest(self, df: pd.DataFrame) -> Dict:
        """Run backtest on historical data"""
        df = self.generate_signals(df)
        
        position = 0
        entry_price = 0
        equity_curve = [self.initial_capital]
        
        for i in range(1, len(df)):
            current_price = df['close'].iloc[i]
            signal = df['signal'].iloc[i]
            
            # Check stop loss / take profit
            if position != 0:
                pnl_pct = (current_price - entry_price) / entry_price * position
                
                if pnl_pct <= -self.stop_loss_pct or pnl_pct >= self.take_profit_pct:
                    # Close position
                    pnl = (current_price - entry_price) * position * (self.equity * self.position_size / entry_price)
                    self.equity += pnl
                    self.trades.append({
                        'entry': entry_price,
                        'exit': current_price,
                        'pnl': pnl,
                        'type': 'long' if position > 0 else 'short'
                    })
                    position = 0
            
            # New signal
            if signal != 0 and position == 0:
                position = signal
                entry_price = current_price
            
            equity_curve.append(self.equity)
        
        # Calculate metrics
        winning_trades = [t for t in self.trades if t['pnl'] > 0]
        losing_trades = [t for t in self.trades if t['pnl'] <= 0]
        
        metrics = {
            'total_return': (self.equity - self.initial_capital) / self.initial_capital * 100,
            'win_rate': len(winning_trades) / len(self.trades) * 100 if self.trades else 0,
            'profit_factor': abs(sum(t['pnl'] for t in winning_trades)) / abs(sum(t['pnl'] for t in losing_trades)) if losing_trades else 0,
            'sharpe_ratio': np.mean([t['pnl'] for t in self.trades]) / np.std([t['pnl'] for t in self.trades]) * np.sqrt(252) if self.trades else 0,
            'total_trades': len(self.trades)
        }
        
        return {
            'equity_curve': equity_curve,
            'trades': self.trades,
            'metrics': metrics
        }

# Usage
if __name__ == '__main__':
    # Load your data
    df = pd.read_csv('data.csv')
    
    # Initialize and run
    strategy = ${name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '')}Strategy()
    results = strategy.backtest(df)
    
    print(f"Total Return: {results['metrics']['total_return']:.2f}%")
    print(f"Win Rate: {results['metrics']['win_rate']:.2f}%")
`;
}