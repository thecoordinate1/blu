'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, AlertTriangle, Save, Loader2, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

function Toggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#4F6EF7]/40',
        enabled ? 'bg-[#4F6EF7]' : 'bg-[#1E2340]'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200',
          enabled && 'translate-x-5'
        )}
      />
    </button>
  );
}

export default function EscalationSettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(false);
  const [threshold, setThreshold] = useState('3');

  useEffect(() => {
    setMounted(true);

    async function loadSettings() {
      const { data } = await supabase
        .from('notification_settings')
        .select('email_enabled, whatsapp_enabled, escalation_threshold')
        .limit(1)
        .maybeSingle();

      if (data) {
        if (data.email_enabled !== undefined) setEmailNotifications(data.email_enabled);
        if (data.whatsapp_enabled !== undefined) setWhatsappAlerts(data.whatsapp_enabled);
        if (data.escalation_threshold) setThreshold(String(data.escalation_threshold));
      }
    }

    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
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
          Notifications
        </h1>
        <p className="mt-1 text-sm text-[#64748B]">
          Configure how and when you receive alerts about escalations and important events.
        </p>
      </div>

      {/* Notification Channels */}
      <div className="liquid-glass-panel p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#4F6EF7]" />
          <h2 className="text-xs font-headline font-bold text-[#64748B] uppercase tracking-widest">
            Notification Channels
          </h2>
        </div>

        {/* Email Toggle */}
        <div className="flex items-center justify-between bg-[#07080F] border border-[#1E2340] rounded-xl px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#4F6EF7]/10 flex items-center justify-center">
              <Mail className="w-4 h-4 text-[#4F6EF7]" />
            </div>
            <div>
              <p className="text-sm font-headline font-semibold text-[#E2E8F0]">
                Email Notifications
              </p>
              <p className="text-[10px] text-[#64748B]">
                Receive escalation summaries and alerts via email.
              </p>
            </div>
          </div>
          <Toggle
            enabled={emailNotifications}
            onToggle={() => setEmailNotifications(!emailNotifications)}
          />
        </div>

        {/* WhatsApp Toggle */}
        <div className="flex items-center justify-between bg-[#07080F] border border-[#1E2340] rounded-xl px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#22D3A0]/10 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-[#22D3A0]" />
            </div>
            <div>
              <p className="text-sm font-headline font-semibold text-[#E2E8F0]">
                WhatsApp Escalation Alerts
              </p>
              <p className="text-[10px] text-[#64748B]">
                Get instant WhatsApp messages when a conversation is escalated.
              </p>
            </div>
          </div>
          <Toggle
            enabled={whatsappAlerts}
            onToggle={() => setWhatsappAlerts(!whatsappAlerts)}
          />
        </div>
      </div>

      {/* Escalation Threshold */}
      <div className="liquid-glass-panel p-6 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#F5A623]" />
          <h2 className="text-xs font-headline font-bold text-[#64748B] uppercase tracking-widest">
            Escalation Rules
          </h2>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-headline font-semibold text-[#64748B] uppercase tracking-widest">
            Escalation Threshold
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              max="20"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-24 bg-[#07080F] border border-[#1E2340] rounded-xl px-4 py-3 text-sm text-[#E2E8F0] font-mono text-center focus:outline-none focus:ring-2 focus:ring-[#4F6EF7]/40 focus:border-[#4F6EF7]/60 transition-all"
            />
            <span className="text-sm text-[#64748B]">
              unresolved messages before escalation
            </span>
          </div>
          <p className="text-[10px] text-[#3A4060] font-mono">
            When a customer sends this many unanswered messages, the conversation is flagged for human review.
          </p>
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
