import { YouTubeAnalysis, TradingInsights, TradeSetup } from './youtube-analytics';

// FX Evolution channel ID
export const FX_EVOLUTION_CHANNEL_ID = 'UCWLXYI27E8vV9xLvCVgXqgw';

// Common forex pairs to detect
const FOREX_PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'NZD/USD', 'USD/CAD',
  'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'AUD/JPY', 'CAD/JPY', 'CHF/JPY', 'EUR/AUD',
  'GBP/AUD', 'EUR/CAD', 'GBP/CAD', 'EUR/CHF', 'GBP/CHF', 'AUD/CAD', 'NZD/JPY',
  'XAU/USD', 'XAG/USD', 'GOLD', 'SILVER', 'BTC/USD', 'ETH/USD', 'SPX', 'US30', 'NAS100'
];

// Timeframes to detect
const TIMEFRAMES = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN'];

// Price level patterns
const PRICE_PATTERN = /\b\d{1,5}\.\d{2,5}\b/g;
const PIPS_PATTERN = /\b(\d+)\s*pips?\b/gi;

export interface VideoData {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  transcript?: string;
  thumbnailUrl: string;
  videoUrl: string;
  viewCount: number;
  likeCount: number;
  duration: string;
}

/**
 * Extract transcript from YouTube video
 * Uses a proxy approach to bypass YouTube's cloud IP blocks
 */
export async function fetchYouTubeTranscript(videoId: string): Promise<string | null> {
  try {
    // Try multiple transcript sources
    const sources = [
      // YouTube's internal timedtext API via CORS proxy
      `https://corsproxy.io/?https://www.youtube.com/api/timedtext?v=${videoId}&lang=en`,
      // Fallback to transcript API
      `https://yt.lemnoslife.com/videos?part=snippet&id=${videoId}`,
    ];

    for (const url of sources) {
      try {
        const response = await fetch(url, { 
          timeout: 10000,
          headers: { 'Accept': 'application/json' }
        } as any);
        
        if (!response.ok) continue;
        
        const data = await response.json();
        
        // Parse different response formats
        if (data.items && data.items[0]?.snippet?.description) {
          return data.items[0].snippet.description;
        }
        
        // If we got XML/text transcript
        const text = await response.text();
        if (text.includes('<transcript') || text.includes('<text')) {
          // Parse XML transcript
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(text, 'text/xml');
          const textElements = xmlDoc.getElementsByTagName('text');
          let transcript = '';
          for (let i = 0; i < textElements.length; i++) {
            transcript += textElements[i].textContent + ' ';
          }
          return transcript.trim();
        }
      } catch (e) {
        console.warn(`[Transcript] Source failed: ${url}`, e);
        continue;
      }
    }

    // If all sources fail, return description as fallback
    return null;
  } catch (error) {
    console.error('[Transcript] Fetch error:', error);
    return null;
  }
}

/**
 * Detect forex pairs mentioned in text
 */
function detectForexPairs(text: string): string[] {
  const pairs: string[] = [];
  const upperText = text.toUpperCase();
  
  for (const pair of FOREX_PAIRS) {
    const patterns = [
      pair.replace('/', ''),      // EURUSD
      pair.replace('/', '/'),     // EUR/USD
      pair.replace('/', ' '),     // EUR USD
    ];
    
    for (const pattern of patterns) {
      if (upperText.includes(pattern)) {
        if (!pairs.includes(pair)) {
          pairs.push(pair);
        }
        break;
      }
    }
  }
  
  return pairs;
}

/**
 * Detect timeframes mentioned in text
 */
function detectTimeframes(text: string): string[] {
  const found: string[] = [];
  const upperText = text.toUpperCase();
  
  for (const tf of TIMEFRAMES) {
    if (upperText.includes(tf)) {
      found.push(tf);
    }
  }
  
  return found.length > 0 ? found : ['H4', 'D1'];
}

/**
 * Extract price levels from text
 */
