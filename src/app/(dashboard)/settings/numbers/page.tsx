'use client';

import React, { useState, useEffect } from 'react';
import { Phone, Wifi, WifiOff, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { WhatsAppSignup } from '@/components/whatsapp-signup';

interface ConnectedNumber {
  id: string;
  display_number: string;
  display_name: string;
  status: 'connected' | 'disconnected' | 'pending';
}

export default function NumbersSettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [numbers, setNumbers] = useState<ConnectedNumber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);

    async function loadNumbers() {
      const { data } = await supabase
        .from('phone_numbers')
        .select('id, display_phone_number, verified_name, quality_rating')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setNumbers(
          data.map((n: { id: string; display_phone_number?: string; verified_name?: string }) => ({
            id: n.id,
            display_number: n.display_phone_number || 'Unknown',
            display_name: n.verified_name || 'WhatsApp Number',
            status: 'connected' as const,
          }))
        );
      }
      setLoading(false);
    }

    loadNumbers();
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-headline font-bold text-[#E2E8F0] tracking-tight">
          Channels
        </h1>
        <p className="mt-1 text-sm text-[#64748B]">
          Manage your connected WhatsApp Business numbers and add new channels.
        </p>
      </div>

      {/* Connected Numbers */}
      <div className="liquid-glass-panel p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-headline font-bold text-[#64748B] uppercase tracking-widest">
            Connected Numbers
          </h2>
          {numbers.length > 0 && (
            <span className="text-[10px] font-mono text-[#22D3A0] bg-[#22D3A0]/10 px-2 py-0.5 rounded-full">
              {numbers.length} active
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-[#4F6EF7] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : numbers.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <Phone className="w-8 h-8 text-[#3A4060] mx-auto" />
            <p className="text-sm text-[#64748B]">No numbers connected yet.</p>
            <p className="text-xs text-[#3A4060]">
              Use the setup below to connect your first WhatsApp Business number.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {numbers.map((num) => (
              <div
                key={num.id}
                className="flex items-center justify-between bg-[#07080F] border border-[#1E2340] rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#22D3A0]/10 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-[#22D3A0]" />
                  </div>
                  <div>
                    <p className="text-sm font-mono text-[#E2E8F0]">{num.display_number}</p>
                    <p className="text-[10px] text-[#64748B]">{num.display_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {num.status === 'connected' ? (
                    <>
                      <Wifi className="w-3.5 h-3.5 text-[#22D3A0]" />
                      <span className="text-[10px] font-mono text-[#22D3A0] uppercase tracking-wider">
                        Connected
                      </span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3.5 h-3.5 text-[#FF4D6D]" />
                      <span className="text-[10px] font-mono text-[#FF4D6D] uppercase tracking-wider">
                        Disconnected
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Connect New Number */}
      <div className="liquid-glass-panel p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#4F6EF7]" />
          <h2 className="text-xs font-headline font-bold text-[#64748B] uppercase tracking-widest">
            Connect a New Number
          </h2>
        </div>
        <WhatsAppSignup />
      </div>
    </div>
  );
}
