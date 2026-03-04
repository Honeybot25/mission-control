'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Rewind,
  FastForward,
  StepBack,
  StepForward,
  Volume2,
  VolumeX,
  Settings,
  Share2,
  Download,
  Clock,
} from 'lucide-react';

export type ReplaySpeed = 0.5 | 1 | 2 | 5 | 10;

interface ReplayPlayerProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentSpeed: ReplaySpeed;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onSpeedChange: (speed: ReplaySpeed) => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onSkipToStart: () => void;
  onSkipToEnd: () => void;
  eventCount: number;
  currentEventIndex: number;
  onExport?: () => void;
  onShare?: () => void;
}

const SPEEDS: ReplaySpeed[] = [0.5, 1, 2, 5, 10];

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function ReplayPlayer({
  isPlaying,
  currentTime,
  duration,
  currentSpeed,
  onPlay,
  onPause,
  onSeek,
  onSpeedChange,
  onStepBack,
  onStepForward,
  onSkipToStart,
  onSkipToEnd,
  eventCount,
  currentEventIndex,
  onExport,
  onShare,
}: ReplayPlayerProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || duration === 0) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * duration;
    
    onSeek(newTime);
  }, [duration, onSeek]);
  
  const handleProgressHover = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || duration === 0) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const hoverMs = percentage * duration;
    
    setHoverTime(hoverMs);
  }, [duration]);
  
  return (
    <div className="bg-[#0f0f15] border border-white/10 rounded-2xl p-4 space-y-4">
      {/* Progress Bar */}
      <div className="relative group">
        <div
          ref={progressRef}
          className="h-3 bg-white/5 rounded-full cursor-pointer overflow-hidden"
          onClick={handleProgressClick}
          onMouseMove={handleProgressHover}
          onMouseLeave={() => setHoverTime(null)}
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10" />
          
          {/* Progress */}
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"
            style={{ width: `${progress}%` }}
            layoutId="progress"
          />
          
          {/* Buffer indicator */}
          <div className="absolute inset-0 bg-white/5 rounded-full" />
        </div>
        
        {/* Hover tooltip */}
        {hoverTime !== null && (
          <div
            className="absolute -top-8 px-2 py-1 bg-white/10 backdrop-blur-sm rounded text-xs text-white pointer-events-none transform -translate-x-1/2"
            style={{ left: `${(hoverTime / duration) * 100}%` }}
          >
            {formatTime(hoverTime)}
          </div>
        )}
        
        {/* Time indicators */}
        <div className="flex justify-between mt-2 text-xs text-zinc-500">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      
      {/* Controls Row */}
      <div className="flex items-center justify-between">
        {/* Left: Playback controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSkipToStart}
            className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors"
            title="Skip to start"
          >
            <SkipBack size={18} />
          </button>
          
          <button
            onClick={onStepBack}
            className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors"
            title="Previous event"
          >
            <StepBack size={18} />
          </button>
          
          <motion.button
            onClick={isPlaying ? onPause : onPlay}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-12 h-12 flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-white shadow-lg shadow-indigo-500/25"
          >
            {isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
          </motion.button>
          
          <button
            onClick={onStepForward}
            className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors"
            title="Next event"
          >
            <StepForward size={18} />
          </button>
          
          <button
            onClick={onSkipToEnd}
            className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors"
            title="Skip to end"
          >
            <SkipForward size={18} />
          </button>
        </div>
        
        {/* Center: Speed controls */}
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
          {SPEEDS.map((speed) => (
            <button
              key={speed}
              onClick={() => onSpeedChange(speed)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                currentSpeed === speed
                  ? 'bg-white/20 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
        
        {/* Right: Event counter & actions */}
        <div className="flex items-center gap-4">
          {/* Event counter */}
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Clock size={14} />
            <span>
              <span className="text-white font-medium">{currentEventIndex + 1}</span>
              {' / '}
              {eventCount}
            </span>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={onShare}
              className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors"
              title="Share moment"
            >
              <Share2 size={18} />
            </button>
            
            <button
              onClick={onExport}
              className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors"
              title="Export replay"
            >
              <Download size={18} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Keyboard shortcuts hint */}
      <div className="flex items-center justify-center gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-zinc-400">Space</kbd>
          Play/Pause
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-zinc-400">←</kbd>
          <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-zinc-400">→</kbd>
          Step
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-zinc-400">1-5</kbd>
          Speed
        </span>
      </div>
    </div>
  );
}
