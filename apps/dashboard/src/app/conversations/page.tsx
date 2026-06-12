'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ConversationsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'escalated' | 'closed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const conversations = [
    { id: '1', contact: '+260 97 1234567', preview: 'Hi, I would like to check on my order status...', time: '5m ago', date: '2026-06-11T16:55:00Z', status: 'active', tier: 'Starter' },
    { id: '2', contact: '+260 97 9991111', preview: 'This is urgent, please connect me to a manager.', time: '12m ago', date: '2026-06-11T16:48:00Z', status: 'escalated', tier: 'Starter' },
    { id: '3', contact: '+260 95 4443322', preview: 'Can I add another item to my booking details?', time: '30m ago', date: '2026-06-11T16:30:00Z', status: 'active', tier: 'Growth' },
    { id: '4', contact: '+260 96 7778888', preview: 'Thank you for the updates! Have a nice day.', time: '1h ago', date: '2026-06-11T16:00:00Z', status: 'closed', tier: 'Starter' },
    { id: '5', contact: '+260 97 2223344', preview: 'Wait, so the order is cancelled?', time: '2h ago', date: '2026-06-11T15:00:00Z', status: 'active', tier: 'Starter' },
    { id: '6', contact: '+260 95 5556666', preview: 'No, that is everything. Cheers!', time: '1d ago', date: '2026-06-10T12:00:00Z', status: 'closed', tier: 'Growth' },
  ];

  // Filters logic
  const filteredConvs = conversations.filter((c) => {
    const matchesSearch = c.contact.includes(searchQuery) || c.preview.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || c.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Conversations</h1>
          <p className="mt-1 text-sm text-slate-400">
            Monitor and take over live AI interactions with your customers.
          </p>
        </div>
        
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search by number or body..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl glass-input placeholder-slate-500"
          />
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-[#1e1e2e] space-x-6 pb-px">
        {(['all', 'active', 'escalated', 'closed'] as const).map((tab) => {
          const count = tab === 'all' 
            ? conversations.length 
            : conversations.filter((c) => c.status === tab).length;
          
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all relative ${
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
              <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 border border-slate-700 text-slate-400">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Conversations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredConvs.length > 0 ? (
          filteredConvs.map((conv) => (
            <div key={conv.id} className="glass-card rounded-2xl p-5 flex flex-col justify-between h-44 group relative overflow-hidden">
              {/* Highlight badge for escalations */}
              {conv.status === 'escalated' && (
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 animate-pulse" />
              )}

              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">
                    {conv.contact}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-slate-500">{conv.time}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase border ${
                      conv.status === 'active'
                        ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10'
                        : conv.status === 'escalated'
                        ? 'bg-amber-500/5 text-amber-400 border-amber-500/10 animate-pulse'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {conv.status}
                    </span>
                  </div>
                </div>
                
                <p className="mt-3 text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {conv.preview}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#1e1e2e]/50 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">
                  Billing tier: <span className="font-semibold text-slate-400">{conv.tier}</span>
                </span>
                
                <Link
                  href={`/conversations/${conv.id}`}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                >
                  <span>Open Thread</span>
                  <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 text-center glass-panel border border-dashed rounded-2xl">
            <svg className="w-12 h-12 mx-auto text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="text-sm font-semibold text-slate-300">No conversations found</h3>
            <p className="text-xs text-slate-500 mt-1">Try modifying your tab filters or search query.</p>
          </div>
        )}
      </div>
    </div>
  );
}
