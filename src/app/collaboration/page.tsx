'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Network, Users, Activity } from 'lucide-react';

export default function CollaborationPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Network className="w-8 h-8 text-indigo-400" />
          Agent Collaboration Graph
        </h1>
        <p className="text-zinc-400 mb-8">Visualizing interactions and dependencies between agents</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-zinc-900/50 border-zinc-800 h-96">
            <CardHeader>
              <CardTitle className="text-lg">Interaction Network</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center text-zinc-500">
                <Network className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Interactive D3 graph coming in next update</p>
                <p className="text-sm mt-2">Currently tracking 6 agents with 12 interactions</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Top Collaborators
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>TraderBot ↔ ProductBuilder</span>
                  <span className="text-indigo-400">24 interactions</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Honey ↔ TraderBot</span>
                  <span className="text-indigo-400">18 interactions</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>ProductBuilder ↔ iOSAppBuilder</span>
                  <span className="text-indigo-400">12 interactions</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Activity Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Total Interactions</span>
                  <span>54</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">@Mentions</span>
                  <span>23</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Task Handoffs</span>
                  <span>8</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
