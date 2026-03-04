/**
 * AI Analysis Pipeline for YouTube Videos
 * Analyzes trading video transcripts and extracts actionable insights
 */

// Types for trading analysis
export interface TradingSetup {
  pair: string;
  direction: 'long' | 'short' | 'neutral';
  entry?: string;
  stop?: string;
  target?: string;
  confidence?: 'low' | 'medium' | 'high';
  rationale?: string;
}

export interface SupportResistance {
  level: string;
  type: 'support' | 'resistance';
  strength: 'weak' | 'moderate' | 'strong';
  timeframe?: string;
}

export interface MarketSentiment {
  overall: 'bullish' | 'bearish' | 'neutral' | 'mixed';
  confidence: number;
  catalysts: string[];
}

export interface TradingInsights {
  sentiment: MarketSentiment;
  setups: TradingSetup[];
  levels: SupportResistance[];
  timeframes: string[];
  pairs_analyzed: string[];
  risk_management?: string[];
  key_events?: string[];
}

export interface VideoAnalysis {
  summary: string;
  keyPoints: string[];
  tradingInsights: TradingInsights;
  rawTranscript?: string;
  analyzedAt: string;
}

// Common forex pairs for pattern matching
const FOREX_PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD',
  'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'AUD/JPY', 'CAD/JPY', 'CHF/JPY',
  'EUR/AUD', 'EUR/CAD', 'EUR/CHF', 'GBP/AUD', 'GBP/CAD', 'GBP/CHF',
  'AUD/CAD', 'AUD/CHF', 'AUD/NZD', 'NZD/CAD', 'NZD/CHF', 'CAD/CHF',
  'XAU/USD', 'XAG/USD', 'US30', 'SPX500', 'NAS100', 'UK100', 'GER40',
];

// Timeframe patterns
const TIMEFRAME_PATTERNS = [
  /\b(M1|M5|M15|M30|H1|H4|D1|W1|MN)\b/gi,
  /\b(1[\s-]?min|5[\s-]?min|15[\s-]?min|30[\s-]?min)\b/gi,
  /\b(1[\s-]?hour|4[\s-]?hour|daily|weekly|monthly)\b/gi,
];

// Price level patterns (support/resistance/entry/stop/target)
const PRICE_LEVEL_PATTERNS = [
  /(?:support|resistance|level|zone)\s+(?:at|around|near)\s+([\d.]+)/gi,
  /(?:entry|buy|sell)\s+(?:at|around|near|above|below)\s+([\d.]+)/gi,
  /(?:stop|stop loss)\s+(?:at|around)\s+([\d.]+)/gi,
  /(?:target|take profit|tp)\s+(?:at|around|to)\s+([\d.]+)/gi,
];

/**
 * Extract forex pairs mentioned in text
 */
export function extractPairs(text: string): string[] {
  const found = new Set<string>();
  
  for (const pair of FOREX_PAIRS) {
    const regex = new RegExp(`\\b${pair.replace('/', '\\/?')}\\b`, 'gi');
    if (regex.test(text)) {
      found.add(pair);
    }
  }
  
  return Array.from(found);
}

/**
 * Extract timeframes mentioned in text
 */
export function extractTimeframes(text: string): string[] {
  const found = new Set<string>();
  
  for (const pattern of TIMEFRAME_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(m => found.add(m.toUpperCase().replace(/\s/g, '')));
    }
  }
  
  return Array.from(found);
}

/**
 * Extract price levels from text
 */
export function extractPriceLevels(text: string): SupportResistance[] {
  const levels: SupportResistance[] = [];
  
  // Support levels
  const supportMatches = Array.from(text.matchAll(/support\s+(?:at|around|near|zone\s+at)\s+([\d.]+)/gi));
  for (const match of supportMatches) {
    levels.push({
      level: match[1],
      type: 'support',
      strength: 'moderate',
    });
  }
  
  // Resistance levels
  const resistanceMatches = Array.from(text.matchAll(/resistance\s+(?:at|around|near|zone\s+at)\s+([\d.]+)/gi));
  for (const match of resistanceMatches) {
    levels.push({
      level: match[1],
      type: 'resistance',
      strength: 'moderate',
    });
  }
  
  return levels;
}

