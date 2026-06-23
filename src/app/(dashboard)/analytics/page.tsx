'use client';

import React, { useState, useEffect } from 'react';
import { MetricCard } from '@/components/shared/metric-card';
import { 
  ComposedChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Line
} from 'recharts';
import { Download, Calendar, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const revenueData = [
  { day: 'Mon', revenue: 22000, target: 20000 },
  { day: 'Tue', revenue: 28000, target: 20000 },
  { day: 'Wed', revenue: 19000, target: 20000 },
  { day: 'Thu', revenue: 35000, target: 22000 },
  { day: 'Fri', revenue: 25000, target: 22000 },
  { day: 'Sat', revenue: 42000, target: 25000 },
  { day: 'Sun', revenue: 16400, target: 15000 },
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
          <h1 className="text-3xl font-headline font-bold tracking-tight text-white">Business Analytics</h1>
          <p className="text-muted-foreground text-sm">Track your business performance and growth.</p>
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
        <MetricCard label="Total Revenue" value="ZMW 187,400" trend={{ value: '↑ 14%', positive: true }} color="var(--accent)" />
        <MetricCard label="Orders Completed" value="284" trend={{ value: '↑ 9%', positive: true }} color="var(--green)" />
        <MetricCard label="New Customers" value="67" trend={{ value: '↑ 22%', positive: true }} color="var(--accent)" />
        <MetricCard label="Avg. Order Value" value="ZMW 659" trend={{ value: '↑ 5%', positive: true }} color="var(--purple)" />
        <MetricCard label="Repeat Rate" value="62%" trend={{ value: '↑ 3%', positive: true }} color="var(--green)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Over Time */}
        <div className="liquid-glass-panel p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-sm font-bold text-white uppercase tracking-wider">Revenue Over Time</h3>
            <div className="flex items-center gap-4 text-[10px] font-mono uppercase text-muted-foreground">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-accent" /> Revenue (ZMW)</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-400" /> Target (ZMW)</div>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenueData}>
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
                <Bar dataKey="revenue" fill="#4F6EF7" radius={[4, 4, 0, 0]} barSize={32} />
                <Line type="monotone" dataKey="target" stroke="#A78BFA" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Activity Heatmap */}
        <div className="liquid-glass-panel p-6 space-y-6">
          <h3 className="font-headline text-sm font-bold text-white uppercase tracking-wider">Customer Activity Heatmap</h3>
          <div className="grid grid-cols-24 gap-1 h-64">
            {hourlyIntensity.map((cell, i) => (
              <div 
                key={i}
                className="rounded-sm transition-all hover:scale-110 cursor-pointer"
                style={{ 
                  backgroundColor: `rgba(79, 110, 247, ${cell.value / 100})`,
                  opacity: cell.value === 0 ? 0.05 : 1
                }}
                title={`Hour ${cell.hour}: ${cell.value} interactions`}
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

      {/* Top Revenue Sources Table */}
      <div className="liquid-glass-panel overflow-hidden">
        <div className="p-6 border-b border-[#1E2340] bg-[#131629]/50">
          <h3 className="font-headline text-sm font-bold text-white uppercase tracking-wider">Top Revenue Sources</h3>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#1E2340] bg-[#0E1020]">
              <th className="p-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Source</th>
              <th className="p-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest text-right">Revenue</th>
              <th className="p-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest text-right">Orders</th>
              <th className="p-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest text-right">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E2340]">
            {[
              { source: 'Solar Kit Subscriptions', revenue: 'ZMW 82,400', orders: 125, trend: '↑ 14%' },
              { source: 'Airtime Bundles', revenue: 'ZMW 48,900', orders: 84, trend: '↑ 8%' },
              { source: 'Delivery Fees', revenue: 'ZMW 32,100', orders: 56, trend: '↓ 3%' },
              { source: 'Mobile Money Cashout', revenue: 'ZMW 24,000', orders: 19, trend: '↑ 22%' },
            ].map((row, i) => (
              <tr key={i} className="hover:bg-[#1A1F3A] transition-colors group">
                <td className="p-4 font-mono text-xs text-white group-hover:text-accent transition-colors">{row.source}</td>
                <td className="p-4 font-mono text-xs text-white text-right">{row.revenue}</td>
                <td className="p-4 font-mono text-xs text-muted-foreground text-right">{row.orders}</td>
                <td className={cn(
                  "p-4 font-mono text-xs text-right",
                  row.trend.includes('↑') ? "text-green-400" : row.trend.includes('↓') ? "text-red-400" : "text-muted-foreground"
                )}>{row.trend}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}