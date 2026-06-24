'use client';

import React, { useState, useEffect } from 'react';
import { MetricCard } from '@/components/shared/metric-card';
import {
  MessageSquare,
  Bot,
  Users,
  Clock,
  ArrowUpRight,
  Package,
  ChevronRight,
  Sparkles,
  Plus,
  Minus,
  Trash2,
  Edit,
  Save,
  PlusCircle,
  Search,
  X,
  AlertTriangle,
  CreditCard,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

interface DashboardKPIs {
  totalConversations: number;
  messagesHandled: number;
  escalations: number;
  paymentsTotal: number;
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [kpis, setKpis] = useState<DashboardKPIs>({
    totalConversations: 0,
    messagesHandled: 0,
    escalations: 0,
    paymentsTotal: 0,
  });
  const [agentStats, setAgentStats] = useState({
    totalMessages: 0,
    agentMessages: 0,
    systemMessages: 0,
    conversations: 0,
  });
  const [paymentsByDay, setPaymentsByDay] = useState<{ day: string; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState<string | null>(null);

  // Inventory (localStorage-based)
  const [inventory, setInventory] = useState<any[]>([]);
  const [invSearch, setInvSearch] = useState('');
  const [invCategory, setInvCategory] = useState('All');
  
  // Modal/Form states
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // New/Edit form state
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formCategory, setFormCategory] = useState('Solar Kits');

  // Fetch real data from Supabase
  useEffect(() => {
    async function loadDashboardData() {
      try {
        // Get business
        const { data: biz } = await supabase
          .from('businesses')
          .select('id, name')
          .limit(1)
          .maybeSingle();

        if (!biz) {
          setLoading(false);
          return;
        }

        setBusinessName(biz.name);
        const bizId = biz.id;

        // Parallel queries for KPIs
        const [convosRes, agentMsgsRes, escalationsRes, paymentsRes, totalMsgsRes, systemMsgsRes] = await Promise.all([
          supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('business_id', bizId),
          supabase.from('messages').select('id', { count: 'exact', head: true }).eq('business_id', bizId).eq('role', 'agent'),
          supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('business_id', bizId).eq('status', 'escalated'),
          supabase.from('payments').select('amount').eq('business_id', bizId).eq('status', 'successful'),
          supabase.from('messages').select('id', { count: 'exact', head: true }).eq('business_id', bizId),
          supabase.from('messages').select('id', { count: 'exact', head: true }).eq('business_id', bizId).eq('role', 'system'),
        ]);

        const paymentsTotal = (paymentsRes.data || []).reduce((sum, p) => sum + Number(p.amount), 0);

        setKpis({
          totalConversations: convosRes.count || 0,
          messagesHandled: agentMsgsRes.count || 0,
          escalations: escalationsRes.count || 0,
          paymentsTotal,
        });

        setAgentStats({
          totalMessages: totalMsgsRes.count || 0,
          agentMessages: agentMsgsRes.count || 0,
          systemMessages: systemMsgsRes.count || 0,
          conversations: convosRes.count || 0,
        });

        // Payment data by day (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const { data: recentPayments } = await supabase
          .from('payments')
          .select('amount, created_at')
          .eq('business_id', bizId)
          .eq('status', 'successful')
          .gte('created_at', sevenDaysAgo.toISOString());

        if (recentPayments && recentPayments.length > 0) {
          const dayMap: Record<string, number> = {};
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          recentPayments.forEach(p => {
            const d = new Date(p.created_at);
            const key = dayNames[d.getDay()];
            dayMap[key] = (dayMap[key] || 0) + Number(p.amount);
          });
          setPaymentsByDay(Object.entries(dayMap).map(([day, revenue]) => ({ day, revenue })));
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  // Load inventory from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('blu_inventory');
    if (saved) {
      setInventory(JSON.parse(saved));
    } else {
      const defaultInventory = [
        { id: '1', name: 'Solar Kit Pro', sku: 'SLR-PRO-01', price: 4500, stock: 18, category: 'Solar Kits' },
        { id: '2', name: 'Smart Bulb 9W', sku: 'BLB-SMT-09', price: 120, stock: 145, category: 'Lighting' },
        { id: '3', name: 'Solar Battery 100Ah', sku: 'BAT-100AH', price: 2800, stock: 4, category: 'Batteries' },
        { id: '4', name: 'USB Charging Cable', sku: 'CAB-USB-3IN1', price: 45, stock: 0, category: 'Accessories' },
      ];
      setInventory(defaultInventory);
      localStorage.setItem('blu_inventory', JSON.stringify(defaultInventory));
    }
  }, []);

  const saveInventory = (updated: any[]) => {
    setInventory(updated);
    localStorage.setItem('blu_inventory', JSON.stringify(updated));
  };

  const handleIncrementStock = (id: string) => {
    const updated = inventory.map(item => item.id === id ? { ...item, stock: item.stock + 1 } : item);
    saveInventory(updated);
  };

  const handleDecrementStock = (id: string) => {
    const updated = inventory.map(item => item.id === id ? { ...item, stock: Math.max(0, item.stock - 1) } : item);
    saveInventory(updated);
  };

  const handleDeleteItem = (id: string) => {
    const updated = inventory.filter(item => item.id !== id);
    saveInventory(updated);
  };

  const handleAddOrUpdateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formSku || !formPrice || !formStock) return;

    if (editingItem) {
      // Update
      const updated = inventory.map(item => 
        item.id === editingItem.id 
          ? { 
              ...item, 
              name: formName, 
              sku: formSku, 
              price: parseFloat(formPrice), 
              stock: parseInt(formStock), 
              category: formCategory 
            } 
          : item
      );
      saveInventory(updated);
      setEditingItem(null);
    } else {
      // Create
      const newItem = {
        id: `inv-${Date.now()}`,
        name: formName,
        sku: formSku,
        price: parseFloat(formPrice),
        stock: parseInt(formStock),
        category: formCategory
      };
      saveInventory([...inventory, newItem]);
    }

    // Reset form & close
    setIsAdding(false);
    setFormName('');
    setFormSku('');
    setFormPrice('');
    setFormStock('');
    setFormCategory('Solar Kits');
  };

  const startEdit = (item: any) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormSku(item.sku);
    setFormPrice(item.price.toString());
    setFormStock(item.stock.toString());
    setFormCategory(item.category);
    setIsAdding(true);
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditingItem(null);
    setFormName('');
    setFormSku('');
    setFormPrice('');
    setFormStock('');
    setFormCategory('Solar Kits');
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(invSearch.toLowerCase()) || item.sku.toLowerCase().includes(invSearch.toLowerCase());
    const matchesCategory = invCategory === 'All' || item.category === invCategory;
    return matchesSearch && matchesCategory;
  });

  const today = new Date().toLocaleDateString('en-ZM', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const agentPct = agentStats.totalMessages > 0
    ? Math.round((agentStats.agentMessages / agentStats.totalMessages) * 100)
    : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="liquid-glass p-3 !rounded-xl text-xs" style={{ minWidth: 140 }}>
        <p className="font-headline text-white font-bold mb-1.5">{label}</p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex justify-between gap-4 text-[11px]">
            <span className="text-[#8893a7]">Revenue</span>
            <span className="font-mono text-white">ZMW {(entry.value as number).toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-headline font-bold text-white tracking-tight">
            {getGreeting()} 👋
          </h1>
          <p className="text-[#64748B] text-sm">{today} — here&apos;s how your business is doing.</p>
        </div>
        <Link
          href="/analytics"
          className="flex items-center gap-1.5 text-[11px] font-headline font-bold text-[#4F6EF7] hover:text-[#6B8AFF] transition-colors"
        >
          VIEW FULL ANALYTICS <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          label="Total Conversations"
          value={loading ? '—' : kpis.totalConversations.toLocaleString()}
          subtitle="all time"
          icon={MessageSquare}
          color="#4F6EF7"
          accent="blue"
        />
        <MetricCard
          label="Messages Handled"
          value={loading ? '—' : kpis.messagesHandled.toLocaleString()}
          subtitle="by AI agent"
          icon={Bot}
          color="#22D3A0"
          accent="green"
        />
        <MetricCard
          label="Escalations"
          value={loading ? '—' : kpis.escalations.toLocaleString()}
          subtitle="needs attention"
          icon={AlertTriangle}
          color="#F5A623"
          accent="amber"
        />
        <MetricCard
          label="Payments Received"
          value={loading ? '—' : `ZMW ${kpis.paymentsTotal.toLocaleString()}`}
          subtitle="successful"
          icon={CreditCard}
          color="#A78BFA"
          accent="purple"
        />
      </div>

      {/* Revenue Chart + Agent Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 liquid-glass-panel p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-headline text-base font-bold text-white">Payment Revenue</h2>
              <p className="text-[11px] text-[#64748B] mt-0.5">Last 7 days — successful payments</p>
            </div>
          </div>
          <div className="h-72 w-full">
            {mounted && paymentsByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={paymentsByDay} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4F6EF7" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#4F6EF7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
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
                    tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4F6EF7"
                    strokeWidth={2.5}
                    fill="url(#revenueGrad)"
                    name="revenue"
                    dot={false}
                    activeDot={{ r: 5, fill: '#4F6EF7', stroke: '#0E1020', strokeWidth: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-2">
                  <CreditCard className="w-8 h-8 text-[#3A4060] mx-auto" />
                  <p className="text-xs text-[#64748B] font-mono">No payment data yet</p>
                  <p className="text-[10px] text-[#3A4060]">Revenue will appear here once payments are processed</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Agent Performance Summary */}
        <div className="liquid-glass-panel p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#4F6EF7]/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-[#4F6EF7]" />
            </div>
            <div>
              <h2 className="font-headline text-base font-bold text-white">Agent Impact</h2>
              <p className="text-[10px] text-[#64748B] mt-0.5">Overall performance</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Conversations', value: agentStats.conversations.toLocaleString(), sub: 'total threads', icon: MessageSquare, color: '#4F6EF7' },
              { label: 'Agent replies', value: agentStats.agentMessages.toLocaleString(), sub: 'automated responses', icon: Sparkles, color: '#22D3A0' },
              { label: 'Total messages', value: agentStats.totalMessages.toLocaleString(), sub: 'across all conversations', icon: Users, color: '#F5A623' },
              { label: 'System events', value: agentStats.systemMessages.toLocaleString(), sub: 'escalations & status changes', icon: Clock, color: '#A78BFA' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${item.color}14` }}
                >
                  <item.icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#8893a7]">{item.label}</span>
                    <span className="font-mono text-sm font-bold text-white">{item.value}</span>
                  </div>
                  <span className="text-[10px] text-[#4a5068] font-mono">{item.sub}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-white/5">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#4F6EF7]/5">
              <Sparkles className="w-4 h-4 text-[#4F6EF7] flex-shrink-0" />
              <p className="text-[11px] text-[#8893a7] leading-relaxed">
                {agentStats.totalMessages > 0 ? (
                  <>Your agent handled <span className="text-white font-bold">{agentPct}%</span> of all messages</>
                ) : (
                  <>Send your first WhatsApp message to see agent stats</>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Management Panel */}
      <div className="liquid-glass-panel p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#4F6EF7]/10 flex items-center justify-center">
              <Package className="w-4 h-4 text-[#4F6EF7]" />
            </div>
            <div>
              <h2 className="font-headline text-base font-bold text-white">Inventory Management</h2>
              <p className="text-[10px] text-[#64748B] mt-0.5">Manage your stock, prices, and products</p>
            </div>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#4F6EF7] text-white rounded-lg text-xs font-headline font-bold hover:bg-[#4F6EF7]/80 transition-all shadow-[0_0_15px_-5px_#4F6EF7]"
          >
            <PlusCircle className="w-4 h-4" /> ADD NEW ITEM
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 bg-[#07080F]/50 border border-[#1E2340] p-2 rounded-xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#3A4060]" />
            <input 
              type="text"
              placeholder="Search inventory by name or SKU..." 
              value={invSearch}
              onChange={(e) => setInvSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-1.5 bg-transparent border-none focus:outline-none text-xs text-white placeholder:text-[#3A4060]" 
            />
          </div>
          <div className="flex gap-1 h-8 bg-[#0E1020] p-1 rounded-lg border border-[#1E2340]">
            {['All', 'Solar Kits', 'Lighting', 'Batteries', 'Accessories'].map((cat) => (
              <button 
                key={cat}
                onClick={() => setInvCategory(cat)}
                className={cn(
                  "px-3 text-[10px] font-headline font-bold rounded-md transition-all",
                  invCategory === cat ? "bg-[#1A1F3A] text-white" : "text-[#64748B] hover:text-[#E2E8F0]"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* CRUD Table */}
        <div className="overflow-x-auto w-full border border-[#1E2340]/60 rounded-xl bg-[#0E1020]/20">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="border-b border-[#1E2340] bg-[#131629]/50 text-[10px] font-mono text-[#64748B] uppercase tracking-widest">
                <th className="p-4">Item Name</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Category</th>
                <th className="p-4 text-right">Price</th>
                <th className="p-4 text-center">Stock Level</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2340]/40 text-xs">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground font-mono">
                    No inventory items found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const isOutOfStock = item.stock === 0;
                  const isLowStock = item.stock > 0 && item.stock <= 10;
                  return (
                    <tr key={item.id} className="hover:bg-[#1A1F3A]/30 transition-colors">
                      <td className="p-4 font-bold text-white">{item.name}</td>
                      <td className="p-4 font-mono text-[#8893a7]">{item.sku}</td>
                      <td className="p-4 text-[#8893a7]">{item.category}</td>
                      <td className="p-4 font-mono text-white text-right">ZMW {item.price.toLocaleString()}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleDecrementStock(item.id)}
                            className="p-1 bg-[#131629] border border-[#1E2340] rounded hover:bg-[#1A1F3A] text-[#64748B] hover:text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center font-mono font-bold text-white">{item.stock}</span>
                          <button 
                            onClick={() => handleIncrementStock(item.id)}
                            className="p-1 bg-[#131629] border border-[#1E2340] rounded hover:bg-[#1A1F3A] text-[#64748B] hover:text-white"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[9px] font-bold uppercase border",
                          isOutOfStock ? "bg-red-500/10 text-red-400 border-red-500/20" : 
                          isLowStock ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : 
                          "bg-green-500/10 text-green-400 border-green-500/20"
                        )}>
                          {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => startEdit(item)}
                            className="p-1.5 bg-[#131629] border border-[#1E2340] rounded hover:bg-[#4F6EF7]/20 hover:border-[#4F6EF7] text-[#64748B] hover:text-[#4F6EF7] transition-all"
                            title="Edit Item"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 bg-[#131629] border border-[#1E2340] rounded hover:bg-red-500/20 hover:border-red-500 text-[#64748B] hover:text-red-400 transition-all"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Inline Overlay Form */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0E1020] border border-[#1E2340] rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-bold text-lg text-white">
                {editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
              </h3>
              <button 
                onClick={cancelForm}
                className="text-[#64748B] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddOrUpdateItem} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">Item Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Solar Kit Pro"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-[#07080F]/50 border border-[#1E2340] rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-[#4F6EF7]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">SKU</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. SLR-PRO-01"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full bg-[#07080F]/50 border border-[#1E2340] rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-[#4F6EF7]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">Category</label>
                  <select 
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-[#07080F]/50 border border-[#1E2340] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4F6EF7]"
                  >
                    <option value="Solar Kits" className="bg-[#0E1020]">Solar Kits</option>
                    <option value="Lighting" className="bg-[#0E1020]">Lighting</option>
                    <option value="Batteries" className="bg-[#0E1020]">Batteries</option>
                    <option value="Accessories" className="bg-[#0E1020]">Accessories</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">Price (ZMW)</label>
                  <input 
                    type="number" 
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="4500"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full bg-[#07080F]/50 border border-[#1E2340] rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-[#4F6EF7]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">Initial Stock</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    placeholder="10"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full bg-[#07080F]/50 border border-[#1E2340] rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-[#4F6EF7]"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={cancelForm}
                  className="flex-1 py-2.5 border border-[#1E2340] hover:bg-[#131629] text-white rounded-lg text-xs font-headline font-bold uppercase transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-[#4F6EF7] hover:bg-[#4F6EF7]/80 text-white rounded-lg text-xs font-headline font-bold uppercase transition-all shadow-[0_0_15px_-5px_#4F6EF7]"
                >
                  {editingItem ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}