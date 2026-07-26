'use client';

import React, { useState, useEffect } from 'react';
import { Phone, MessageSquare, Instagram, Send, Sparkles, Clock, Lock } from 'lucide-react';
import { WhatsAppCloudConnect } from '@/components/whatsapp-cloud-connect';

export default function NumbersSettingsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-headline font-bold text-[#E2E8F0] tracking-tight">
          Channels Integration
        </h1>
        <p className="mt-1 text-sm text-[#64748B]">
          Connect your communication channels to manage customer conversations with AI.
        </p>
      </div>

      {/* Primary Channel: WhatsApp Cloud API */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-[#22D3A0]" />
          <h2 className="text-xs font-headline font-bold text-[#64748B] uppercase tracking-widest">
            Primary Channel — WhatsApp Cloud API
          </h2>
        </div>
        <WhatsAppCloudConnect />
      </div>

      {/* Upcoming Channels (Coming Soon) */}
      <div className="space-y-4 pt-4 border-t border-[#1E2340]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#A78BFA]" />
            <h2 className="text-xs font-headline font-bold text-[#64748B] uppercase tracking-widest">
              Additional Messaging Channels
            </h2>
          </div>
          <span className="text-[10px] font-mono text-[#A78BFA] bg-[#A78BFA]/10 border border-[#A78BFA]/20 px-2.5 py-0.5 rounded-full font-semibold">
            COMING SOON
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Instagram Direct */}
          <div className="liquid-glass-panel p-5 space-y-3 opacity-70 hover:opacity-100 transition-opacity border-[#1E2340] relative">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                <Instagram className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-mono text-[#64748B] uppercase bg-[#07080F] px-2 py-0.5 rounded border border-[#1E2340]">
                Q3 2026
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Instagram Direct</h3>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Auto-reply to Instagram DMs and product inquiries directly.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1 text-[10px] font-mono text-[#A78BFA]">
              <Lock className="w-3 h-3" /> Coming Soon
            </div>
          </div>

          {/* Telegram Bot */}
          <div className="liquid-glass-panel p-5 space-y-3 opacity-70 hover:opacity-100 transition-opacity border-[#1E2340] relative">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Send className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-mono text-[#64748B] uppercase bg-[#07080F] px-2 py-0.5 rounded border border-[#1E2340]">
                Q3 2026
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Telegram Bot</h3>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Connect Telegram bot token for instant customer support.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1 text-[10px] font-mono text-[#A78BFA]">
              <Lock className="w-3 h-3" /> Coming Soon
            </div>
          </div>

          {/* SMS & Two-Way Messaging */}
          <div className="liquid-glass-panel p-5 space-y-3 opacity-70 hover:opacity-100 transition-opacity border-[#1E2340] relative">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-mono text-[#64748B] uppercase bg-[#07080F] px-2 py-0.5 rounded border border-[#1E2340]">
                Q4 2026
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">SMS Gateway</h3>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Send transactional notifications & receipt SMS to buyers.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1 text-[10px] font-mono text-[#A78BFA]">
              <Lock className="w-3 h-3" /> Coming Soon
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
