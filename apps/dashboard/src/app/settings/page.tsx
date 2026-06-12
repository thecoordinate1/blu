'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'numbers' | 'escalation' | 'billing'>('general');

  // Form states
  const [businessName, setBusinessName] = useState('Acme Corporation');
  const [persona, setPersona] = useState('You are a friendly, concise support agent for Acme. Help customers find their orders and check inventory.');
  const [kb, setKb] = useState('We sell premium widgets. Shipping takes 2-4 days. Refund policy is 30 days money-back.');
  const [opsNumber, setOpsNumber] = useState('+260 97 1234567');
  const [primaryNumber, setPrimaryNumber] = useState('+260 97 9876543');
  const [keywords, setKeywords] = useState('angry, refund, manager, complaint, lawyer, fake');
  const [confidence, setConfidence] = useState(0.6);

  const pricingTiers = [
    { name: 'Starter', price: '$29/mo', limits: '500 conversations/mo, 1 Ops number', active: true },
    { name: 'Growth', price: '$89/mo', limits: '3,000 conversations/mo, 3 Ops numbers', active: false },
    { name: 'Enterprise', price: 'Custom', limits: 'Unlimited conversations, Custom SLAs', active: false },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-400">
          Configure agent personas, dashboard webhooks, phone numbers, and subscriptions.
        </p>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-[#1e1e2e] space-x-6 pb-px">
        {([
          { key: 'general', label: 'General Configuration' },
          { key: 'numbers', label: 'Phone Numbers' },
          { key: 'escalation', label: 'Escalation Rules' },
          { key: 'billing', label: 'Billing & Plan' },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`pb-4 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all ${
              activeTab === t.key
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Settings Forms */}
      <div className="glass-card rounded-2xl p-6 md:p-8 max-w-3xl">
        
        {/* Tab 1: General */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Business Name
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                AI Persona / Instructions
              </label>
              <textarea
                rows={4}
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input text-sm resize-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                This context is injected into the system instruction for Gemini 2.0 Flash.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Knowledge Base (Context)
              </label>
              <textarea
                rows={4}
                value={kb}
                onChange={(e) => setKb(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input text-sm resize-none"
              />
            </div>

            <button className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all shadow-md shadow-indigo-600/10">
              Save Changes
            </button>
          </div>
        )}

        {/* Tab 2: Numbers */}
        {activeTab === 'numbers' && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Ops Number (WhatsApp Business Line)
              </label>
              <input
                type="text"
                value={opsNumber}
                onChange={(e) => setOpsNumber(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input text-sm"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                The agent will actively respond to messages sent to this WhatsApp profile.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Primary Number (Owner Escalation Line)
              </label>
              <input
                type="text"
                value={primaryNumber}
                onChange={(e) => setPrimaryNumber(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input text-sm"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                WhatsApp number used for critical escalation summaries and database transaction gates.
              </span>
            </div>

            <button className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all">
              Save Numbers
            </button>
          </div>
        )}

        {/* Tab 3: Escalation */}
        {activeTab === 'escalation' && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Escalation Keywords (comma-separated)
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input text-sm"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                If the customer uses any of these keywords, the bot immediately escalates.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Confidence Threshold: {confidence}
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={confidence}
                onChange={(e) => setConfidence(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Minimum confidence score from Gemini. Lower values cause the bot to escalate less frequently.
              </span>
            </div>

            <button className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all">
              Save Rules
            </button>
          </div>
        )}

        {/* Tab 4: Billing */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-200">Subscription details via Lenco</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pricingTiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`p-5 rounded-2xl border ${
                    tier.active 
                      ? 'bg-indigo-600/10 border-indigo-500/30' 
                      : 'bg-transparent border-[#1e1e2e]'
                  } flex flex-col justify-between h-44`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{tier.name}</span>
                      {tier.active && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 uppercase">
                          current
                        </span>
                      )}
                    </div>
                    <span className="block text-2xl font-extrabold text-white mt-2">{tier.price}</span>
                    <p className="text-[11px] text-slate-400 mt-2">{tier.limits}</p>
                  </div>
                  
                  {!tier.active && (
                    <button className="w-full py-2 bg-[#1b1b26] hover:bg-[#2e2e42] border border-[#1e1e2e] rounded-xl text-xs font-semibold text-slate-300 transition-all">
                      Upgrade
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