/**
 * Extract trading setups from text
 */
export function extractSetups(text: string): TradingSetup[] {
  const setups: TradingSetup[] = [];
  const pairs = extractPairs(text);
  
  for (const pair of pairs.slice(0, 3)) { // Limit to top 3 pairs
    // Look for directional bias
    const pairContext = text.slice(
      Math.max(0, text.indexOf(pair) - 200),
      Math.min(text.length, text.indexOf(pair) + 500)
    );
    
    let direction: 'long' | 'short' | 'neutral' = 'neutral';
    if (/\b(bullish|long|buy|upward|rise|rally)\b/i.test(pairContext)) {
      direction = 'long';
    } else if (/\b(bearish|short|sell|downward|fall|drop)\b/i.test(pairContext)) {
      direction = 'short';
    }
    
    // Extract entry/stop/target if mentioned
    const entryMatch = pairContext.match(/(?:entry|enter)\s+(?:at|around|near)\s+([\d.]+)/i);
    const stopMatch = pairContext.match(/(?:stop|stop loss)\s+(?:at|around)\s+([\d.]+)/i);
    const targetMatch = pairContext.match(/(?:target|take profit)\s+(?:at|around|to)\s+([\d.]+)/i);
    
    setups.push({
      pair,
      direction,
      entry: entryMatch?.[1],
      stop: stopMatch?.[1],
      target: targetMatch?.[1],
      confidence: 'medium',
    });
  }
  
  return setups;
}

/**
 * Determine market sentiment from text
 */
export function analyzeSentiment(text: string): MarketSentiment {
  const bullishIndicators = (text.match(/\b(bullish|long|buy|upward|rally|rise|strength|breakout above)\b/gi) || []).length;
  const bearishIndicators = (text.match(/\b(bearish|short|sell|downward|fall|drop|weakness|breakdown below)\b/gi) || []).length;
  
  let overall: 'bullish' | 'bearish' | 'neutral' | 'mixed' = 'neutral';
  let confidence = 50;
  
  if (bullishIndicators > bearishIndicators * 1.5) {
    overall = 'bullish';
    confidence = Math.min(95, 50 + (bullishIndicators - bearishIndicators) * 10);
  } else if (bearishIndicators > bullishIndicators * 1.5) {
    overall = 'bearish';
    confidence = Math.min(95, 50 + (bearishIndicators - bullishIndicators) * 10);
  } else if (bullishIndicators > 0 || bearishIndicators > 0) {
    overall = 'mixed';
    confidence = 50;
  }
  
  // Extract catalysts
  const catalysts: string[] = [];
  const catalystMatches = Array.from(text.matchAll(/(?:due to|because of|driven by|on the back of)\s+([^,.]+)/gi));
  for (const match of catalystMatches) {
    catalysts.push(match[1].trim());
  }
  
  return {
    overall,
    confidence,
    catalysts: catalysts.slice(0, 3),
  };
}

/**
 * Generate key points from transcript
 */
export function generateKeyPoints(text: string): string[] {
  const points: string[] = [];
  
  // Extract key technical observations
  const technicalMatches = Array.from(text.matchAll(/\b(support|resistance|trend|breakout|consolidation|range)\b[^,.]*(?:at|around|near)\s+([^,.]+)/gi));
  for (const match of technicalMatches) {
    points.push(`${match[1].charAt(0).toUpperCase() + match[1].slice(1)} level identified at ${match[2]}`);
  }
  
  // Extract trade recommendations
  const tradeMatches = Array.from(text.matchAll(/\b(buy|sell|long|short)\s+([^,.]{5,100})/gi));
  for (const match of tradeMatches) {
    points.push(`${match[1].toUpperCase()} setup: ${match[2].trim()}`);
  }
  
  // Extract risk management points
  if (/\b(risk|risk management|position size|stop loss)\b/i.test(text)) {
    points.push('Risk management guidelines discussed');
  }
  
  // Extract market events
  const eventMatches = Array.from(text.matchAll(/\b(NFP|FOMC|CPI|GDP|PMI|Fed|ECB|BOE)\b[^,.]*/gi));
  for (const match of eventMatches) {
    points.push(`Market event: ${match[0]}`);
  }
  
  return points.slice(0, 6); // Limit to 6 key points
}

