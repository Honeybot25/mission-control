"use client";

import Sidebar from "@/components/Sidebar";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

const skills = [
  { name: "Trading", agents: ["TraderBot"], description: "Backtesting, signals, live trading" },
  { name: "Development", agents: ["AppDevAgent"], description: "iOS, web apps, deployments" },
  { name: "Content", agents: ["ContentAgent"], description: "Social media, newsletters" },
  { name: "Security", agents: ["SecurityAgent"], description: "Audits, monitoring, hardening" },
  { name: "Research", agents: ["ResearchAgent"], description: "Market analysis, deep dives" },
];

export default function SkillsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="lg:ml-64 p-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Skills</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skills.map((skill) => (
            <Card key={skill.name} className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>{skill.name}</CardTitle>
                <p className="text-sm text-slate-500">{skill.description}</p>
                <p className="text-xs text-slate-400">Agents: {skill.agents.join(", ")}</p>
              </CardHeader>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
