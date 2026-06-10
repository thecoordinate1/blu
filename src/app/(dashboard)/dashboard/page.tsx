'use client';

import React, { useState, useEffect } from 'react';
import { MetricCard } from '@/components/shared/metric-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { ShieldAlert, MessageSquare, Zap, Activity, Clock, Database, ChevronRight, Globe, Lock } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const [activityData, setActivityData] = useState<number[]>([]);

  useEffect(() => {
    // Generate random heights only on the client after hydration to avoid mismatch
    setActivityData(Array.from({ length: 48 }, () => Math.random() * 80 + 20));
  }, []);

  const stats = [
    { label: 'Conversations Today', value: '142', trend: { value: '↑ 12%', positive: true }, color: '#4F6EF7' },
    { label: 'Resolution Rate', value: '94.2%', trend: { value: '↑ 2.4%', positive: true }, color: '#22D3A0' },
    { label: 'Escalations', value: '3', trend: { value: '↓ 5%', positive: true }, color: '#FF4D6D' },
    { label: 'Avg. Response Time', value: '1.2s', trend: { value: '↓ 0.4s', positive: true }, color: '#A78BFA' },
  ];

  const recentConversations = [
    { id: '1', phone: '+260 7XX XXX 234', lastMsg: 'I need help with my package tracking...', status: 'active', time: '2m ago' },
    { id: '2', phone: '+260 7XX XXX 958', lastMsg: 'This is the third time I ask!!', status: 'escalated', time: '14m ago' },
    { id: '3', phone: '+260 7XX XXX 144', lastMsg: 'Thank you for your help!', status: 'closed', time: '1h ago' },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-headline font-bold text-white tracking-tight text-white">System Overview</h1>
        <p className="text-[#64748B] text-sm">Real-time control center for your autonomous WhatsApp agents.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <MetricCard key={i} {...stat} />
        ))}
      </div>

      {/* Main Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Conversation Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-lg font-bold text-white">Live Conversation Feed</h2>
            <Link href="/conversations" className="text-[11px] font-bold text-[#4F6EF7] hover:underline flex items-center gap-1">
              VIEW ALL <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="glass-card divide-y divide-[#1E2340]">
            {recentConversations.map((chat) => (
              <Link 
                key={chat.id} 
                href={`/conversations/${chat.id}`}
                className={cn(
                  "flex items-center justify-between p-4 hover:bg-[#1A1F3A] transition-all group",
                  chat.status === 'escalated' && "bg-[#FF4D6D]/5"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-mono text-xs font-bold",
                    chat.status === 'escalated' ? "bg-[#FF4D6D]/20 text-[#FF4D6D]" : "bg-[#4F6EF7]/20 text-[#4F6EF7]"
                  )}>
                    {chat.status === 'escalated' ? <ShieldAlert className="w-4 h-4" /> : chat.phone.slice(-3)}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-sm font-bold text-white group-hover:text-[#4F6EF7] transition-colors">{chat.phone}</span>
                    <p className="text-xs text-[#64748B] line-clamp-1 max-w-md">{chat.lastMsg}</p>
                    {chat.status === 'escalated' && (
                      <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-md">
                        <p className="text-white/80 text-xs">Agent transitioned state from <span className="text-accent">REASONING</span> to <span className="text-accent">DB_WRITE</span>.</p>
                        <p className="text-muted-foreground text-[10px]">Action: UPDATE_SHIPPING_ADDRESS | Entities: {"{ \"zip\": \"90210\" }"}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-[10px] font-mono text-[#3A4060] uppercase">{chat.time}</span>
                  <StatusBadge status={chat.status as any} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Agent Status Panel */}
        <div className="space-y-4">
          <h2 className="font-headline text-lg font-bold text-white">Agent Status</h2>
          <div className="glass-card p-6 space-y-6">
            <div className="flex flex-col items-center justify-center py-4 space-y-3">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-[#22D3A022] flex items-center justify-center">
                  <Zap className="w-8 h-8 text-[#22D3A0] fill-[#22D3A0]" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#0E1020] rounded-full flex items-center justify-center border border-[#1E2340]">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#22D3A0] animate-pulse" />
                </div>
              </div>
              <div className="text-center">
                <span className="font-headline text-xl font-bold text-white uppercase tracking-wider text-white">Active</span>
                <p className="text-[10px] font-mono text-[#64748B] uppercase tracking-widest mt-1">Ready for incoming traffic</p>
              </div>
            </div>

            <div className="space-y-3 border-t border-[#1E2340] pt-6">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#64748B] flex items-center gap-2"><Database className="w-3.5 h-3.5" /> Queue Depth</span>
                <span className="font-mono text-white">0 jobs</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#64748B] flex items-center gap-2"><Activity className="w-3.5 h-3.5" /> Gemini API Latency</span>
                <span className="font-mono text-[#22D3A0]">420ms</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#64748B] flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> WA Webhook Status</span>
                <span className="font-mono text-[#22D3A0]">Connected</span>
              </div>
            </div>

            <button className="w-full py-3 bg-[#F5A62322] border border-[#F5A62344] text-[#F5A623] rounded-lg text-xs font-headline font-bold hover:bg-[#F5A62333] transition-all">
              PAUSE AGENT
            </button>
          </div>
        </div>
      </div>

      {/* Activity Chart Section - Placeholder */}
      <div className="space-y-4">
        <h2 className="font-headline text-lg font-bold text-white">Daily Activity</h2>
        <div className="glass-card p-6 h-64 flex flex-col items-center justify-center text-center">
          <Activity className="w-8 h-8 text-[#1E2340] mb-2" />
          <p className="text-[#3A4060] text-sm font-headline uppercase tracking-widest">Activity Graph Visualization</p>
          <div className="w-full h-full mt-4 flex items-end gap-1 px-4">
            {activityData.map((height, i) => (
              <div 
                key={i} 
                className="flex-1 bg-[#4F6EF7]/20 rounded-t-sm hover:bg-[#4F6EF7]/50 transition-colors"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}