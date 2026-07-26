'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Phone,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
  Shield,
  Unplug,
  Copy,
  Check,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type ConnectionStatus = 'disconnected' | 'configured' | 'connected' | 'verifying' | 'error';

export function WhatsAppCloudConnect() {
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form fields
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [showToken, setShowToken] = useState(false);

  // Webhook URL display
  const [copied, setCopied] = useState(false);

  // ── Init: load business + check existing config ──────────────────────────
  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return setLoading(false);

      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)
        .single();

      if (business) {
        setBusinessId(business.id);
        await fetchStatus(business.id);
      }
      setLoading(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch status from the API ─────────────────────────────────────────────
  const fetchStatus = useCallback(async (bid: string) => {
    try {
      const res = await fetch(`${API_URL}/whatsapp/sessions/${bid}/status`);
      if (!res.ok) {
        // Fall back to Supabase
        await fetchStatusFromSupabase(bid);
        return;
      }
      const json = await res.json();

      if (json.status === 'connected' || json.status === 'configured') {
        setStatus(json.status as ConnectionStatus);
        setPhoneNumber(json.phoneNumber || json.phoneNumberId || null);
        if (json.phoneNumberId) setPhoneNumberId(json.phoneNumberId);
      } else {
        setStatus('disconnected');
      }
    } catch {
      await fetchStatusFromSupabase(bid);
    }
  }, []);

  const fetchStatusFromSupabase = useCallback(async (bid: string) => {
    try {
      const { data } = await supabase
        .from('whatsapp_sessions')
        .select('status, phone_number, wa_phone_number_id')
        .eq('business_id', bid)
        .maybeSingle();

      if (data) {
        const s = data.status as string;
        if (s === 'connected' || s === 'configured') {
          setStatus(s as ConnectionStatus);
          setPhoneNumber(data.phone_number ?? null);
          if ((data as any).wa_phone_number_id) {
            setPhoneNumberId((data as any).wa_phone_number_id);
          }
        } else {
          setStatus('disconnected');
        }
      }
    } catch (err) {
      console.error('Supabase status fallback error', err);
    }
  }, []);

  // ── Save credentials ─────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!businessId) return;
    if (!phoneNumberId.trim() || !accessToken.trim()) {
      setErrorMsg('Phone Number ID and Access Token are required.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${API_URL}/whatsapp/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          phoneNumberId: phoneNumberId.trim(),
          accessToken: accessToken.trim(),
          wabaId: wabaId.trim() || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Failed to save credentials.');
      }

      setStatus('configured');
      setSuccessMsg('Credentials saved! Now verify your connection.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save credentials.');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  // ── Verify credentials ───────────────────────────────────────────────────
  const handleVerify = async () => {
    if (!businessId) return;

    setStatus('verifying');
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${API_URL}/whatsapp/sessions/${businessId}/verify`, {
        method: 'POST',
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Verification failed. Check your credentials.');
      }

      setStatus('connected');
      setPhoneNumber(json.phoneNumber || json.verifiedName || phoneNumberId);
      setSuccessMsg(`✅ Verified! Connected as "${json.verifiedName || 'WhatsApp Business'}"`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed.');
      setStatus('error');
    }
  };

  // ── Disconnect ────────────────────────────────────────────────────────────
  const handleDisconnect = async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      await fetch(`${API_URL}/whatsapp/sessions/${businessId}`, { method: 'DELETE' });
      setStatus('disconnected');
      setPhoneNumber(null);
      setPhoneNumberId('');
      setAccessToken('');
      setWabaId('');
      setSuccessMsg(null);
      setErrorMsg(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Copy webhook URL ──────────────────────────────────────────────────────
  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/webhook/whatsapp`
    : '/api/webhook/whatsapp';

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Initial skeleton ──────────────────────────────────────────────────────
  if (loading && !businessId) {
    return (
      <Card className="bg-[#07080F] border-[#1E2340]">
        <CardContent className="p-6 flex justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-[#4F6EF7]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Main Connection Card ── */}
      <Card className="bg-[#07080F] border-[#1E2340]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Phone className="w-5 h-5 text-[#4F6EF7]" />
            WhatsApp Cloud API
          </CardTitle>
          <CardDescription className="text-[#64748B]">
            Connect using the official Meta WhatsApp Cloud API. Your personal WhatsApp stays untouched.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">

          {/* ── CONNECTED STATE ── */}
          {(status === 'connected' || status === 'configured') && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 border border-[#22D3A0]/20 bg-[#22D3A0]/5 rounded-xl gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#22D3A0]/10 flex items-center justify-center">
                    <Wifi className="w-5 h-5 text-[#22D3A0]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#22D3A0]" />
                      {status === 'connected' ? 'Cloud API Connected' : 'Credentials Configured'}
                    </p>
                    <p className="text-xs font-mono text-[#22D3A0]">
                      {phoneNumber ? `Phone: ${phoneNumber}` : `ID: ${phoneNumberId}`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {status === 'configured' && (
                    <Button
                      onClick={handleVerify}
                      className="bg-[#4F6EF7] hover:bg-[#3D5FE6] text-white"
                      size="sm"
                    >
                      <Shield className="w-4 h-4 mr-1" />
                      Verify
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    onClick={handleDisconnect}
                    disabled={loading}
                    size="sm"
                  >
                    <Unplug className="w-4 h-4 mr-1" />
                    Disconnect
                  </Button>
                </div>
              </div>

              {successMsg && (
                <p className="text-sm text-[#22D3A0] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> {successMsg}
                </p>
              )}
            </div>
          )}

          {/* ── VERIFYING STATE ── */}
          {status === 'verifying' && (
            <div className="flex items-center gap-3 p-4 border border-[#4F6EF7]/20 bg-[#4F6EF7]/5 rounded-xl">
              <RefreshCw className="w-5 h-5 animate-spin text-[#4F6EF7]" />
              <span className="text-sm text-[#94A3B8]">Verifying credentials with Meta…</span>
            </div>
          )}

          {/* ── ERROR STATE ── */}
          {errorMsg && (
            <div className="flex items-start gap-3 p-4 border border-[#FF4D6D]/20 bg-[#FF4D6D]/5 rounded-xl">
              <AlertCircle className="w-5 h-5 text-[#FF4D6D] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white">Connection Error</p>
                <p className="text-xs text-[#64748B] mt-1">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* ── DISCONNECTED / FORM STATE ── */}
          {(status === 'disconnected' || status === 'error') && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="phoneNumberId" className="text-sm text-[#94A3B8]">
                    Phone Number ID <span className="text-[#FF4D6D]">*</span>
                  </Label>
                  <Input
                    id="phoneNumberId"
                    placeholder="e.g. 123456789012345"
                    value={phoneNumberId}
                    onChange={(e) => setPhoneNumberId(e.target.value)}
                    className="bg-[#0D0F1A] border-[#1E2340] text-white placeholder:text-[#3A4060]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="accessToken" className="text-sm text-[#94A3B8]">
                    Permanent Access Token <span className="text-[#FF4D6D]">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="accessToken"
                      type={showToken ? 'text' : 'password'}
                      placeholder="EAAxxxxxxxxx..."
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      className="bg-[#0D0F1A] border-[#1E2340] text-white placeholder:text-[#3A4060] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-white transition-colors"
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="wabaId" className="text-sm text-[#94A3B8]">
                    WhatsApp Business Account ID <span className="text-[#64748B]">(optional)</span>
                  </Label>
                  <Input
                    id="wabaId"
                    placeholder="e.g. 987654321098765"
                    value={wabaId}
                    onChange={(e) => setWabaId(e.target.value)}
                    className="bg-[#0D0F1A] border-[#1E2340] text-white placeholder:text-[#3A4060]"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSave}
                  disabled={loading || !phoneNumberId.trim() || !accessToken.trim()}
                  className="bg-[#4F6EF7] hover:bg-[#3D5FE6] text-white disabled:opacity-50"
                >
                  {loading ? (
                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Saving…</>
                  ) : (
                    <><Shield className="w-4 h-4 mr-2" />Save & Connect</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Webhook URL Card ── */}
      <Card className="bg-[#07080F] border-[#1E2340]">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-[#64748B]" />
            Webhook Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs text-[#64748B]">Webhook URL (paste in Meta Developer Console)</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <code className="flex-1 text-xs bg-[#0D0F1A] border border-[#1E2340] rounded-md px-3 py-2 text-[#94A3B8] truncate">
                {webhookUrl}
              </code>
              <Button variant="ghost" size="sm" onClick={handleCopy} className="text-[#64748B] hover:text-white">
                {copied ? <Check className="w-4 h-4 text-[#22D3A0]" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div>
            <Label className="text-xs text-[#64748B]">Verify Token</Label>
            <code className="block text-xs bg-[#0D0F1A] border border-[#1E2340] rounded-md px-3 py-2 text-[#94A3B8] mt-1.5">
              blu-agent-secret
            </code>
          </div>
          <a
            href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#4F6EF7] hover:text-[#3D5FE6] flex items-center gap-1 mt-2"
          >
            <ExternalLink className="w-3 h-3" />
            Meta Cloud API Setup Guide
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
