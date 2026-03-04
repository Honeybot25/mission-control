"use client";

import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
const approvals = [
  { id: "1", type: "Trade", title: "AAPL Call Options", status: "pending", requestedBy: "TraderBot", requestedAt: "5 min ago" },
  { id: "2", type: "Content", title: "X Post about trading", status: "pending", requestedBy: "ContentAgent", requestedAt: "12 min ago" },
  { id: "3", type: "Deploy", title: "Mission Control Update", status: "approved", requestedBy: "AppDevAgent", requestedAt: "1 hour ago" },
];

export default function ApprovalsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="lg:ml-64 p-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Approvals</h1>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100">
              {approvals.map((item) => (
                <div key={item.id} className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-500">{item.type} • {item.requestedBy} • {item.requestedAt}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${item.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