function extractPriceLevels(text: string): { support: string[]; resistance: string[] } {
  const matches = text.match(PRICE_PATTERN) || [];
  const levels = Array.from(new Set(matches)).slice(0, 10);
  
  // Try to determine support/resistance based on context
  const support: string[] = [];
  const resistance: string[] = [];
  
  const sentences = text.split(/[.!?]+/);
  
  for (const level of levels) {
    for (const sentence of sentences) {
      if (sentence.includes(level)) {
        const lower = sentence.toLowerCase();
        if (lower.includes('support') || lower.includes('floor') || lower.includes('buy')) {
          if (!support.includes(level)) support.push(level);
        } else if (lower.includes('resistance') || lower.includes('ceiling') || lower.includes('sell') || lower.includes('top')) {
          if (!resistance.includes(level)) resistance.push(level);
        }
      }
    }
  }
  
  // If we couldn't categorize, split evenly
  if (support.length === 0 && resistance.length === 0 && levels.length > 0) {
    const mid = Math.ceil(levels.length / 2);
    return {
      support: levels.slice(0, mid),
      resistance: levels.slice(mid)
    };
  }
  
  return { support, resistance };
}

/**
 * Determine sentiment from text
 */
function determineSentiment(text: string): 'bullish' | 'bearish' | 'neutral' {
  const lower = text.toLowerCase();
  
  const bullishTerms = ['bullish', 'long', 'buy', 'uptrend', 'rally', 'breakout up', 'support', 'higher', 'rise', 'moon'];
  const bearishTerms = ['bearish', 'short', 'sell', 'downtrend', 'crash', 'breakdown', 'resistance', 'lower', 'fall', 'drop'];
  
  let bullishScore = 0;
  let bearishScore = 0;
  
  for (const term of bullishTerms) {
    if (lower.includes(term)) bullishScore++;
  }
  
  for (const term of bearishTerms) {
    if (lower.includes(term)) bearishScore++;
  }
  
  if (bullishScore > bearishScore * 1.5) return 'bullish';
  if (bearishScore > bullishScore * 1.5) return 'bearish';
  return 'neutral';
}

/**
 * Extract trade setups from text
 */
function extractTradeSetups(text: string, pairs: string[]): TradeSetup[] {
  const setups: TradeSetup[] = [];
  const sentences = text.split(/[.!?]+/);
  
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    
    // Look for setup indicators
    const hasSetup = lower.includes('entry') || lower.includes('stop') || lower.includes('target') || 
                     lower.includes('setup') || lower.includes('trade') || lower.includes('position');
    
    if (hasSetup) {
      // Find which pair this setup is for
      const setupPairs = pairs.filter(p => 
        sentence.toUpperCase().includes(p.replace('/', '')) ||
        sentence.toUpperCase().includes(p)
      );
      
      if (setupPairs.length > 0) {
        const pair = setupPairs[0];
        const direction: 'long' | 'short' | 'neutral' = 
          lower.includes('short') || lower.includes('sell') ? 'short' :
          lower.includes('long') || lower.includes('buy') ? 'long' : 'neutral';
        
        // Try to extract levels
        const numbers = sentence.match(/\d{1,5}\.\d{2,5}/g) || [];
        
        setups.push({
          pair,
          direction,
          entry: numbers[0],
          stop: numbers[1],
          target: numbers[2],
          notes: sentence.trim().slice(0, 200)
        });
      }
    }
  }
  
  return setups.slice(0, 5); // Limit to 5 setups
}

/**
 * Generate key takeaways from analysis
 */
