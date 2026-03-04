'use client';

import { useState } from 'react';
import { useActivityLog } from '@/hooks/useActivityLog';

const AGENTS = [
  { name: 'TraderBot', task: 'Analyze AAPL options' },
  { name: 'ProductBuilder', task: 'Deploy dashboard update' },
  { name: 'DistributionAgent', task: 'Draft tweet thread' },
  { name: 'MemoryManager', task: 'Consolidate daily notes' },
  { name: 'iOSAppBuilder', task: 'Build TestFlight release' },
  { name: 'SecurityAgent', task: 'Scan for vulnerabilities' },
];

/**
 * Test component for injecting mock activity data
 * Use this to verify the Activity Feed is working
 */
export function ActivityTestInjector() {
  const { logStart, logComplete, isLoading, error } = useActivityLog();
  const [results, setResults] = useState<Array<{ agent: string; runId: string | null; status: string }>>([]);

  const injectTestData = async () => {
    const newResults = [];
    
    for (const agent of AGENTS) {
      const runId = await logStart(agent.name, agent.task);
      newResults.push({ 
        agent: agent.name, 
        runId, 
        status: runId ? '✅ Logged' : '❌ Failed' 
      });
      
      // Small delay to spread out timestamps
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setResults(newResults);
  };

  const injectCompletedTask = async () => {
    const agent = AGENTS[Math.floor(Math.random() * AGENTS.length)];
    const runId = await logStart(agent.name, `${agent.task} (completed)`);
    
    if (runId) {
      await new Promise(resolve => setTimeout(resolve, 500));
      await logComplete(runId, 'Task completed successfully');
    }
    
    setResults(prev => [...prev, { 
      agent: agent.name, 
      runId, 
      status: runId ? '✅ Completed' : '❌ Failed' 
    }]);
  };

  const clearResults = () => setResults([]);

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
      <h3 className="text-lg font-semibold mb-3">Activity Feed Test Injector</h3>
      <p className="text-sm text-zinc-400 mb-4">
        Use these buttons to inject test data into the Activity Feed.
        Refresh the Activity page to see the results.
      </p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={injectTestData}
          disabled={isLoading}
          className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Injecting...' : 'Inject 6 Test Tasks'}
        </button>
        
        <button
          onClick={injectCompletedTask}
          disabled={isLoading}
          className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors disabled:opacity-50"
        >
          Inject Completed Task
        </button>
        
        <button
          onClick={clearResults}
          className="px-4 py-2 bg-zinc-500/20 hover:bg-zinc-500/30 text-zinc-400 rounded-lg transition-colors"
        >
          Clear Results
        </button>
      </div>

      {error && (
        <div className="text-red-400 text-sm mb-4">
          Error: {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-zinc-300">Results:</h4>
          {results.map((result, i) => (
            <div key={i} className="text-sm font-mono bg-black/20 rounded p-2">
              <span className={result.runId ? 'text-green-400' : 'text-red-400'}>
                {result.status}
              </span>
              {' '}<span className="text-zinc-400">{result.agent}</span>
              {result.runId && (
                <span className="text-zinc-600 ml-2">({result.runId.slice(0, 8)}...)</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ActivityTestInjector;
