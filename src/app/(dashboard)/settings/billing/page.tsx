'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Crown,
  Zap,
  ArrowUpRight,
  Receipt,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface PlanInfo {
  name: string;
  messagesUsed: number;
  messagesLimit: number;
  price: string;
  renewalDate: string;
}

export default function BillingSettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [plan, setPlan] = useState<PlanInfo>({
    name: 'Growth',
    messagesUsed: 1240,
    messagesLimit: 3000,
    price: 'R599',
    renewalDate: '2026-07-01',
  });

  useEffect(() => {
    setMounted(true);

    async function loadBilling() {
      const { data } = await supabase
        .from('businesses')
        .select('subscription_tier, messages_used, messages_limit')
        .limit(1)
        .maybeSingle();

      if (data) {
        setPlan((prev) => ({
          ...prev,
          name: data.subscription_tier || prev.name,
          messagesUsed: data.messages_used ?? prev.messagesUsed,
          messagesLimit: data.messages_limit ?? prev.messagesLimit,
        }));
      }
    }

    loadBilling();
  }, []);

  const usagePercent = Math.round((plan.messagesUsed / plan.messagesLimit) * 100);

  if (!mounted) return null;

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-headline font-bold text-[#E2E8F0] tracking-tight">
          Billing
        </h1>
        <p className="mt-1 text-sm text-[#64748B]">
          Manage your subscription, track usage, and view payment history.
        </p>
      </div>

      {/* Current Plan */}
      <div className="liquid-glass-panel p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-[#A78BFA]" />
            <h2 className="text-xs font-headline font-bold text-[#64748B] uppercase tracking-widest">
              Current Plan
            </h2>
          </div>
          <span className="text-[10px] font-mono text-[#22D3A0] bg-[#22D3A0]/10 px-2 py-0.5 rounded-full uppercase">
            Active
          </span>
        </div>

        <div className="flex items-center justify-between bg-[#07080F] border border-[#1E2340] rounded-xl px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4F6EF7] to-[#A78BFA] flex items-center justify-center">
              <Zap className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <p className="text-lg font-headline font-bold text-[#E2E8F0]">
                {plan.name} Plan
              </p>
              <p className="text-xs text-[#64748B] font-mono">
                Renews {plan.renewalDate}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-headline font-bold text-[#E2E8F0]">
              {plan.price}
              <span className="text-xs text-[#64748B] font-normal">/mo</span>
            </p>
          </div>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="liquid-glass-panel p-6 space-y-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#4F6EF7]" />
          <h2 className="text-xs font-headline font-bold text-[#64748B] uppercase tracking-widest">
            Usage This Period
          </h2>
        </div>

        <div className="bg-[#07080F] border border-[#1E2340] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#4F6EF7]" />
              <span className="text-sm font-headline font-semibold text-[#E2E8F0]">
                Messages
              </span>
            </div>
            <span className="text-sm font-mono text-[#E2E8F0]">
              {plan.messagesUsed.toLocaleString()}{' '}
              <span className="text-[#64748B]">/ {plan.messagesLimit.toLocaleString()}</span>
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="h-2 w-full bg-[#1E2340] rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  usagePercent > 90
                    ? 'bg-[#FF4D6D]'
                    : usagePercent > 70
                      ? 'bg-[#F5A623]'
                      : 'bg-[#4F6EF7]'
                )}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <p className="text-[10px] font-mono text-[#64748B] text-right">
              {usagePercent}% used
            </p>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="liquid-glass-panel p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-[#64748B]" />
          <h2 className="text-xs font-headline font-bold text-[#64748B] uppercase tracking-widest">
            Payment History
          </h2>
        </div>

        <div className="text-center py-8 space-y-2">
          <CreditCard className="w-8 h-8 text-[#3A4060] mx-auto" />
          <p className="text-sm text-[#64748B]">No payment history yet.</p>
          <p className="text-xs text-[#3A4060]">
            Your invoices and receipts will appear here after the first billing cycle.
          </p>
        </div>
      </div>

      {/* Upgrade */}
      <div className="flex justify-end">
        <button className="flex items-center gap-2 bg-gradient-to-r from-[#4F6EF7] to-[#A78BFA] hover:opacity-90 text-white text-sm font-headline font-bold px-6 py-2.5 rounded-xl transition-all duration-200">
          <ArrowUpRight className="w-4 h-4" />
          Upgrade Plan
        </button>
      </div>
    </div>
  );
}
