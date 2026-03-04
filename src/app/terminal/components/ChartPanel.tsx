'use client';

import React, { useEffect, useRef } from 'react';
import { useTerminalStore } from '../store';

export const ChartPanel: React.FC = () => {
  const { chartData, activeSymbol, selectedTimeframe, updateChartData } = useTerminalStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const data = chartData[activeSymbol] || [];

  // Update chart data when symbol changes
  useEffect(() => {
    if (!chartData[activeSymbol]) {
      updateChartData(activeSymbol);
    }
  }, [activeSymbol, chartData, updateChartData]);

  // Draw chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 50, bottom: 30, left: 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Calculate min/max
    const prices = data.flatMap(d => [d.high, d.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    // Draw grid
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 0.5;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Price labels
      const price = maxPrice - (priceRange / 5) * i;
      ctx.fillStyle = '#666';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(price.toFixed(2), width - padding.right + 5, y + 3);
    }

    // Draw candlesticks
    const candleWidth = (chartWidth / data.length) * 0.7;
    const spacing = chartWidth / data.length;

    data.forEach((candle, index) => {
      const x = padding.left + index * spacing + spacing / 2;
      const isGreen = candle.close >= candle.open;
      
      const highY = padding.top + ((maxPrice - candle.high) / priceRange) * chartHeight;
      const lowY = padding.top + ((maxPrice - candle.low) / priceRange) * chartHeight;
      const openY = padding.top + ((maxPrice - candle.open) / priceRange) * chartHeight;
      const closeY = padding.top + ((maxPrice - candle.close) / priceRange) * chartHeight;

      // Wick
      ctx.strokeStyle = isGreen ? '#00FF00' : '#FF3333';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Body
      ctx.fillStyle = isGreen ? '#00FF00' : '#FF3333';
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.abs(closeY - openY) || 1;
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    });

    // Draw timeframe selector
    const timeframes = ['1D', '1W', '1M', '3M', '1Y'];
    const tfWidth = 40;
    const tfStartX = padding.left;
    
    timeframes.forEach((tf, index) => {
      const x = tfStartX + index * (tfWidth + 5);
      const isActive = tf === selectedTimeframe;
      
      ctx.fillStyle = isActive ? '#FF9900' : '#333';
      ctx.fillRect(x, height - 25, tfWidth, 20);
      
      ctx.fillStyle = isActive ? '#000' : '#888';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(tf, x + tfWidth / 2, height - 11);
    });

  }, [data, selectedTimeframe]);

  return (
    <div className="h-full flex flex-col">
      <canvas 
        ref={canvasRef}
        className="w-full h-full"
        style={{ imageRendering: 'crisp-edges' }}
      />
    </div>
  );
};
