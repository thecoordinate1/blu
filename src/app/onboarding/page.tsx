'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import {
  Building2,
  Bot,
  Phone,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  Store,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { RabbitLogo } from '@/components/rabbit-logo';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const INDUSTRIES = [
  'Retail & E-commerce',
  'Solar & Energy Solutions',
  'Electronics & Hardware',
  'Health & Beauty',
  'Food & Grocery Delivery',
  'Professional Services',
  'Real Estate & Rentals',
  'Other Services',
];

const TONE_OPTIONS = [
  {
    id: 'friendly',
    label: 'Friendly & Welcoming',
    desc: 'Warm, helpful, and accessible. Great for retail and customer service.',
    icon: '😊',
  },
  {
    id: 'professional',
    label: 'Corporate & Professional',
    desc: 'Formal, concise, and structured. Best for B2B and technical sales.',
    icon: '💼',
  },
  {
    id: 'sales_driven',
    label: 'Sales & Deal-Focused',
    desc: 'Enthusiastic, highlights offers and closes orders quickly.',
    icon: '⚡',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Step 1: Business Profile
  const [businessName, setBusinessName] = useState('');
  const [primaryNumber, setPrimaryNumber] = useState('');
  const [industry, setIndustry] = useState(INDUSTRIES[0]);

  // Step 2: AI Agent Persona
  const [agentName, setAgentName] = useState('Blu Assistant');
  const [tone, setTone] = useState('friendly');
  const [customInstructions, setCustomInstructions] = useState(
    'Always greet customers politely, ask how you can help them, and recommend relevant items from our product catalog.'
  );

  // Step 3: WhatsApp Cloud API
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [wabaId, setWabaId] = useState('');

  // Check auth user
  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUserId(user.id);
      setUserEmail(user.email || '');

      // Check if user already has a business profile
      const { data: existingBus } = await supabase
        .from('businesses')
        .select('id, name')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (existingBus) {
        // User already onboarded, send to dashboard
        router.push('/dashboard');
      }
    }
    checkAuth();
  }, [router]);

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!businessName.trim()) {
      setErrorMsg('Please enter your business name.');
      return;
    }
    setCurrentStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!agentName.trim()) {
      setErrorMsg('Please give your AI Assistant a name.');
      return;
    }
    setCurrentStep(3);
  };

  const handleCompleteOnboarding = async (skipWhatsApp = false) => {
    if (!userId) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Create Business in Supabase
      const { data: newBiz, error: bizErr } = await supabase
        .from('businesses')
        .insert({
          name: businessName.trim(),
          owner_id: userId,
          whatsapp_number: primaryNumber.trim() || null,
          subscription_tier: 'free',
          messages_used: 0,
          messages_limit: 1000,
        })
        .select('*')
        .single();

      if (bizErr) throw bizErr;

      const businessId = newBiz.id;

      // 2. Save AI Persona in Supabase (ai_personas table or local fallback)
      try {
        await supabase.from('ai_personas').insert({
          business_id: businessId,
          agent_name: agentName.trim(),
          tone,
          custom_instructions: customInstructions.trim(),
        });
      } catch (err) {
        console.warn('ai_personas insert note:', err);
      }

      // 3. Save WhatsApp Cloud API Credentials if provided
      if (!skipWhatsApp && phoneNumberId.trim() && accessToken.trim()) {
        try {
          await fetch(`${API_URL}/whatsapp/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              businessId,
              phoneNumberId: phoneNumberId.trim(),
              accessToken: accessToken.trim(),
              wabaId: wabaId.trim() || undefined,
            }),
          });
        } catch (apiErr) {
          console.warn('API server call note during onboarding:', apiErr);
          // Also write directly to Supabase as fallback
          await supabase.from('whatsapp_sessions').upsert({
            business_id: businessId,
            provider: 'cloud_api',
            wa_phone_number_id: phoneNumberId.trim(),
            wa_access_token: accessToken.trim(),
            wa_business_account_id: wabaId.trim() || null,
            status: 'configured',
          });
        }
      }

      // 4. Redirect to Dashboard
      router.push('/dashboard?welcome=true');
      router.refresh();
    } catch (err: any) {
      console.error('Onboarding completion error:', err);
      setErrorMsg(err.message || 'Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080F] text-[#E2E8F0] flex flex-col justify-between relative overflow-hidden font-['DM_Sans'] px-4 py-8">
      {/* Dynamic Background Glow */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-[#4F6EF7]/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] rounded-full bg-[#A78BFA]/10 blur-[140px] pointer-events-none" />

      {/* Top Header / Logo */}
      <div className="max-w-3xl mx-auto w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#4F6EF7]/10 border border-[#4F6EF7]/20 rounded-xl flex items-center justify-center text-[#4F6EF7]">
            <RabbitLogo size={26} />
          </div>
          <div>
            <span className="font-headline font-bold text-lg text-white tracking-tight">Blu_bot</span>
            <span className="text-xs text-[#64748B] block font-mono">Workspace Setup</span>
          </div>
        </div>
        <div className="text-xs font-mono text-[#64748B] bg-[#0E1020] border border-[#1E2340] px-3 py-1.5 rounded-full">
          Signed in as <span className="text-[#E2E8F0] font-semibold">{userEmail}</span>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="max-w-2xl mx-auto w-full bg-[#0E1020]/90 border border-[#1E2340] backdrop-blur-2xl rounded-3xl p-8 shadow-2xl my-8 z-10 transition-all">
        
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-headline font-bold uppercase tracking-widest text-[#64748B] mb-3">
            <span className={currentStep >= 1 ? 'text-[#4F6EF7]' : ''}>1. Business Profile</span>
            <span className={currentStep >= 2 ? 'text-[#4F6EF7]' : ''}>2. AI Sales Agent</span>
            <span className={currentStep >= 3 ? 'text-[#4F6EF7]' : ''}>3. WhatsApp Channel</span>
          </div>
          <div className="w-full h-1.5 bg-[#07080F] rounded-full overflow-hidden flex">
            <div
              className="h-full bg-gradient-to-r from-[#4F6EF7] to-[#A78BFA] transition-all duration-500 rounded-full"
              style={{
                width: currentStep === 1 ? '33%' : currentStep === 2 ? '66%' : '100%',
              }}
            />
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 bg-[#FF4D6D]/15 border border-[#FF4D6D]/30 rounded-xl text-xs text-[#FF4D6D] font-medium mb-6">
            {errorMsg}
          </div>
        )}

        {/* ── STEP 1: BUSINESS PROFILE ── */}
        {currentStep === 1 && (
          <form onSubmit={handleNextStep1} className="space-y-6">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-[#4F6EF7]/10 flex items-center justify-center text-[#4F6EF7] mb-3">
                <Store className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-headline font-bold text-white tracking-tight">
                Tell us about your business
              </h2>
              <p className="text-xs text-[#64748B] mt-1">
                We will personalize your WhatsApp AI assistant according to your store details.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-headline font-semibold text-[#64748B] uppercase tracking-wider">
                  Business Name <span className="text-[#FF4D6D]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Solar & Electronics"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-[#07080F] border border-[#1E2340] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#4F6EF7] placeholder:text-[#3A4060] transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-headline font-semibold text-[#64748B] uppercase tracking-wider">
                  Primary Owner WhatsApp Number <span className="text-[#3A4060]">(Optional)</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +260971234567"
                  value={primaryNumber}
                  onChange={(e) => setPrimaryNumber(e.target.value)}
                  className="w-full bg-[#07080F] border border-[#1E2340] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#4F6EF7] placeholder:text-[#3A4060] transition-colors font-mono"
                />
                <p className="text-[11px] text-[#3A4060]">
                  This is the number where you will receive escalation alerts when a customer requests a human agent.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-headline font-semibold text-[#64748B] uppercase tracking-wider">
                  Industry / Industry Sector
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full bg-[#07080F] border border-[#1E2340] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#4F6EF7] transition-colors"
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind} className="bg-[#0E1020] text-white">
                      {ind}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-[#4F6EF7] hover:bg-[#3D5FE6] text-white font-headline font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_-5px_#4F6EF7] flex items-center gap-2"
              >
                Continue to AI Setup
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 2: AI AGENT PERSONA ── */}
        {currentStep === 2 && (
          <form onSubmit={handleNextStep2} className="space-y-6">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-[#A78BFA]/10 flex items-center justify-center text-[#A78BFA] mb-3">
                <Bot className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-headline font-bold text-white tracking-tight">
                Customize your AI Sales Agent
              </h2>
              <p className="text-xs text-[#64748B] mt-1">
                Configure how your AI assistant introduces itself and speaks with your buyers.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-headline font-semibold text-[#64748B] uppercase tracking-wider">
                  Agent Name <span className="text-[#FF4D6D]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Blu, Alex, Sales Bot"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full bg-[#07080F] border border-[#1E2340] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#4F6EF7] placeholder:text-[#3A4060] transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-headline font-semibold text-[#64748B] uppercase tracking-wider">
                  Conversation Tone
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {TONE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTone(opt.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        tone === opt.id
                          ? 'bg-[#4F6EF7]/10 border-[#4F6EF7] text-white'
                          : 'bg-[#07080F] border-[#1E2340] text-[#64748B] hover:border-[#3A4060]'
                      }`}
                    >
                      <span className="text-xl block mb-1">{opt.icon}</span>
                      <p className="text-xs font-bold text-white mb-0.5">{opt.label}</p>
                      <p className="text-[10px] leading-tight text-[#64748B]">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-headline font-semibold text-[#64748B] uppercase tracking-wider">
                  Custom AI Instructions
                </label>
                <textarea
                  rows={3}
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g. Always recommend our solar kits first..."
                  className="w-full bg-[#07080F] border border-[#1E2340] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#4F6EF7] placeholder:text-[#3A4060] transition-colors resize-none font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs font-headline font-bold text-[#64748B] hover:text-white flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="submit"
                className="bg-[#4F6EF7] hover:bg-[#3D5FE6] text-white font-headline font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_-5px_#4F6EF7] flex items-center gap-2"
              >
                Continue to WhatsApp Setup
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 3: WHATSAPP CLOUD API SETUP ── */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-[#22D3A0]/10 flex items-center justify-center text-[#22D3A0] mb-3">
                <Phone className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-headline font-bold text-white tracking-tight">
                Connect WhatsApp Cloud API
              </h2>
              <p className="text-xs text-[#64748B] mt-1">
                Enter your Meta Developer Credentials to start receiving & responding to messages automatically.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-headline font-semibold text-[#64748B] uppercase tracking-wider">
                  Phone Number ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 123456789012345"
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                  className="w-full bg-[#07080F] border border-[#1E2340] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#4F6EF7] placeholder:text-[#3A4060] font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-headline font-semibold text-[#64748B] uppercase tracking-wider">
                  Permanent Access Token
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    placeholder="EAAGxxxxxxxx..."
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    className="w-full bg-[#07080F] border border-[#1E2340] rounded-xl px-4 py-3 pr-10 text-sm text-white focus:outline-none focus:border-[#4F6EF7] placeholder:text-[#3A4060] font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-white"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-headline font-semibold text-[#64748B] uppercase tracking-wider">
                  WhatsApp Business Account ID <span className="text-[#3A4060]">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 987654321098765"
                  value={wabaId}
                  onChange={(e) => setWabaId(e.target.value)}
                  className="w-full bg-[#07080F] border border-[#1E2340] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#4F6EF7] placeholder:text-[#3A4060] font-mono"
                />
              </div>

              <div className="p-3.5 border border-[#1E2340] bg-[#07080F]/50 rounded-xl text-xs space-y-1.5">
                <p className="text-[#94A3B8] font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#22D3A0]" /> Don&apos;t have Meta credentials yet?
                </p>
                <p className="text-[#64748B] text-[11px]">
                  You can click <strong>Skip for Now</strong> to explore the dashboard and configure your WhatsApp Cloud API credentials anytime from the Settings page.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                disabled={loading}
                className="text-xs font-headline font-bold text-[#64748B] hover:text-white flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleCompleteOnboarding(true)}
                  disabled={loading}
                  className="px-5 py-3 border border-[#1E2340] hover:bg-[#1E2340]/40 text-[#94A3B8] font-headline font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                >
                  Skip for Now
                </button>

                <button
                  type="button"
                  onClick={() => handleCompleteOnboarding(false)}
                  disabled={loading}
                  className="bg-[#22D3A0] hover:bg-[#1CB98C] text-[#07080F] font-headline font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_-5px_#22D3A0] flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Complete Setup <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-[#3A4060] font-mono z-10">
        Blu_bot Automated Conversational Commerce Platform &copy; 2026
      </div>
    </div>
  );
}
