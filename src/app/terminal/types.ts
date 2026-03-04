/**
 * Bloomberg Terminal Types
 * Core type definitions for the trading terminal
 */

// Market Data Types
export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: string;
  peRatio?: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  bid: number;
  ask: number;
  bidSize: number;
  askSize: number;
  timestamp: string;
}

export interface CandlestickData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface NewsItem {
  id: string;
  headline: string;
  source: string;
  timestamp: string;
  summary?: string;
  url?: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  relatedSymbols: string[];
}

export interface WatchlistItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  alertPrice?: number;
}

export interface TickerItem {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

// Terminal State Types
export interface TerminalState {
  // Data
  quotes: Record<string, StockQuote>;
  watchlist: WatchlistItem[];
  news: NewsItem[];
  tickerData: TickerItem[];
  chartData: Record<string, CandlestickData[]>;
  
  // UI State
  activeSymbol: string;
  selectedTimeframe: '1D' | '1W' | '1M' | '3M' | '1Y';
  layout: PanelLayout;
  commandHistory: string[];
  currentCommand: string;
  
  // Loading states
  isLoading: boolean;
  lastUpdate: string | null;
}

export interface PanelLayout {
  topLeft: PanelType;
  topRight: PanelType;
  bottomLeft: PanelType;
  bottomRight: PanelType;
}

export type PanelType = 
  | 'quotes' 
  | 'chart' 
  | 'news' 
  | 'watchlist' 
  | 'orderbook' 
  | 'trades' 
  | 'analytics';

// Command Types
export interface Command {
  name: string;
  shortcut: string;
  description: string;
  action: (args: string[]) => void;
}

// Alert Types
export interface PriceAlert {
  id: string;
  symbol: string;
  condition: 'above' | 'below';
  price: number;
  triggered: boolean;
  createdAt: string;
}

// Color Theme
export interface BloombergTheme {
  colors: {
    background: string;
    foreground: string;
    amber: string;
    green: string;
    red: string;
    cyan: string;
    magenta: string;
    yellow: string;
    gray: string;
    darkGray: string;
    border: string;
  };
  fonts: {
    mono: string;
    sans: string;
  };
}
