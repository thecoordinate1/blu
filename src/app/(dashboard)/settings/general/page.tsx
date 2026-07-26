'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Mail, Crown, Save, Loader2, Check, Phone, ShieldCheck, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function GeneralSettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [bizId, setBizId] = useState<string | null>(null);

  const [businessName, setBusinessName] = useState('Blu_bot');
  const [primaryNumber, setPrimaryNumber] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [tier, setTier] = useState('free');

  // WhatsApp Cloud API credential status
  const [waStatus, setWaStatus] = useState<'connected' | 'configured' | 'disconnected'>('disconnected');
  const [waPhoneId, setWaPhoneId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);

    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setOwnerEmail(user.email);

      const { data } = await supabase
        .from('businesses')
        .select('id, name, whatsapp_number, subscription_tier')
        .limit(1)
        .maybeSingle();

      if (data) {
        setBizId(data.id);
        if (data.name) setBusinessName(data.name);
        if (data.whatsapp_number) setPrimaryNumber(data.whatsapp_number);
        if (data.subscription_tier) setTier(data.subscription_tier);

        // Fetch WhatsApp Cloud API details
        const { data: waSession } = await supabase
          .from('whatsapp_sessions')
          .select('status, wa_phone_number_id, phone_number')
          .eq('business_id', data.id)
          .maybeSingle();

        if (waSession) {
          setWaStatus((waSession.status as any) || 'disconnected');
          setWaPhoneId((waSession as any).wa_phone_number_id || (waSession as any).phone_number || null);
        }
      }
    }

    loadProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (bizId) {
        await supabase
          .from('businesses')
          .update({
            name: businessName,
            whatsapp_number: primaryNumber.trim() || null,
          })
          .eq('id', bizId);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Error saving business profile:', err);
    } finally {
      setSaving(false);
    }
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
          Manage your organisation details, notification contact, and WhatsApp integration overview.
        </p>
      </div>

      {/* Form */}
      <div className="liquid-glass-panel p-6 space-y-6">
        {/* Business Name */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-headline font-semibold text-[#64748B] uppercase tracking-widest">
            <Building2 className="w-3.5 h-3.5 text-[#4F6EF7]" />
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

        {/* Primary Notification Number */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-headline font-semibold text-[#64748B] uppercase tracking-widest">
            <Phone className="w-3.5 h-3.5 text-[#22D3A0]" />
            Primary Notification WhatsApp Number
          </label>
          <input
            type="tel"
            value={primaryNumber}
            onChange={(e) => setPrimaryNumber(e.target.value)}
            className="w-full bg-[#07080F] border border-[#1E2340] rounded-xl px-4 py-3 text-sm text-[#E2E8F0] font-mono placeholder:text-[#3A4060] focus:outline-none focus:ring-2 focus:ring-[#4F6EF7]/40 focus:border-[#4F6EF7]/60 transition-all"
            placeholder="e.g. +260971234567"
          />
          <p className="text-[10px] text-[#3A4060] font-mono">
            This number receives direct WhatsApp alerts when a customer requests human agent escalation.
          </p>
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
        </div>

        {/* Subscription Tier */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-headline font-semibold text-[#64748B] uppercase tracking-widest">
            <Crown className="w-3.5 h-3.5 text-[#A78BFA]" />
            Subscription Tier
          </label>
          <div className="flex items-center gap-3">
            <div className="bg-[#07080F] border border-[#1E2340] rounded-xl px-4 py-3 flex-1">
              <span className="text-sm font-mono text-[#A78BFA] font-bold uppercase">
                {tier} plan
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

      {/* WhatsApp Credentials Info Card */}
      <div className="liquid-glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#22D3A0]" />
            <h2 className="text-xs font-headline font-bold text-[#64748B] uppercase tracking-widest">
              WhatsApp Integration Summary
            </h2>
          </div>
          <a
            href="/settings/numbers"
            className="text-xs font-headline font-semibold text-[#4F6EF7] hover:text-[#6B8AFF] transition-colors flex items-center gap-1"
          >
            Manage Credentials <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="bg-[#07080F] border border-[#1E2340] rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] font-mono text-[#64748B] uppercase">Connection Status</span>
            <p className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${waStatus === 'connected' || waStatus === 'configured' ? 'bg-[#22D3A0]' : 'bg-[#FF4D6D]'}`} />
              {waStatus === 'connected' ? 'Cloud API Active' : waStatus === 'configured' ? 'Configured' : 'Disconnected'}
            </p>
          </div>
          <div className="bg-[#07080F] border border-[#1E2340] rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] font-mono text-[#64748B] uppercase">Phone Number ID</span>
            <p className="text-xs font-mono text-[#94A3B8] truncate">
              {waPhoneId || 'Not configured'}
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
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
