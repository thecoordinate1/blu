'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ConversationDetailPage({ params }: { params: { id: string } }) {
  const [messages, setMessages] = useState([
    { id: 'm1', role: 'user', body: 'Hi, I would like to check on my order status.', time: '10:45 AM' },
    { id: 'm2', role: 'assistant', body: 'Got it, let me check that for you right away. What is your order ID?', time: '10:45 AM' },
    { id: 'm3', role: 'user', body: 'Order #8812', time: '10:46 AM' },
    { id: 'm4', role: 'assistant', body: 'Thanks. I looked up Order #8812. It is currently "Shipped" and is expected to arrive tomorrow, June 12th.', time: '10:46 AM' },
    { id: 'm5', role: 'user', body: 'Perfect. Can I update the shipping address?', time: '10:48 AM' },
    { id: 'm6', role: 'assistant', body: 'I need to get approval from the business owner to finalize that change. I\'ve sent them a confirmation request and will complete it as soon as they authorize it. Thanks for your patience!', time: '10:48 AM' },
  ]);

  const [inputVal, setInputVal] = useState('');

  const handleSend = () => {
    if (!inputVal.trim()) return;
    setMessages([
      ...messages,
      { id: `m_${Date.now()}`, role: 'assistant', body: inputVal, time: 'Now' },
    ]);
    setInputVal('');
  };

  const actionHistory = [
    { id: 'a1', type: 'db_read:select', table: 'orders', status: 'success', time: '10:46 AM' },
    { id: 'a2', type: 'db_write:update', table: 'orders', status: 'awaiting_confirm', time: '10:48 AM' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button and page title */}
      <div className="flex items-center space-x-3">
        <Link
          href="/conversations"
          className="p-2 rounded-xl border border-[#1e1e2e] hover:bg-[#1b1b26]/50 text-slate-400 hover:text-slate-100 transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white flex items-center">
            +260 97 1234567
            <span className="ml-3 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
              active
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Conversation ID: {params.id}</p>
        </div>
      </div>

      {/* Main chat window layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Chat Thread Panel */}
        <div className="lg:col-span-3 flex flex-col h-[540px] glass-card rounded-2xl overflow-hidden border border-[#1e1e2e]">
          {/* Messages display */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#12121a]/20">
            {messages.map((msg) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div key={msg.id} className={`flex ${isAssistant ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-md rounded-2xl px-5 py-3.5 text-sm leading-relaxed border shadow-sm ${
                    isAssistant
                      ? 'bg-indigo-600/15 border-indigo-500/20 text-indigo-100 rounded-tr-none'
                      : 'bg-[#1b1b26]/75 border-[#1e1e2e] text-slate-100 rounded-tl-none'
                  }`}>
                    <p>{msg.body}</p>
                    <span className="block text-[9px] text-slate-500 mt-2 text-right">
                      {msg.time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input control box */}
          <div className="p-4 border-t border-[#1e1e2e] bg-[#12121a]/40 flex items-center space-x-3">
            <input
              type="text"
              placeholder="Send message (automatically silences agent for 15 mins)..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 px-4 py-3 text-xs rounded-xl glass-input"
            />
            <button
              onClick={handleSend}
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/15 hover:shadow-indigo-500/25 active:scale-[0.98] transition-all"
            >
              Send
            </button>
          </div>
        </div>

        {/* Sidebar Info Panel */}
        <div className="space-y-5">
          {/* Customer Metadata Card */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-[#1e1e2e]">
              Customer Context
            </h3>
            
            <div className="space-y-3">
              <div>
                <span className="block text-[10px] text-slate-500">WhatsApp ID</span>
                <span className="text-xs font-semibold text-slate-200">+260971234567</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500">Subscription Status</span>
                <span className="text-xs font-semibold text-emerald-400">Starter Tier</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500">Agent Summary Context</span>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                  Customer checking shipping ETA for order #8812. Address correction queued for approval.
                </p>
              </div>
            </div>
          </div>

          {/* Action Log Card */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-[#1e1e2e]">
              Action History
            </h3>
            
            <div className="space-y-3">
              {actionHistory.map((act) => (
                <div key={act.id} className="flex justify-between items-start text-[11px]">
                  <div>
                    <span className="font-bold text-indigo-400 block">{act.type}</span>
                    <span className="text-slate-500">Table: {act.table}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                    act.status === 'success'
                      ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10'
                      : 'bg-amber-500/5 text-amber-400 border-amber-500/10 animate-pulse'
                  }`}>
                    {act.status === 'success' ? 'done' : 'pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
