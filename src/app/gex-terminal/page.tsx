"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart
} from "recharts";
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Zap,
  Clock,
  Target
} from "lucide-react";

interface GEXLevel {
  timestamp: string;
  symbol: string;
  net_gex: number; // in billions
  zero_gamma: number;
  flip_point: number;
  status: "positive" | "negative" | "neutral";
  alerts: string[];
}

interface GEXAlert {
  id: string;
  timestamp: string;
  symbol: string;
  level: "L1" | "L2" | "L3";
  message: string;
  threshold_breached: string;
}

// Mock data generator for demo
const generateMockData = (symbol: string): GEXLevel[] => {
  const data: GEXLevel[] = [];
  const basePrice = symbol === "SPY" ? 580 : 490;
  
  for (let i = 0; i < 24; i++) {
    const hour = 9 + Math.floor(i / 2);
    const minute = (i % 2) * 30;
    const time = `${hour}:${minute.toString().padStart(2, "0")}`;
    
    // Generate realistic GEX oscillation
    const netGex = (Math.sin(i * 0.5) * 0.5 + Math.random() * 0.3 - 0.15);
    const zeroGamma = basePrice + (Math.random() - 0.5) * 5;
    const flipPoint = zeroGamma + (netGex > 0 ? 2 : -2);
    
    data.push({
      timestamp: time,
      symbol,
      net_gex: parseFloat(netGex.toFixed(2)),
      zero_gamma: parseFloat(zeroGamma.toFixed(2)),
      flip_point: parseFloat(flipPoint.toFixed(2)),
      status: netGex > 0.2 ? "positive" : netGex < -0.2 ? "negative" : "neutral",
      alerts: netGex > 0.5 ? ["L2: High positive GEX"] : netGex < -0.5 ? ["L2: High negative GEX"] : []
    });
  }
  
  return data;
};

const mockAlerts: GEXAlert[] = [
  {
    id: "1",
    timestamp: "15:45",
    symbol: "SPY",
    level: "L2",
    message: "Gamma exposure flipped positive → negative",
    threshold_breached: "Zero Gamma Line"
  },
  {
    id: "2",
    timestamp: "14:30",
    symbol: "QQQ",
    level: "L3",
    message: "Mega squeeze potential detected",
    threshold_breached: "$500M+ negative GEX"
  },
  {
    id: "3",
    timestamp: "11:15",
    symbol: "SPY",
    level: "L1",
    message: "Elevated positive GEX",
    threshold_breached: "$200M+ positive GEX"
  }
];

