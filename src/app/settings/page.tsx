"use client";

import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="lg:ml-64 p-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Settings</h1>
        <div className="space-y-4 max-w-2xl">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Agent Activity</p>
                  <p className="text-sm text-slate-500">Get notified when agents complete tasks</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Approvals</p>
                  <p className="text-sm text-slate-500">Notifications for pending approvals</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>System</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Version</p>
                  <p className="text-sm text-slate-500">v2.0.0</p>
                </div>
                <Button variant="outline" size="sm">Check Updates</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
