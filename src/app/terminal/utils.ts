/**
 * Terminal Utilities
 * Helper functions for Bloomberg-style terminal
 */

export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
}

export interface NewsItem {
  id: string;
  time: string;
  headline: string;
  source: string;
  category: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface ChartData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const generateMockQuotes = (): Quote[] => [
  { symbol: 'SPY', price: 487.32, change: 1.24, changePercent: 0.25, volume: 45200000, high: 488.15, low: 485.82, open: 486.20, prevClose: 486.08 },
  { symbol: 'QQQ', price: 412.15, change: -0.87, changePercent: -0.21, volume: 28900000, high: 414.20, low: 410.50, open: 413.00, prevClose: 413.02 },
  { symbol: 'AAPL', price: 182.52, change: 2.15, changePercent: 1.19, volume: 52300000, high: 183.50, low: 180.20, open: 180.50, prevClose: 180.37 },
  { symbol: 'NVDA', price: 875.28, change: 12.45, changePercent: 1.44, volume: 45600000, high: 882.00, low: 860.50, open: 862.00, prevClose: 862.83 },
  { symbol: 'TSLA', price: 202.64, change: -3.21, changePercent: -1.56, volume: 98100000, high: 208.50, low: 200.20, open: 206.00, prevClose: 205.85 },
  { symbol: 'MSFT', price: 413.64, change: 1.85, changePercent: 0.45, volume: 22100000, high: 415.20, low: 411.50, open: 412.00, prevClose: 411.79 },
  { symbol: 'GOOGL', price: 137.57, change: 0.92, changePercent: 0.67, volume: 18700000, high: 138.50, low: 136.20, open: 136.50, prevClose: 136.65 },
  { symbol: 'AMZN', price: 178.35, change: -1.24, changePercent: -0.69, volume: 32400000, high: 181.00, low: 177.20, open: 180.50, prevClose: 179.59 },
];

export const generateMockNews = (): NewsItem[] => [
  { id: '1', time: '12:03 PM', headline: 'Fed signals potential rate cuts in Q2 as inflation cools', source: 'Bloomberg', category: 'Macro', sentiment: 'positive' },
  { id: '2', time: '11:45 AM', headline: 'NVDA announces next-gen AI chip architecture, shares rise', source: 'Reuters', category: 'Tech', sentiment: 'positive' },
  { id: '3', time: '11:30 AM', headline: 'Market breadth improves as tech sector leads rally', source: 'WSJ', category: 'Market', sentiment: 'positive' },
  { id: '4', time: '10:15 AM', headline: 'Oil prices stabilize after OPEC+ maintains production cuts', source: 'CNBC', category: 'Commodities', sentiment: 'neutral' },
  { id: '5', time: '9:45 AM', headline: 'Tesla announces price cuts in key markets to boost demand', source: 'Bloomberg', category: 'Auto', sentiment: 'negative' },
];

export const generateMockChartData = (days: number = 30): ChartData[] => {
  const data: ChartData[] = [];
  let price = 180;
  
  for (let i = 0; i < days; i++) {
    const volatility = Math.random() * 4 - 2;
    price += volatility;
    
    const open = price;
    const close = price + (Math.random() * 4 - 2);
    const high = Math.max(open, close) + Math.random() * 2;
    const low = Math.min(open, close) - Math.random() * 2;
    
    data.push({
      timestamp: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000) + 5000000,
    });
  }
  
  return data;
};

export const formatPrice = (price: number): string => {
  return price.toFixed(2);
};

export const formatChange = (change: number): string => {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}`;
};

export const formatChangePercent = (percent: number): string => {
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}%`;
};

export const formatVolume = (volume: number): string => {
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M`;
  }
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K`;
  }
  return volume.toString();
};

// Bloomberg-style commands
export const commands = {
  EQUITY: 'Display equity quotes and fundamentals',
  NEWS: 'Show market news feed',
  CHART: 'Display price charts',
  WATCH: 'Manage watchlists',
  PORT: 'Portfolio tracking',
  CALC: 'Calculator and tools',
  HELP: 'Show available commands',
  CLEAR: 'Clear terminal screen',
};
