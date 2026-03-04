'use client';

import { useState, useCallback } from 'react';

interface UseActivityLogReturn {
  logStart: (agent: string, task: string) => Promise<string | null>;
  logComplete: (runId: string, output?: string, details?: Record<string, unknown>) => Promise<boolean>;
  logFail: (runId: string, error: string, details?: Record<string, unknown>) => Promise<boolean>;
  logProgress: (runId: string, message: string, progress?: number, details?: Record<string, unknown>) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

/**
 * React hook for logging agent activity
 * Usage:
 *   const { logStart, logComplete } = useActivityLog();
 *   const runId = await logStart('TraderBot', 'Analyze AAPL');
 *   // ... do work ...
 *   await logComplete(runId, 'Analysis complete');
 */
export function useActivityLog(): UseActivityLogReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logStart = useCallback(async (agent: string, task: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/activity/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent, task, action: 'start' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to log activity');
      }

      return data.runId;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      console.error('[useActivityLog] Start error:', msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logComplete = useCallback(async (
    runId: string, 
    output?: string, 
    details?: Record<string, unknown>
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/activity/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          agent: 'unknown', // Not needed for complete
          task: output || 'Task completed', 
          action: 'complete',
          runId,
          output,
          details 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to log completion');
      }

      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      console.error('[useActivityLog] Complete error:', msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logFail = useCallback(async (
    runId: string, 
    errorMsg: string, 
    details?: Record<string, unknown>
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/activity/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          agent: 'unknown',
          task: errorMsg, 
          action: 'fail',
          runId,
          output: errorMsg,
          details 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to log failure');
      }

      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      console.error('[useActivityLog] Fail error:', msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logProgress = useCallback(async (
    runId: string, 
    message: string, 
    progress?: number,
    details?: Record<string, unknown>
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/activity/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          agent: 'unknown',
          task: message, 
          action: 'progress',
          runId,
          details: { progress, ...details }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to log progress');
      }

      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[useActivityLog] Progress error:', msg);
      return false;
    }
  }, []);

  return {
    logStart,
    logComplete,
    logFail,
    logProgress,
    isLoading,
    error,
  };
}

export default useActivityLog;
