'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MetricCard } from '@/components/shared/metric-card';
import { 
  ComposedChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
} from 'recharts';
import { Download, Calendar, ChevronDown, MessageSquare, CreditCard, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';

interface AnalyticsKPIs {
  totalConversations: number;
  totalMessages: number;
  agentMessages: number;
  escalations: number;
  paymentsTotal: number;
}

type DateRange = 'all' | 'today' | '7d' | '30d';

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  all: 'ALL TIME',
  today: 'TODAY',
  '7d': 'LAST 7 DAYS',
  '30d': 'LAST 30 DAYS',
};

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const [kpis, setKpis] = useState<AnalyticsKPIs>({
    totalConversations: 0,
    totalMessages: 0,
    agentMessages: 0,
    escalations: 0,
    paymentsTotal: 0,
  });
  const [messageHeatmap, setMessageHeatmap] = useState<{ day: number; hour: number; value: number }[]>([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState<{ source: string; revenue: string; orders: number; trend: string }[]>([]);
  const [revenueByDay, setRevenueByDay] = useState<{ day: string; revenue: number; messages: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const { data: biz } = await supabase
        .from('businesses')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (!biz) {
        setLoading(false);
        return;
      }

      const bizId = biz.id;

      // Calculate cutoff date
      let cutoffIso: string | null = null;
      const now = new Date();
      if (dateRange === 'today') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        cutoffIso = startOfDay.toISOString();
      } else if (dateRange === '7d') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        cutoffIso = d.toISOString();
      } else if (dateRange === '30d') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        cutoffIso = d.toISOString();
      }

      // Build queries with date filters
      let convosQuery = supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('business_id', bizId);
      let totalMsgsQuery = supabase.from('messages').select('id', { count: 'exact', head: true }).eq('business_id', bizId);
      let agentMsgsQuery = supabase.from('messages').select('id', { count: 'exact', head: true }).eq('business_id', bizId).eq('role', 'agent');
      let escalationsQuery = supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('business_id', bizId).eq('status', 'escalated');
      let paymentsQuery = supabase.from('payments').select('amount, payment_method, created_at').eq('business_id', bizId).eq('status', 'successful');

      if (cutoffIso) {
        convosQuery = convosQuery.gte('created_at', cutoffIso);
        totalMsgsQuery = totalMsgsQuery.gte('created_at', cutoffIso);
        agentMsgsQuery = agentMsgsQuery.gte('created_at', cutoffIso);
        escalationsQuery = escalationsQuery.gte('created_at', cutoffIso);
        paymentsQuery = paymentsQuery.gte('created_at', cutoffIso);
      }

      const [convosRes, totalMsgsRes, agentMsgsRes, escalationsRes, paymentsRes] = await Promise.all([
        convosQuery,
        totalMsgsQuery,
        agentMsgsQuery,
        escalationsQuery,
        paymentsQuery,
      ]);

      const payments = paymentsRes.data || [];
      const paymentsTotal = payments.reduce((sum, p) => sum + Number(p.amount), 0);

      setKpis({
        totalConversations: convosRes.count || 0,
        totalMessages: totalMsgsRes.count || 0,
        agentMessages: agentMsgsRes.count || 0,
        escalations: escalationsRes.count || 0,
        paymentsTotal,
      });

      // Build message heatmap
      let heatmapQuery = supabase
        .from('messages')
        .select('created_at')
        .eq('business_id', bizId)
        .order('created_at', { ascending: false })
        .limit(500);

      if (cutoffIso) {
        heatmapQuery = heatmapQuery.gte('created_at', cutoffIso);
      }

      const { data: allMessages } = await heatmapQuery;

      if (allMessages && allMessages.length > 0) {
        const heatGrid: Record<string, number> = {};
        for (let d = 0; d < 7; d++) {
          for (let h = 0; h < 24; h++) {
            heatGrid[`${d}-${h}`] = 0;
          }
        }
        allMessages.forEach(m => {
          const date = new Date(m.created_at);
          const day = date.getDay();
          const hour = date.getHours();
          heatGrid[`${day}-${hour}`] = (heatGrid[`${day}-${hour}`] || 0) + 1;
        });
        const maxVal = Math.max(...Object.values(heatGrid), 1);
        setMessageHeatmap(
          Object.entries(heatGrid).map(([key, val]) => {
            const [d, h] = key.split('-').map(Number);
            return { day: d, hour: h, value: Math.round((val / maxVal) * 100) };
          })
        );
      } else {
        setMessageHeatmap(
          Array.from({ length: 7 * 24 }, (_, i) => ({
            day: Math.floor(i / 24),
            hour: i % 24,
            value: 0,
          }))
        );
      }

      // Payment method breakdown
      if (payments.length > 0) {
        const methodMap: Record<string, { total: number; count: number }> = {};
        payments.forEach(p => {
          const method = p.payment_method || 'unknown';
          if (!methodMap[method]) methodMap[method] = { total: 0, count: 0 };
          methodMap[method].total += Number(p.amount);
          methodMap[method].count += 1;
        });
        const methodLabels: Record<string, string> = {
          mtn: 'MTN Mobile Money',
          airtel: 'Airtel Money',
          zamtel: 'Zamtel Kwacha',
          card: 'Card Payments',
          unknown: 'Other',
        };
        setPaymentBreakdown(
          Object.entries(methodMap)
            .sort((a, b) => b[1].total - a[1].total)
            .map(([method, data]) => ({
              source: methodLabels[method] || method,
              revenue: `K ${data.total.toLocaleString()}`,
              orders: data.count,
              trend: 'Active',
            }))
        );

        // Revenue by day of week
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayMap: Record<string, number> = {};
        payments.forEach(p => {
          const d = new Date(p.created_at);
          const key = dayNames[d.getDay()];
          dayMap[key] = (dayMap[key] || 0) + Number(p.amount);
        });
        setRevenueByDay(dayNames.map(day => ({ day, revenue: dayMap[day] || 0, messages: 0 })));
      } else {
        setPaymentBreakdown([]);
        setRevenueByDay([]);
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // CSV Report Generator
  const handleExportReport = () => {
    setExporting(true);
    try {
      const csvLines = [
        'Blu_bot Business Analytics Report',
        `Date Range,${DATE_RANGE_LABELS[dateRange]}`,
        `Export Date,${new Date().toISOString()}`,
        '',
        'METRIC,VALUE',
        `Total Conversations,${kpis.totalConversations}`,
        `Total Messages Processed,${kpis.totalMessages}`,
        `Agent Responses,${kpis.agentMessages}`,
        `Escalations,${kpis.escalations}`,
        `Total Revenue (K),${kpis.paymentsTotal}`,
        '',
        'PAYMENT METHOD BREAKDOWN',
        'Method,Revenue,Transactions',
        ...paymentBreakdown.map(p => `"${p.source}","${p.revenue}",${p.orders}`),
        '',
        'REVENUE BY DAY OF WEEK',
        'Day,Revenue (K)',
        ...revenueByDay.map(r => `"${r.day}",${r.revenue}`),
      ];

      const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvLines.join('\n'));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', csvContent);
      downloadAnchor.setAttribute('download', `blu_bot_analytics_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);

      setExported(true);
      setTimeout(() => setExported(false), 2500);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-headline font-bold tracking-tight text-white">Business Analytics</h1>
          <p className="text-muted-foreground text-sm">Track your business performance and growth.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Date Range Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#0E1020] border border-[#1E2340] rounded-lg text-xs font-mono text-white hover:border-[#4F6EF7]/60 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-[#4F6EF7]" />
              <span>{DATE_RANGE_LABELS[dateRange]}</span>
              <ChevronDown className="w-3 h-3 text-[#64748B]" />
            </button>

            {showDateDropdown && (
              <div className="absolute right-0 mt-2 w-44 bg-[#0E1020] border border-[#1E2340] rounded-xl shadow-2xl z-50 py-1 font-mono text-xs">
                {(['all', 'today', '7d', '30d'] as DateRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      setDateRange(range);
                      setShowDateDropdown(false);
                    }}
                    className={cn(
                      'w-full text-left px-4 py-2 hover:bg-[#1E2340]/60 transition-colors flex items-center justify-between',
                      dateRange === range ? 'text-[#4F6EF7] font-bold' : 'text-[#94A3B8]'
                    )}
                  >
                    {DATE_RANGE_LABELS[range]}
                    {dateRange === range && <Check className="w-3.5 h-3.5 text-[#4F6EF7]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export CSV Report Button */}
          <button
            onClick={handleExportReport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-[#4F6EF7] hover:bg-[#3D5FE6] text-white rounded-lg text-xs font-headline font-bold transition-all shadow-[0_0_15px_-5px_#4F6EF7]"
          >
            {exported ? (
              <><Check className="w-3.5 h-3.5 text-[#22D3A0]" /> REPORT DOWNLOADED</>
            ) : (
              <><Download className="w-3.5 h-3.5" /> EXPORT REPORT</>
            )}
          </button>
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard label="Total Conversations" value={loading ? '—' : kpis.totalConversations.toLocaleString()} color="var(--accent)" />
        <MetricCard label="Messages Processed" value={loading ? '—' : kpis.totalMessages.toLocaleString()} color="var(--green)" />
        <MetricCard label="Agent Responses" value={loading ? '—' : kpis.agentMessages.toLocaleString()} color="var(--accent)" />
        <MetricCard label="Escalations" value={loading ? '—' : kpis.escalations.toLocaleString()} color="var(--purple)" />
        <MetricCard label="Revenue" value={loading ? '—' : `K ${kpis.paymentsTotal.toLocaleString()}`} color="var(--green)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Over Time */}
        <div className="liquid-glass-panel p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-sm font-bold text-white uppercase tracking-wider">Payment Revenue by Day</h3>
            <div className="flex items-center gap-4 text-[10px] font-mono uppercase text-muted-foreground">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#4F6EF7]" /> Revenue (K)</div>
            </div>
          </div>
          <div className="h-72 w-full">
            {revenueByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={revenueByDay}>
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
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-2">
                  <CreditCard className="w-8 h-8 text-[#3A4060] mx-auto" />
                  <p className="text-xs text-[#64748B] font-mono">No payment data for this date range</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Customer Activity Heatmap */}
        <div className="liquid-glass-panel p-6 space-y-6">
          <h3 className="font-headline text-sm font-bold text-white uppercase tracking-wider">Message Activity Heatmap</h3>
          {messageHeatmap.length > 0 && messageHeatmap.some(c => c.value > 0) ? (
            <>
              <div className="grid grid-cols-24 gap-1 h-64">
                {messageHeatmap.map((cell, i) => (
                  <div 
                    key={i}
                    className="rounded-sm transition-all hover:scale-110 cursor-pointer"
                    style={{ 
                      backgroundColor: `rgba(79, 110, 247, ${cell.value / 100})`,
                      opacity: cell.value === 0 ? 0.05 : 1
                    }}
                    title={`Day ${cell.day}, Hour ${cell.hour}: ${cell.value}% activity`}
                  />
                ))}
              </div>
              <div className="flex justify-between items-center text-[9px] font-mono text-muted-foreground uppercase tracking-widest pt-2">
                <span>00:00</span>
                <span>12:00</span>
                <span>23:59</span>
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center space-y-2">
                <MessageSquare className="w-8 h-8 text-[#3A4060] mx-auto" />
                <p className="text-xs text-[#64748B] font-mono">No message activity for this date range</p>
                <p className="text-[10px] text-[#3A4060]">The heatmap will populate as messages are exchanged</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Method Breakdown Table */}
      <div className="liquid-glass-panel overflow-hidden">
        <div className="p-6 border-b border-[#1E2340] bg-[#131629]/50">
          <h3 className="font-headline text-sm font-bold text-white uppercase tracking-wider">Payment Method Breakdown</h3>
        </div>
        {paymentBreakdown.length > 0 ? (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#1E2340] bg-[#0E1020]">
                <th className="p-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Method</th>
                <th className="p-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest text-right">Revenue</th>
                <th className="p-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest text-right">Transactions</th>
                <th className="p-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2340]">
              {paymentBreakdown.map((row, i) => (
                <tr key={i} className="hover:bg-[#1A1F3A] transition-colors group">
                  <td className="p-4 font-mono text-xs text-white group-hover:text-[#4F6EF7] transition-colors">{row.source}</td>
                  <td className="p-4 font-mono text-xs text-white text-right">{row.revenue}</td>
                  <td className="p-4 font-mono text-xs text-muted-foreground text-right">{row.orders}</td>
                  <td className="p-4 font-mono text-xs text-muted-foreground text-right">{row.trend}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center">
            <CreditCard className="w-8 h-8 text-[#3A4060] mx-auto mb-3" />
            <p className="text-xs text-[#64748B] font-mono">No payment data for this date range</p>
            <p className="text-[10px] text-[#3A4060] mt-1">Payment breakdowns will appear once transactions are processed</p>
          </div>
        )}
      </div>
    </div>
  );
}