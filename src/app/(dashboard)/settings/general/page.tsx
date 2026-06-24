'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Mail, Crown, Save, Loader2, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function GeneralSettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [businessName, setBusinessName] = useState('Acme Corp');
  const [ownerEmail, setOwnerEmail] = useState('admin@acmecorp.com');
  const [tier, setTier] = useState('Growth');

  useEffect(() => {
    setMounted(true);

    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setOwnerEmail(user.email);

      const { data } = await supabase
        .from('businesses')
        .select('name, subscription_tier')
        .limit(1)
        .maybeSingle();

      if (data) {
        if (data.name) setBusinessName(data.name);
        if (data.subscription_tier) setTier(data.subscription_tier);
      }
    }

    loadProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    // Simulate save — wire up to Supabase update when ready
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-headline font-bold text-[#E2E8F0] tracking-tight">
          Business Profile
        </h1>
        <p className="mt-1 text-sm text-[#64748B]">
          Manage your organisation details and subscription information.
        </p>
      </div>

      {/* Form */}
      <div className="liquid-glass-panel p-6 space-y-6">
        {/* Business Name */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-headline font-semibold text-[#64748B] uppercase tracking-widest">
            <Building2 className="w-3.5 h-3.5" />
            Business Name
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full bg-[#07080F] border border-[#1E2340] rounded-xl px-4 py-3 text-sm text-[#E2E8F0] font-mono placeholder:text-[#3A4060] focus:outline-none focus:ring-2 focus:ring-[#4F6EF7]/40 focus:border-[#4F6EF7]/60 transition-all"
            placeholder="Your business name"
          />
        </div>

        {/* Owner Email */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-headline font-semibold text-[#64748B] uppercase tracking-widest">
            <Mail className="w-3.5 h-3.5" />
            Owner Email
          </label>
          <input
            type="email"
            value={ownerEmail}
            readOnly
            className="w-full bg-[#07080F]/60 border border-[#1E2340] rounded-xl px-4 py-3 text-sm text-[#64748B] font-mono cursor-not-allowed"
          />
          <p className="text-[10px] text-[#3A4060] font-mono">
            Email is linked to your auth account and cannot be changed here.
          </p>
        </div>

        {/* Subscription Tier */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-headline font-semibold text-[#64748B] uppercase tracking-widest">
            <Crown className="w-3.5 h-3.5" />
            Subscription Tier
          </label>
          <div className="flex items-center gap-3">
            <div className="bg-[#07080F] border border-[#1E2340] rounded-xl px-4 py-3 flex-1">
              <span className="text-sm font-mono text-[#A78BFA] font-bold uppercase">
                {tier}
              </span>
            </div>
            <a
              href="/settings/billing"
              className="text-xs font-headline font-semibold text-[#4F6EF7] hover:text-[#6B8AFF] transition-colors whitespace-nowrap"
            >
              Change plan →
            </a>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#4F6EF7] hover:bg-[#6B8AFF] disabled:opacity-50 text-white text-sm font-headline font-bold px-6 py-2.5 rounded-xl transition-all duration-200"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
