"use client";

import * as React from "react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function AnalyticsDashboard() {
  const [data, setData] = React.useState<any | null>(null);

  React.useEffect(() => {
    fetch('/api/analytics/overview')
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) return <div>Loading analytics...</div>;

  const { aiCost, runtimePerf, latency, memoryEffectiveness, conversationQuality, engagement, escalations, modelUsage, budget, personalization } = data;

  const palette = ['#06b6d4', '#7c3aed', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>AI Cost (30d)</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={aiCost}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="ts" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#7c3aed" fillOpacity={1} fill="url(#colorCost)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Runtime Performance</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={runtimePerf}>
                <XAxis dataKey="ts" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Latency (ms)</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latency}>
                <XAxis dataKey="ts" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Memory Effectiveness</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={memoryEffectiveness}>
                <XAxis dataKey="ts" />
                <YAxis />
                <Tooltip />
                <Line dataKey="value" stroke="#10b981" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversation Quality</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={conversationQuality}>
                <XAxis dataKey="ts" />
                <YAxis />
                <Tooltip />
                <Line dataKey="value" stroke="#f59e0b" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Customer Engagement</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={engagement}>
                <XAxis dataKey="ts" />
                <YAxis />
                <Tooltip />
                <Line dataKey="value" stroke="#7c3aed" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Escalation Frequency</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={escalations}>
                <XAxis dataKey="ts" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Model Usage</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={modelUsage} dataKey="value" nameKey="name" outerRadius={60} fill="#8884d8">
                  {modelUsage.map((entry: any, idx: number) => (
                    <Cell key={`cell-${idx}`} fill={palette[idx % palette.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Budget Consumption</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={budget}>
                <XAxis dataKey="ts" />
                <YAxis />
                <Tooltip />
                <Area dataKey="value" stroke="#06b6d4" fill="#06b6d4" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Personalization Improvement</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={personalization}>
                <XAxis dataKey="ts" />
                <YAxis />
                <Tooltip />
                <Line dataKey="value" stroke="#10b981" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