export default function GEXTerminal() {
  const [selectedSymbol, setSelectedSymbol] = useState<"SPY" | "QQQ">("SPY");
  const [gexData, setGexData] = useState<GEXLevel[]>([]);
  const [currentGEX, setCurrentGEX] = useState<GEXLevel | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const data = generateMockData(selectedSymbol);
    setGexData(data);
    setCurrentGEX(data[data.length - 1]);
  }, [selectedSymbol]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "positive": return "bg-green-500";
      case "negative": return "bg-red-500";
      default: return "bg-yellow-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "positive": return "Positive Gamma (Dealer Short)";
      case "negative": return "Negative Gamma (Dealer Long)";
      default: return "Neutral Gamma";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Zap className="text-yellow-400" />
              GEX Terminal
            </h1>
            <p className="text-slate-400 mt-1">
              Real-time Gamma Exposure Monitor — Zero DTE
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge 
              variant={isLive ? "default" : "secondary"}
              className={`${isLive ? "bg-green-500" : "bg-yellow-500"} text-black font-bold px-4 py-2`}
            >
              {isLive ? "● LIVE" : "○ MOCK DATA"}
            </Badge>
            <Tabs value={selectedSymbol} onValueChange={(v) => setSelectedSymbol(v as "SPY" | "QQQ")}>
              <TabsList className="bg-slate-800">
                <TabsTrigger value="SPY" className="data-[state=active]:bg-blue-600">
                  SPY
                </TabsTrigger>
                <TabsTrigger value="QQQ" className="data-[state=active]:bg-purple-600">
                  QQQ
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Current GEX Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Net GEX</p>
                <p className={`text-3xl font-bold ${currentGEX?.net_gex && currentGEX.net_gex > 0 ? "text-green-400" : "text-red-400"}`}>
                  {currentGEX ? `${currentGEX.net_gex > 0 ? "+" : ""}${currentGEX.net_gex.toFixed(2)}B` : "--"}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${currentGEX ? getStatusColor(currentGEX.status) : "bg-gray-500"}`}>
                <Activity className="text-white" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Zero Gamma</p>
                <p className="text-3xl font-bold text-white">
                  {currentGEX ? `$${currentGEX.zero_gamma.toFixed(2)}` : "--"}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                <Target className="text-white" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Flip Point</p>
                <p className="text-3xl font-bold text-yellow-400">
                  {currentGEX ? `$${currentGEX.flip_point.toFixed(2)}` : "--"}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center">
                <TrendingUp className="text-white" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Status</p>
                <p className="text-lg font-bold text-white">
                  {currentGEX ? getStatusText(currentGEX.status) : "--"}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${currentGEX ? getStatusColor(currentGEX.status) : "bg-gray-500"}`}>
                {currentGEX?.status === "positive" ? (
                  <TrendingUp className="text-white" size={24} />
                ) : currentGEX?.status === "negative" ? (
                  <TrendingDown className="text-white" size={24} />
                ) : (
                  <Activity className="text-white" size={24} />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart */}
      <Card className="bg-slate-900 border-slate-700 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="text-blue-400" />
            Intraday GEX Levels — {selectedSymbol}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={gexData}>
              <defs>
                <linearGradient id="gexGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={selectedSymbol === "SPY" ? "#3b82f6" : "#a855f7"} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={selectedSymbol === "SPY" ? "#3b82f6" : "#a855f7"} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="timestamp" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px" }}
                itemStyle={{ color: "#fff" }}
              />
              <ReferenceLine y={0} stroke="#fff" strokeDasharray="3 3" />
              <Area 
                type="monotone" 
                dataKey="net_gex" 
                stroke={selectedSymbol === "SPY" ? "#3b82f6" : "#a855f7"}
                fillOpacity={1}
                fill="url(#gexGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Alerts & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="text-yellow-400" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockAlerts.map((alert) => (
                <div 
                  key={alert.id}
                  className="p-3 bg-slate-800 rounded-lg border-l-4 border-yellow-500"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={alert.level === "L3" ? "destructive" : alert.level === "L2" ? "default" : "secondary"}
                      >
                        {alert.level}
                      </Badge>
                      <span className="font-bold">{alert.symbol}</span>
                    </div>
                    <span className="text-slate-400 text-sm flex items-center gap-1">
                      <Clock size={14} />
                      {alert.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300">{alert.message}</p>
                  <p className="text-xs text-slate-500 mt-1">{alert.threshold_breached}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* What is GEX */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle>Gamma Exposure Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-slate-300">
              <div>
                <p className="font-semibold text-white mb-1">📊 Net GEX</p>
                <p>Total gamma exposure across all options. Positive = dealers short gamma (sell rallies, buy dips). Negative = dealers long gamma (buy rallies, sell dips).</p>
              </div>
              <div>
                <p className="font-semibold text-white mb-1">🎯 Zero Gamma</p>
                <p>Strike where gamma exposure equals zero. Often acts as a magnet for price action.</p>
              </div>
              <div>
                <p className="font-semibold text-white mb-1">⚡ Flip Point</p>
                <p>Price level where GEX changes sign. Major resistance/support — expect volatility around this level.</p>
              </div>
              <div className="pt-2 border-t border-slate-700">
                <p className="text-xs text-slate-500">
                  Scans every 15 minutes during market hours (9:30 AM - 4:00 PM EST)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}