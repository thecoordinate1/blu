'use client';

import React, { useState, useEffect } from 'react';
import { MetricCard } from '@/components/shared/metric-card';
import {
  DollarSign,
  ShoppingBag,
  Star,
  TrendingUp,
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
  X
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

const revenueData = [
  { day: 'Mon', revenue: 18200, previous: 15400 },
  { day: 'Tue', revenue: 22100, previous: 19800 },
  { day: 'Wed', revenue: 19500, previous: 21200 },
  { day: 'Thu', revenue: 28400, previous: 23600 },
  { day: 'Fri', revenue: 31200, previous: 25100 },
  { day: 'Sat', revenue: 26800, previous: 22900 },
  { day: 'Sun', revenue: 24850, previous: 20300 },
];

const topProducts = [
  { name: 'Premium Package', revenue: 12400, orders: 31, pct: 100 },
  { name: 'Standard Plan', revenue: 8600, orders: 43, pct: 69 },
  { name: 'Consultation Hour', revenue: 5200, orders: 26, pct: 42 },
  { name: 'Add-on Service', revenue: 3800, orders: 19, pct: 31 },
  { name: 'Express Delivery', revenue: 2100, orders: 14, pct: 17 },
];

const customerActivity = [
  { hour: '6am', value: 4 },
  { hour: '8am', value: 12 },
  { hour: '10am', value: 28 },
  { hour: '12pm', value: 35 },
  { hour: '2pm', value: 42 },
  { hour: '4pm', value: 38 },
  { hour: '6pm', value: 30 },
  { hour: '8pm', value: 18 },
  { hour: '10pm', value: 8 },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="liquid-glass p-3 !rounded-xl text-xs" style={{ minWidth: 140 }}>
      <p className="font-headline text-white font-bold mb-1.5">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex justify-between gap-4 text-[11px]">
          <span className="text-[#8893a7]">{entry.name === 'revenue' ? 'This week' : 'Last week'}</span>
          <span className="font-mono text-white">ZMW {(entry.value as number).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
          label="Revenue Today"
          value="ZMW 24,850"
          trend={{ value: '18%', positive: true }}
          subtitle="vs yesterday"
          icon={DollarSign}
          color="#22D3A0"
          accent="green"
        />
        <MetricCard
          label="Orders Processed"
          value="67"
          trend={{ value: '8%', positive: true }}
          subtitle="vs yesterday"
          icon={ShoppingBag}
          color="#4F6EF7"
          accent="blue"
        />
        <MetricCard
          label="Customer Satisfaction"
          value="4.8 / 5.0"
          trend={{ value: '0.2', positive: true }}
          subtitle="vs last week"
          icon={Star}
          color="#F5A623"
          accent="amber"
        />
        <MetricCard
          label="Conversion Rate"
          value="32.4%"
          trend={{ value: '4.1%', positive: true }}
          subtitle="vs last week"
          icon={TrendingUp}
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
              <h2 className="font-headline text-base font-bold text-white">Revenue Trend</h2>
              <p className="text-[11px] text-[#64748B] mt-0.5">Last 7 days vs previous period</p>
            </div>
            <div className="flex items-center gap-5 text-[10px] font-mono uppercase text-[#64748B]">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#4F6EF7]" /> This week</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#4F6EF7]/30" /> Last week</div>
            </div>
          </div>
          <div className="h-72 w-full">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
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
                    dataKey="previous"
                    stroke="rgba(79,110,247,0.25)"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fill="none"
                    name="previous"
                    dot={false}
                  />
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
              <p className="text-[10px] text-[#64748B] mt-0.5">Today&apos;s performance</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Orders handled', value: '56', sub: 'of 67 total', icon: ShoppingBag, color: '#4F6EF7' },
              { label: 'Queries resolved', value: '142', sub: '94% success rate', icon: Sparkles, color: '#22D3A0' },
              { label: 'Upsells made', value: '18', sub: 'ZMW 4,200 added', icon: TrendingUp, color: '#F5A623' },
              { label: 'Staff hours saved', value: '12.4h', sub: '≈ ZMW 1,860 saved', icon: Clock, color: '#A78BFA' },
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
                Your agent handled <span className="text-white font-bold">84%</span> of all customer interactions today
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row — Top Products + Customer Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="liquid-glass-panel p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-[#22D3A0]/10 flex items-center justify-center">
                <Package className="w-4 h-4 text-[#22D3A0]" />
              </div>
              <h2 className="font-headline text-base font-bold text-white">Top Products</h2>
            </div>
            <span className="text-[10px] font-mono text-[#64748B] uppercase">This week</span>
          </div>
          <div className="space-y-4">
            {topProducts.map((product, i) => (
              <div key={i} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-mono text-[#3A4060] w-4 text-right">{i + 1}</span>
                    <span className="text-xs text-white group-hover:text-[#4F6EF7] transition-colors">{product.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-mono text-[#64748B]">{product.orders} sold</span>
                    <span className="text-xs font-mono font-bold text-white">ZMW {product.revenue.toLocaleString()}</span>
                  </div>
                </div>
                <div className="ml-6 h-1.5 bg-white/[0.03] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: mounted ? `${product.pct}%` : '0%',
                      background: `linear-gradient(90deg, #22D3A0, #4F6EF7)`,
                      opacity: 1 - i * 0.15,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Insights */}
        <div className="liquid-glass-panel p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#A78BFA]/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-[#A78BFA]" />
            </div>
            <div>
              <h2 className="font-headline text-base font-bold text-white">Customer Insights</h2>
              <p className="text-[10px] text-[#64748B] mt-0.5">Activity & engagement today</p>
            </div>
          </div>

          {/* Customer Breakdown */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'New', value: '24', color: '#4F6EF7' },
              { label: 'Returning', value: '43', color: '#22D3A0' },
              { label: 'VIP', value: '8', color: '#F5A623' },
            ].map((seg, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center">
                <span className="block font-headline text-xl font-bold text-white">{seg.value}</span>
                <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: seg.color }}>{seg.label}</span>
              </div>
            ))}
          </div>

          {/* Peak Hours */}
          <div>
            <h3 className="text-[10px] font-mono text-[#64748B] uppercase tracking-widest mb-3">Peak Hours Today</h3>
            <div className="h-28 w-full">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={customerActivity} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                    <XAxis
                      dataKey="hour"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748B', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                      interval={1}
                    />
                    <YAxis hide />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={20}>
                      {customerActivity.map((entry, idx) => (
                        <Cell
                          key={idx}
                          fill={entry.value > 30 ? '#4F6EF7' : 'rgba(79,110,247,0.25)'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Common Inquiries */}
          <div>
            <h3 className="text-[10px] font-mono text-[#64748B] uppercase tracking-widest mb-3">Top Inquiry Types</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Order Status', count: 38 },
                { label: 'Product Info', count: 27 },
                { label: 'Returns', count: 14 },
                { label: 'Pricing', count: 12 },
                { label: 'Booking', count: 9 },
              ].map((tag, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-[11px] hover:border-white/[0.12] transition-colors cursor-default"
                >
                  <span className="text-[#8893a7]">{tag.label}</span>
                  <span className="font-mono text-white font-bold">{tag.count}</span>
                </div>
              ))}
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