function generateKeyTakeaways(text: string, pairs: string[], sentiment: string): string[] {
  const takeaways: string[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.length > 30);
  
  // Add sentiment-based takeaway
  if (sentiment === 'bullish') {
    takeaways.push(`Overall bullish bias detected for ${pairs.slice(0, 2).join(', ')}`);
  } else if (sentiment === 'bearish') {
    takeaways.push(`Overall bearish bias detected for ${pairs.slice(0, 2).join(', ')}`);
  } else {
    takeaways.push(`Neutral sentiment - waiting for clearer directional confirmation`);
  }
  
  // Extract key technical points
  const technicalTerms = ['support', 'resistance', 'trendline', 'breakout', 'consolidation', 'pattern'];
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    for (const term of technicalTerms) {
      if (lower.includes(term) && sentence.length < 150) {
        const clean = sentence.trim();
        if (!takeaways.some(t => t.includes(clean.substring(0, 50)))) {
          takeaways.push(clean);
          break;
        }
      }
    }
    if (takeaways.length >= 5) break;
  }
  
  return takeaways.slice(0, 5);
}

/**
 * Generate bullet point summary
 */
function generateSummary(title: string, pairs: string[], sentiment: string, keyTakeaways: string[]): string {
  const pairStr = pairs.slice(0, 3).join(', ');
  return `FX Evolution analyzes ${pairStr} with a ${sentiment} outlook. ${keyTakeaways[0] || ''}`;
}

/**
 * Generate key points for display
 */
function generateKeyPoints(pairs: string[], sentiment: string, takeaways: string[]): string[] {
  const points = [
    `Analysis covers ${pairs.slice(0, 3).join(', ')}`,
    `Market sentiment: ${sentiment.toUpperCase()}`,
    ...takeaways.slice(0, 3)
  ];
  return points.slice(0, 5);
}

/**
 * Parse ISO 8601 duration to seconds
 */
export function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Main analysis function
 */
export async function analyzeMarketVideo(video: VideoData): Promise<Partial<YouTubeAnalysis>> {
  console.log(`[AI Analysis] Analyzing video: ${video.title}`);
  
  // Combine all text sources for analysis
  const combinedText = `${video.title} ${video.description} ${video.transcript || ''}`;
  
  // Extract components
  const pairs = detectForexPairs(combinedText);
  const timeframes = detectTimeframes(combinedText);
  const keyLevels = extractPriceLevels(combinedText);
  const sentiment = determineSentiment(combinedText);
  const setups = extractTradeSetups(combinedText, pairs);
  const takeaways = generateKeyTakeaways(combinedText, pairs, sentiment);
  
  // Generate outputs
  const summary = generateSummary(video.title, pairs, sentiment, takeaways);
  const keyPoints = generateKeyPoints(pairs, sentiment, takeaways);
  
  const tradingInsights: TradingInsights = {
    sentiment,
    pairs_analyzed: pairs.length > 0 ? pairs : ['EUR/USD'],
    timeframes: timeframes.length > 0 ? timeframes : ['H4', 'D1'],
    key_levels: keyLevels,
    setups,
    key_takeaways: takeaways
  };
  
  return {
    video_id: video.id,
    channel_id: FX_EVOLUTION_CHANNEL_ID,
    channel_name: 'FX Evolution',
    title: video.title,
    description: video.description,
    thumbnail_url: video.thumbnailUrl,
    video_url: video.videoUrl,
    published_at: video.publishedAt,
    transcript: video.transcript,
    summary,
    key_points: keyPoints,
    trading_insights: tradingInsights,
    sentiment,
    assets: pairs.length > 0 ? pairs : ['EUR/USD'],
    duration_seconds: parseDuration(video.duration),
    view_count: video.viewCount,
    like_count: video.likeCount,
    analyzed_at: new Date().toISOString(),
    added_to_knowledge: false
  };
}

/**
 * Check if a video is market-related (to filter out non-trading content)
 */
export function isMarketRelated(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase();
  const marketTerms = ['forex', 'trading', 'analysis', 'technical', 'price', 'chart', 'setup', 'trade', 
                       'eur/usd', 'gbp/usd', 'usd/jpy', 'support', 'resistance', 'pips', 'bullish', 'bearish'];
  
  return marketTerms.some(term => text.includes(term));
}
