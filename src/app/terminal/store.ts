/**
 * Bloomberg Terminal Store
 * Zustand store for terminal state management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  TerminalState, 
  StockQuote, 
  WatchlistItem, 
  NewsItem, 
  TickerItem,
  CandlestickData,
  PanelType 
} from './types';

// Mock data generators
const generateMockQuote = (symbol: string, basePrice: number): StockQuote => {
  const change = (Math.random() - 0.5) * basePrice * 0.02;
  const price = basePrice + change;
  
  return {
    symbol,
    name: getCompanyName(symbol),
    price: Number(price.toFixed(2)),
    change: Number(change.toFixed(2)),
    changePercent: Number(((change / basePrice) * 100).toFixed(2)),
    volume: Math.floor(Math.random() * 10000000) + 1000000,
    marketCap: `${(Math.random() * 2 + 0.1).toFixed(1)}T`,
    peRatio: Number((Math.random() * 30 + 10).toFixed(2)),
    high: Number((price * 1.02).toFixed(2)),
    low: Number((price * 0.98).toFixed(2)),
    open: Number((basePrice + (Math.random() - 0.5) * 5).toFixed(2)),
    previousClose: Number(basePrice.toFixed(2)),
    bid: Number((price - 0.01).toFixed(2)),
    ask: Number((price + 0.01).toFixed(2)),
    bidSize: Math.floor(Math.random() * 1000) + 100,
    askSize: Math.floor(Math.random() * 1000) + 100,
    timestamp: new Date().toISOString(),
  };
};

const getCompanyName = (symbol: string): string => {
  const names: Record<string, string> = {
    'AAPL': 'Apple Inc.',
    'GOOGL': 'Alphabet Inc.',
    'MSFT': 'Microsoft Corp.',
    'AMZN': 'Amazon.com Inc.',
    'TSLA': 'Tesla Inc.',
    'META': 'Meta Platforms Inc.',
    'NVDA': 'NVIDIA Corp.',
    'JPM': 'JPMorgan Chase & Co.',
    'V': 'Visa Inc.',
    'WMT': 'Walmart Inc.',
    'SPY': 'SPDR S&P 500 ETF',
    'QQQ': 'Invesco QQQ Trust',
    'IWM': 'iShares Russell 2000',
    'BTC': 'Bitcoin USD',
    'ETH': 'Ethereum USD',
  };
  return names[symbol] || `${symbol} Corp.`;
};

const generateMockChartData = (symbol: string, days: number = 30): CandlestickData[] => {
  const data: CandlestickData[] = [];
  let price = 150 + Math.random() * 100;
  
  for (let i = 0; i < days; i++) {
    const volatility = price * 0.02;
    const open = price;
    const close = price + (Math.random() - 0.5) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    
    data.push({
      timestamp: Date.now() - (days - i) * 24 * 60 * 60 * 1000,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000) + 1000000,
    });
    
    price = close;
  }
  
  return data;
};

const generateMockNews = (): NewsItem[] => {
  const headlines = [
    { text: 'Fed Signals Potential Rate Cut in Coming Months', sentiment: 'positive' as const },
    { text: 'Tech Stocks Rally on Strong Earnings Reports', sentiment: 'positive' as const },
    { text: 'Oil Prices Surge Amid Supply Concerns', sentiment: 'negative' as const },
    { text: 'Inflation Data Shows Signs of Cooling', sentiment: 'positive' as const },
    { text: 'Market Volatility Continues Amid Global Uncertainty', sentiment: 'neutral' as const },
    { text: 'Apple Unveils New AI Features for iPhone', sentiment: 'positive' as const },
    { text: 'Tesla Delivers Record Number of Vehicles', sentiment: 'positive' as const },
    { text: 'Banking Sector Faces Regulatory Pressure', sentiment: 'negative' as const },
  ];
  
  return headlines.map((item, index) => ({
    id: `news-${index}`,
    headline: item.text,
    source: ['Bloomberg', 'Reuters', 'CNBC', 'WSJ'][Math.floor(Math.random() * 4)],
    timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    summary: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    sentiment: item.sentiment,
    relatedSymbols: ['AAPL', 'MSFT', 'TSLA', 'SPY'].slice(0, Math.floor(Math.random() * 3) + 1),
  }));
};

const defaultWatchlist: WatchlistItem[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 185.92, change: 2.34, changePercent: 1.27 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.65, change: -1.23, changePercent: -0.85 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 378.91, change: 5.67, changePercent: 1.52 },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 238.45, change: -8.92, changePercent: -3.61 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 721.28, change: 15.43, changePercent: 2.18 },
];

const defaultTickerData: TickerItem[] = [
  { symbol: 'SPY', price: 485.32, change: 3.21, changePercent: 0.67 },
  { symbol: 'QQQ', price: 412.15, change: 2.89, changePercent: 0.71 },
  { symbol: 'IWM', price: 198.45, change: -0.92, changePercent: -0.46 },
  { symbol: 'BTC', price: 64523.18, change: 1234.56, changePercent: 1.95 },
  { symbol: 'ETH', price: 3456.78, change: 89.12, changePercent: 2.65 },
];

interface TerminalStore extends TerminalState {
  // Actions
  setActiveSymbol: (symbol: string) => void;
  setTimeframe: (timeframe: TerminalState['selectedTimeframe']) => void;
  setPanel: (position: keyof TerminalState['layout'], panel: PanelType) => void;
  executeCommand: (command: string) => void;
  addToWatchlist: (item: WatchlistItem) => void;
  removeFromWatchlist: (symbol: string) => void;
  updateQuotes: () => void;
  updateChartData: (symbol: string) => void;
}

export const useTerminalStore = create<TerminalStore>()(
  persist(
    (set, get) => ({
      // Initial state
      quotes: {
        'AAPL': generateMockQuote('AAPL', 185.92),
        'GOOGL': generateMockQuote('GOOGL', 142.65),
        'MSFT': generateMockQuote('MSFT', 378.91),
        'AMZN': generateMockQuote('AMZN', 178.23),
        'TSLA': generateMockQuote('TSLA', 238.45),
        'META': generateMockQuote('META', 498.72),
        'NVDA': generateMockQuote('NVDA', 721.28),
        'SPY': generateMockQuote('SPY', 485.32),
      },
      watchlist: defaultWatchlist,
      news: generateMockNews(),
      tickerData: defaultTickerData,
      chartData: {
        'AAPL': generateMockChartData('AAPL'),
        'SPY': generateMockChartData('SPY'),
      },
      activeSymbol: 'AAPL',
      selectedTimeframe: '1D',
      layout: {
        topLeft: 'quotes',
        topRight: 'chart',
        bottomLeft: 'watchlist',
        bottomRight: 'news',
      },
      commandHistory: [],
      currentCommand: '',
      isLoading: false,
      lastUpdate: new Date().toISOString(),

      // Actions
      setActiveSymbol: (symbol) => {
        set({ activeSymbol: symbol });
        // Ensure chart data exists
        if (!get().chartData[symbol]) {
          get().updateChartData(symbol);
        }
      },

      setTimeframe: (timeframe) => set({ selectedTimeframe: timeframe }),

      setPanel: (position, panel) => {
        set((state) => ({
          layout: { ...state.layout, [position]: panel },
        }));
      },

      executeCommand: (command) => {
        const trimmedCommand = command.trim().toUpperCase();
        
        set((state) => ({
          commandHistory: [...state.commandHistory, trimmedCommand].slice(-50),
          currentCommand: '',
        }));

        // Parse command
        const parts = trimmedCommand.split(' ');
        const cmd = parts[0];
        const args = parts.slice(1);

        switch (cmd) {
          case 'TICKER':
          case 'TK':
            if (args[0]) {
              get().setActiveSymbol(args[0]);
            }
            break;
          case 'ADD':
            if (args[0]) {
              const symbol = args[0];
              const quote = get().quotes[symbol] || generateMockQuote(symbol, 100 + Math.random() * 200);
              get().addToWatchlist({
                symbol,
                name: quote.name,
                price: quote.price,
                change: quote.change,
                changePercent: quote.changePercent,
              });
            }
            break;
          case 'REMOVE':
          case 'RM':
            if (args[0]) {
              get().removeFromWatchlist(args[0]);
            }
            break;
          case 'TIME':
          case 'TF':
            if (args[0] && ['1D', '1W', '1M', '3M', '1Y'].includes(args[0])) {
              get().setTimeframe(args[0] as TerminalState['selectedTimeframe']);
            }
            break;
          case 'CLEAR':
          case 'CLS':
            set({ commandHistory: [] });
            break;
          case 'UPDATE':
            get().updateQuotes();
            break;
          default:
            // Try to interpret as symbol lookup
            if (cmd.length > 0 && cmd.length <= 5) {
              get().setActiveSymbol(cmd);
            }
        }
      },

      addToWatchlist: (item) => {
        set((state) => ({
          watchlist: [...state.watchlist.filter(w => w.symbol !== item.symbol), item],
        }));
      },

      removeFromWatchlist: (symbol) => {
        set((state) => ({
          watchlist: state.watchlist.filter(w => w.symbol !== symbol),
        }));
      },

      updateQuotes: () => {
        set((state) => {
          const newQuotes: Record<string, StockQuote> = {};
          
          Object.keys(state.quotes).forEach((symbol) => {
            const currentQuote = state.quotes[symbol];
            newQuotes[symbol] = generateMockQuote(symbol, currentQuote.previousClose);
          });

          // Update ticker data
          const newTickerData = state.tickerData.map(item => {
            const change = (Math.random() - 0.5) * item.price * 0.005;
            return {
              ...item,
              price: Number((item.price + change).toFixed(2)),
              change: Number(change.toFixed(2)),
              changePercent: Number(((change / item.price) * 100).toFixed(2)),
            };
          });

          // Update watchlist
          const newWatchlist = state.watchlist.map(item => {
            const change = (Math.random() - 0.5) * item.price * 0.01;
            return {
              ...item,
              price: Number((item.price + change).toFixed(2)),
              change: Number(change.toFixed(2)),
              changePercent: Number(((change / item.price) * 100).toFixed(2)),
            };
          });

          return {
            quotes: newQuotes,
            tickerData: newTickerData,
            watchlist: newWatchlist,
            lastUpdate: new Date().toISOString(),
          };
        });
      },

      updateChartData: (symbol) => {
        set((state) => ({
          chartData: {
            ...state.chartData,
            [symbol]: generateMockChartData(symbol),
          },
        }));
      },
    }),
    {
      name: 'terminal-storage',
      partialize: (state) => ({
        watchlist: state.watchlist,
        layout: state.layout,
        commandHistory: state.commandHistory,
      }),
    }
  )
);
