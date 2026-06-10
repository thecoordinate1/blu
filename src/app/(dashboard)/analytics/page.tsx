'use client';

import React, { useState, useEffect } from 'react';
import { MetricCard } from '@/components/shared/metric-card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Cell
} from 'recharts';
import { Download, Calendar, Filter, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const conversationData = [
  { day: 'Mon', resolved: 45, escalated: 5 },
  { day: 'Tue', resolved: 52, escalated: 8 },
  { day: 'Wed', resolved: 38, escalated: 12 },
  { day: 'Thu', resolved: 65, escalated: 4 },
  { day: 'Fri', resolved: 48, escalated: 6 },
  { day: 'Sat', resolved: 30, escalated: 2 },
  { day: 'Sun', resolved: 25, escalated: 3 },
];

export default function AnalyticsPage() {
  const [hourlyIntensity, setHourlyIntensity] = useState<{ day: number; hour: number; value: number }[]>([]);

  useEffect(() => {
    // Generate random intensity data on client mount to avoid hydration mismatch
    setHourlyIntensity(
      Array.from({ length: 7 * 24 }, (_, i) => ({
        day: Math.floor(i / 24),
        hour: i % 24,
        value: Math.floor(Math.random() * 100),
      }))
    );
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-headline font-bold text-white tracking-tight text-white">Analytics</h1>
          <p className="text-muted-foreground text-sm">Deep dive into agent performance and customer trends.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#0E1020] border border-[#1E2340] rounded-lg text-xs font-mono text-white cursor-pointer hover:border-[#2E3560] transition-colors">
            <Calendar className="w-3.5 h-3.5 text-accent" />
            <span>LAST 30 DAYS</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#3A4060]" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-xs font-headline font-bold hover:bg-accent/80 transition-all shadow-[0_0_15px_-5px_#4F6EF7]">
            <Download className="w-3.5 h-3.5" /> EXPORT REPORT
          </button>
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard label="Total Convos" value="3,240" trend={{ value: '↑ 14%', positive: true }} color="var(--accent)" />
        <MetricCard label="AI Resolution" value="92.4%" trend={{ value: '↑ 2.1%', positive: true }} color="var(--green)" />
        <MetricCard label="Escalations" value="42" trend={{ value: '↓ 8%', positive: true }} color="var(--red)" />
        <MetricCard label="Avg. Response" value="1.4s" trend={{ value: '↓ 0.2s', positive: true }} color="var(--purple)" />
        <MetricCard label="Messages Sent" value="12.8k" trend={{ value: '↑ 22%', positive: true }} color="var(--accent)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Conversations Over Time */}
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-sm font-bold text-white uppercase tracking-wider">Conversations Over Time</h3>
            <div className="flex items-center gap-4 text-[10px] font-mono uppercase text-muted-foreground">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-accent" /> Resolved</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /> Escalated</div>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2340" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'JetBrains Mono' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'JetBrains Mono' }} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#131629', border: '1px solid #1E2340', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '10px', fontFamily: 'JetBrains Mono' }}
                />
                <Bar dataKey="resolved" stackId="a" fill="#4F6EF7" radius={[0, 0, 0, 0]} barSize={32} />
                <Bar dataKey="escalated" stackId="a" fill="#FF4D6D" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resolution vs Escalation Distribution */}
        <div className="glass-card p-6 space-y-6">
          <h3 className="font-headline text-sm font-bold text-white uppercase tracking-wider">Hourly Intensity Heatmap</h3>
          <div className="grid grid-cols-24 gap-1 h-64">
            {hourlyIntensity.map((cell, i) => (
              <div 
                key={i}
                className="rounded-sm transition-all hover:scale-110 cursor-pointer"
                style={{ 
                  backgroundColor: `rgba(79, 110, 247, ${cell.value / 100})`,
                  opacity: cell.value === 0 ? 0.05 : 1
                }}
                title={`Hour ${cell.hour}: ${cell.value} messages`}
              />
            ))}
          </div>
          <div className="flex justify-between items-center text-[9px] font-mono text-muted-foreground uppercase tracking-widest pt-2">
            <span>00:00</span>
            <span>12:00</span>
            <span>23:59</span>
          </div>
        </div>
      </div>

      {/* Top Escalation Reasons Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-[#1E2340] bg-[#131629]/50">
          <h3 className="font-headline text-sm font-bold text-white uppercase tracking-wider">Top Escalation Reasons</h3>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#1E2340] bg-[#0E1020]">
              <th className="p-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Reason</th>
              <th className="p-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest text-right">Count</th>
              <th className="p-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest text-right">% of Total</th>
              <th className="p-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest text-right">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E2340]">
            {[
              { reason: 'Low AI Confidence', count: 18, percent: '42%', trend: '↑ 2%' },
              { reason: 'Customer Requested Human', count: 12, percent: '28%', trend: '↓ 5%' },
              { reason: 'Keyword Trigger: "Refund"', count: 8, percent: '19%', trend: '↑ 12%' },
              { reason: 'Failed Resolution Loop (3+ turns)', count: 4, percent: '11%', trend: '0%' },
            ].map((row, i) => (
              <tr key={i} className="hover:bg-[#1A1F3A] transition-colors group">
                <td className="p-4 font-mono text-xs text-white group-hover:text-accent transition-colors">{row.reason}</td>
                <td className="p-4 font-mono text-xs text-white text-right">{row.count}</td>
                <td className="p-4 font-mono text-xs text-muted-foreground text-right">{row.percent}</td>
                <td className={cn(
                  "p-4 font-mono text-xs text-right",
                  row.trend.includes('↑') ? "text-red-400" : row.trend.includes('↓') ? "text-green-400" : "text-muted-foreground"
                )}>{row.trend}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}