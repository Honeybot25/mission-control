"use client";

import Sidebar from "@/components/Sidebar";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CheckCircle } from "lucide-react";

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="lg:ml-64 p-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Security</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                <CheckCircle size={24} />
              </div>
              <div>
                <CardTitle>System Secure</CardTitle>
                <p className="text-sm text-slate-500">Last scan: 2 hours ago</p>
              </div>
            </CardHeader>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                <Shield size={24} />
              </div>
              <div>
                <CardTitle>6 Agents</CardTitle>
                <p className="text-sm text-slate-500">All authenticated</p>
              </div>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
}