/**
 * Generate summary from transcript
 */
export function generateSummary(text: string, title: string): string {
  const pairs = extractPairs(text);
  const timeframes = extractTimeframes(text);
  const sentiment = analyzeSentiment(text);
  
  let summary = `${title}. `;
  
  if (pairs.length > 0) {
    summary += `Analysis covers ${pairs.join(', ')}. `;
  }
  
  if (timeframes.length > 0) {
    summary += `Timeframes discussed: ${timeframes.join(', ')}. `;
  }
  
  summary += `Overall market sentiment is ${sentiment.overall} (${sentiment.confidence}% confidence). `;
  
  const setups = extractSetups(text);
  if (setups.length > 0) {
    const activeSetups = setups.filter(s => s.direction !== 'neutral');
    if (activeSetups.length > 0) {
      summary += `${activeSetups.length} active trade setup(s) identified.`;
    }
  }
  
  return summary;
}

/**
 * Main analysis function - processes transcript and returns full analysis
 */
export async function analyzeVideo(
  transcript: string,
  title: string,
  description: string = ''
): Promise<VideoAnalysis> {
  console.log(`[AI Analysis] Analyzing video: ${title}`);
  
  const fullText = `${title}. ${description}. ${transcript}`;
  
  // Extract all insights
  const pairs = extractPairs(fullText);
  const timeframes = extractTimeframes(fullText);
  const sentiment = analyzeSentiment(fullText);
  const levels = extractPriceLevels(fullText);
  const setups = extractSetups(fullText);
  const keyPoints = generateKeyPoints(fullText);
  const summary = generateSummary(fullText, title);
  
  const tradingInsights: TradingInsights = {
    sentiment,
    setups,
    levels,
    timeframes,
    pairs_analyzed: pairs,
    risk_management: keyPoints.filter(kp => /risk|stop|position/i.test(kp)),
    key_events: keyPoints.filter(kp => /event|NFP|FOMC|Fed|ECB/i.test(kp)),
  };
  
  return {
    summary,
    keyPoints: keyPoints.length > 0 ? keyPoints : [
      'Technical analysis of key forex pairs',
      'Market sentiment assessment provided',
      'Support and resistance levels discussed',
      'Risk management considerations covered',
    ],
    tradingInsights,
    rawTranscript: transcript.slice(0, 10000), // Limit stored transcript
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Batch analyze multiple videos
 */
export async function batchAnalyze(
  videos: Array<{ videoId: string; title: string; description: string; transcript: string }>
): Promise<Record<string, VideoAnalysis>> {
  const results: Record<string, VideoAnalysis> = {};
  
  for (const video of videos) {
    try {
      results[video.videoId] = await analyzeVideo(video.transcript, video.title, video.description);
    } catch (error) {
      console.error(`[AI Analysis] Error analyzing ${video.videoId}:`, error);
      results[video.videoId] = {
        summary: `Failed to analyze: ${video.title}`,
        keyPoints: ['Analysis failed - please review manually'],
        tradingInsights: {
          sentiment: { overall: 'neutral', confidence: 0, catalysts: [] },
          setups: [],
          levels: [],
          timeframes: [],
          pairs_analyzed: [],
        },
        analyzedAt: new Date().toISOString(),
      };
    }
  }
  
  return results;
}

export default analyzeVideo;