'use client';

import React, { useState } from 'react';
import { StatusBadge } from '@/components/shared/status-badge';
import { Input } from '@/components/ui/input';
import { Search, Filter, ChevronRight, MoreVertical, MessageSquare, User, Bot, ExternalLink, X, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ConversationsPage() {
  const [selectedConvo, setSelectedConvo] = useState<any>(null);

  const conversations = [
    { id: '1', phone: '+260 7XX XXX 234', lastMsg: 'I need help with my package tracking...', status: 'active', time: '2 min ago', direction: 'inbound' },
    { id: '2', phone: '+260 7XX XXX 958', lastMsg: 'This is the third time I ask!!', status: 'escalated', time: '14 min ago', direction: 'inbound' },
    { id: '3', phone: '+260 7XX XXX 144', lastMsg: 'Thank you for your help!', status: 'closed', time: '1 hour ago', direction: 'outbound' },
    { id: '4', phone: '+260 7XX XXX 001', lastMsg: 'What are your store hours?', status: 'active', time: '3 hours ago', direction: 'inbound' },
  ];

  const messages = [
    { id: 'm1', role: 'customer', content: 'Hello, I bought a package last week but it hasn\'t arrived yet. Can you check?', time: '10:05 AM' },
    { id: 'm2', role: 'agent', content: 'I\'d be happy to help with that! Could you please provide your order ID?', time: '10:05 AM' },
    { id: 'm3', role: 'customer', content: 'My order ID is #8219-BA.', time: '10:06 AM' },
    { id: 'm4', role: 'agent', content: 'Checking that for you... One moment.', time: '10:06 AM' },
  ];

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-headline font-bold text-white">Conversations</h1>
        <p className="text-[#64748B] text-sm">Manage and monitor customer sessions in real-time.</p>
      </header>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-[#0E1020] border border-[#1E2340] p-2 rounded-xl">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#3A4060]" />
          <Input 
            placeholder="Search by phone number or message..." 
            className="pl-10 bg-transparent border-none focus-visible:ring-0 text-sm placeholder:text-[#3A4060]" 
          />
        </div>
        <div className="flex gap-1 h-9 bg-[#07080F] p-1 rounded-lg border border-[#1E2340]">
          {['All', 'Active', 'Escalated', 'Closed'].map((tab) => (
            <button 
              key={tab}
              className={cn(
                "px-4 text-[11px] font-headline font-bold rounded-md transition-all",
                tab === 'All' ? "bg-[#1A1F3A] text-white shadow-sm" : "text-[#64748B] hover:text-[#E2E8F0]"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
        {/* Table Area */}
        <div className="flex-1 glass-card overflow-hidden flex flex-col">
          <div className="overflow-x-auto overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1E2340] bg-[#131629]/50">
                  <th className="p-4 w-12"><Input type="checkbox" className="w-4 h-4 rounded border-[#1E2340] bg-transparent" /></th>
                  <th className="p-4 text-[10px] font-mono text-[#64748B] uppercase tracking-widest">Customer</th>
                  <th className="p-4 text-[10px] font-mono text-[#64748B] uppercase tracking-widest">Last Message</th>
                  <th className="p-4 text-[10px] font-mono text-[#64748B] uppercase tracking-widest">Status</th>
                  <th className="p-4 text-[10px] font-mono text-[#64748B] uppercase tracking-widest">Time</th>
                  <th className="p-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2340]">
                {conversations.map((chat) => (
                  <tr 
                    key={chat.id} 
                    onClick={() => setSelectedConvo(chat)}
                    className={cn(
                      "hover:bg-[#1A1F3A] cursor-pointer transition-colors group",
                      selectedConvo?.id === chat.id && "bg-[#1A1F3A]",
                      chat.status === 'escalated' && "bg-[#FF4D6D]/5"
                    )}
                  >
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <Input type="checkbox" className="w-4 h-4 rounded border-[#1E2340] bg-transparent" />
                    </td>
                    <td className="p-4 font-mono text-sm text-white">{chat.phone}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-xs text-[#E2E8F0] line-clamp-1">
                        {chat.direction === 'inbound' ? <span className="text-[#A78BFA]">←</span> : <span className="text-[#4F6EF7]">→</span>}
                        {chat.lastMsg}
                      </div>
                    </td>
                    <td className="p-4"><StatusBadge status={chat.status as any} /></td>
                    <td className="p-4 text-[10px] font-mono text-[#64748B]">{chat.time}</td>
                    <td className="p-4">
                      <ChevronRight className="w-4 h-4 text-[#3A4060] group-hover:text-white transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="p-4 border-t border-[#1E2340] flex justify-center">
            <button className="text-[11px] font-headline font-bold text-[#64748B] hover:text-white transition-colors">LOAD MORE CONVERSATIONS</button>
          </div>
        </div>

        {/* Selected Convo Side Panel */}
        {selectedConvo && (
          <div className="w-[420px] glass-card flex flex-col animate-in slide-in-from-right-4 duration-300">
            {/* Panel Header */}
            <div className="p-6 border-b border-[#1E2340] bg-[#131629]/50 flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-mono text-lg font-bold text-white tracking-tight">{selectedConvo.phone}</h3>
                <div className="flex items-center gap-3 text-[10px] font-mono text-[#64748B] uppercase">
                  <StatusBadge status={selectedConvo.status} className="h-4 px-2" />
                  <span>Started 2h ago</span>
                  <span>·</span>
                  <span>12 Messages</span>
                </div>
              </div>
              <button onClick={() => setSelectedConvo(null)} className="text-[#3A4060] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#07080F]/50">
              {messages.map((msg) => (
                <div key={msg.id} className={cn(
                  "flex flex-col gap-1",
                  msg.role === 'agent' ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "max-w-[85%] p-3 rounded-2xl text-sm",
                    msg.role === 'agent' 
                      ? "bg-[#4F6EF7] text-white rounded-tr-none" 
                      : "bg-[#131629] border border-[#1E2340] text-[#E2E8F0] rounded-tl-none"
                  )}>
                    {msg.content}
                  </div>
                  <div className="flex items-center gap-1.5 px-1">
                    {msg.role === 'agent' ? <Bot className="w-3 h-3 text-[#A78BFA]" /> : <User className="w-3 h-3 text-[#64748B]" />}
                    <span className="text-[9px] font-mono text-[#3A4060]">{msg.time}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions Bar */}
            <div className="p-6 border-t border-[#1E2340] bg-[#131629]/50 space-y-4">
              <div className="flex gap-2">
                <button className="flex-1 py-2.5 bg-[#FF4D6D22] border border-[#FF4D6D44] text-[#FF4D6D] rounded-lg text-[10px] font-headline font-bold uppercase hover:bg-[#FF4D6D33] transition-all">
                  Escalate Manually
                </button>
                <button className="flex-1 py-2.5 bg-[#1E2340] border border-[#2E3560] text-white rounded-lg text-[10px] font-headline font-bold uppercase hover:bg-[#2E3560] transition-all">
                  Close Convo
                </button>
              </div>
              <Link 
                href={`/conversations/${selectedConvo.id}`}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#4F6EF7] text-white rounded-lg text-xs font-headline font-bold hover:bg-[#4F6EF7]/80 transition-all shadow-[0_0_15px_-5px_#4F6EF7]"
              >
                OPEN FULL VIEW <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}