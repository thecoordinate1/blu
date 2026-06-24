'use client';

import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Save, Loader2, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const TONE_OPTIONS = [
  {
    value: 'professional',
    label: 'Professional',
    description: 'Formal, precise language for B2B or corporate use.',
    emoji: '💼',
  },
  {
    value: 'friendly',
    label: 'Friendly',
    description: 'Warm and approachable while staying helpful.',
    emoji: '😊',
  },
  {
    value: 'casual',
    label: 'Casual',
    description: 'Relaxed, conversational tone for lifestyle brands.',
    emoji: '✌️',
  },
] as const;

type Tone = (typeof TONE_OPTIONS)[number]['value'];

export default function PersonaSettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [agentName, setAgentName] = useState('Blu');
  const [tone, setTone] = useState<Tone>('friendly');
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    setMounted(true);

    async function loadPersona() {
      const { data } = await supabase
        .from('ai_personas')
        .select('agent_name, tone, custom_instructions')
        .limit(1)
        .maybeSingle();

      if (data) {
        if (data.agent_name) setAgentName(data.agent_name);
        if (data.tone) setTone(data.tone);
        if (data.custom_instructions) setInstructions(data.custom_instructions);
      }
    }

    loadPersona();
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
          AI Assistant
        </h1>
        <p className="mt-1 text-sm text-[#64748B]">
          Configure your AI agent&apos;s personality, tone, and custom instructions.
        </p>
      </div>

      {/* Agent Identity */}
      <div className="liquid-glass-panel p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-[#4F6EF7]" />
          <h2 className="text-xs font-headline font-bold text-[#64748B] uppercase tracking-widest">
            Agent Identity
          </h2>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-headline font-semibold text-[#64748B] uppercase tracking-widest">
            Agent Name
          </label>
          <input
            type="text"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            className="w-full bg-[#07080F] border border-[#1E2340] rounded-xl px-4 py-3 text-sm text-[#E2E8F0] font-mono placeholder:text-[#3A4060] focus:outline-none focus:ring-2 focus:ring-[#4F6EF7]/40 focus:border-[#4F6EF7]/60 transition-all"
            placeholder="e.g. Blu, Assistant, Helper"
          />
          <p className="text-[10px] text-[#3A4060] font-mono">
            This name is how the AI introduces itself to customers.
          </p>
        </div>
      </div>

      {/* Tone Selector */}
      <div className="liquid-glass-panel p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#A78BFA]" />
          <h2 className="text-xs font-headline font-bold text-[#64748B] uppercase tracking-widest">
            Conversation Tone
          </h2>
        </div>

        <div className="grid gap-3">
          {TONE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setTone(option.value)}
              className={cn(
                'flex items-start gap-4 text-left bg-[#07080F] border rounded-xl px-4 py-3.5 transition-all duration-200',
                tone === option.value
                  ? 'border-[#4F6EF7] ring-1 ring-[#4F6EF7]/30'
                  : 'border-[#1E2340] hover:border-[#3A4060]'
              )}
            >
              <span className="text-lg mt-0.5">{option.emoji}</span>
              <div>
                <p
                  className={cn(
                    'text-sm font-headline font-bold',
                    tone === option.value ? 'text-[#E2E8F0]' : 'text-[#64748B]'
                  )}
                >
                  {option.label}
                </p>
                <p className="text-[11px] text-[#3A4060] mt-0.5">{option.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Instructions */}
      <div className="liquid-glass-panel p-6 space-y-4">
        <h2 className="text-xs font-headline font-bold text-[#64748B] uppercase tracking-widest">
          Custom Instructions
        </h2>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={5}
          className="w-full bg-[#07080F] border border-[#1E2340] rounded-xl px-4 py-3 text-sm text-[#E2E8F0] font-mono placeholder:text-[#3A4060] focus:outline-none focus:ring-2 focus:ring-[#4F6EF7]/40 focus:border-[#4F6EF7]/60 transition-all resize-none"
          placeholder="Add any special instructions for your AI assistant, e.g. 'Always greet customers by name' or 'Recommend our premium plan when asked about pricing'…"
        />
        <p className="text-[10px] text-[#3A4060] font-mono">
          {instructions.length}/2000 characters
        </p>
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
