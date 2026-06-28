'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, RefreshCw, Unplug, Phone, Wifi, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { QRCodeSVG } from 'qrcode.react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// How long we wait for QR before showing a "still loading" message
const QR_SLOW_THRESHOLD_MS = 20000;
// How long before we declare a timeout (90s — Chrome can be slow first time)
const QR_TIMEOUT_MS = 90000;

export function WhatsAppQRConnect() {
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<'disconnected' | 'qr_pending' | 'connected' | 'error'>('disconnected');
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Cooldown prevents the user clicking Generate QR multiple times
  const [cooldownSec, setCooldownSec] = useState(0);

  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);

  // ── Init: load business + check existing session ──────────────────────────
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
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
    return () => stopPolling();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch status from the API (source of truth) ───────────────────────────
  const fetchStatus = useCallback(async (bid: string) => {
    try {
      const res = await fetch(`${API_URL}/whatsapp/sessions/${bid}/status`);
      if (!res.ok) {
        // API unreachable — fall back to Supabase
        await fetchStatusFromSupabase(bid);
        return;
      }
      const json = await res.json();
      const s = json.status as string;

      if (s === 'connected') {
        setStatus('connected');
        setPhoneNumber(json.phoneNumber || null);
        setQrCode(null);
        stopPolling();
      } else if (s === 'qr_pending') {
        setStatus('qr_pending');
        setQrCode(json.qrCode || null);
      } else {
        // If API says disconnected but we were polling, let Supabase confirm
        await fetchStatusFromSupabase(bid);
      }
    } catch {
      await fetchStatusFromSupabase(bid);
    }
  }, []);

  // ── Supabase fallback ─────────────────────────────────────────────────────
  const fetchStatusFromSupabase = useCallback(async (bid: string) => {
    try {
      const { data } = await supabase
        .from('whatsapp_sessions')
        .select('status, qr_code, phone_number')
        .eq('business_id', bid)
        .maybeSingle();

      if (data) {
        const s = data.status as string;
        setStatus(s as any);
        setQrCode((data as any).qr_code ?? null);
        setPhoneNumber((data as any).phone_number ?? null);
        if (s === 'connected') stopPolling();
      }
    } catch (err) {
      console.error('Supabase status fallback error', err);
    }
  }, []);

  // ── Elapsed timer ─────────────────────────────────────────────────────────
  const startElapsedTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - (startTimeRef.current ?? Date.now());
      setElapsedMs(elapsed);

      if (elapsed >= QR_TIMEOUT_MS) {
        stopPolling();
        setStatus('error');
        setErrorMsg('QR code generation timed out. The server may be busy. Please try again.');
      }
    }, 500);
  }, []);

  // ── Start polling ─────────────────────────────────────────────────────────
  const startPolling = useCallback((bid: string) => {
    setPolling(true);
    startElapsedTimer();

    // Immediate first poll after 3s (give Chrome time to launch)
    pollRef.current = setInterval(() => {
      fetchStatus(bid);
    }, 3000);
  }, [fetchStatus, startElapsedTimer]);

  // ── Stop polling ──────────────────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setPolling(false);
    startTimeRef.current = null;
  }, []);

  // ── Connect ───────────────────────────────────────────────────────────────
  const handleConnect = async () => {
    if (!businessId || cooldownSec > 0) return;
    setLoading(true);
    setErrorMsg(null);
    setQrCode(null);
    setElapsedMs(0);

    // Start a 10-second cooldown immediately so the button is locked
    const COOLDOWN = 10;
    setCooldownSec(COOLDOWN);
    let remaining = COOLDOWN;
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      remaining--;
      setCooldownSec(remaining);
      if (remaining <= 0 && cooldownRef.current) {
        clearInterval(cooldownRef.current);
        cooldownRef.current = null;
      }
    }, 1000);

    try {
      const res = await fetch(`${API_URL}/whatsapp/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId }),
      });

      const json = await res.json();

      if (res.status === 409) {
        // Already initializing or connected — show message, don't enter polling
        setErrorMsg(json.error || 'Session already active.');
        setStatus('error');
        setLoading(false);
        return;
      }

      if (res.status === 429) {
        // Rate limited
        setErrorMsg(json.error || 'Too many requests. Please wait a moment.');
        setStatus('error');
        setLoading(false);
        return;
      }

      if (!res.ok) throw new Error(json.error || 'Failed to start session. Is the API running on port 3001?');

      setStatus('qr_pending');
      startPolling(businessId);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not connect to the API server.');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  // ── Disconnect ────────────────────────────────────────────────────────────
  const handleDisconnect = async () => {
    if (!businessId) return;
    setLoading(true);
    stopPolling();
    try {
      await fetch(`${API_URL}/whatsapp/sessions/${businessId}`, { method: 'DELETE' });
      setStatus('disconnected');
      setQrCode(null);
      setPhoneNumber(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Retry ─────────────────────────────────────────────────────────────────
  const handleRetry = () => {
    setStatus('disconnected');
    setErrorMsg(null);
    setQrCode(null);
    setElapsedMs(0);
  };

  // ── Loading state labels ──────────────────────────────────────────────────
  const isSlow = elapsedMs > QR_SLOW_THRESHOLD_MS;
  const waitSeconds = Math.round(elapsedMs / 1000);
  const progressPct = Math.min((elapsedMs / QR_TIMEOUT_MS) * 100, 100);

  const loadingMessage = (() => {
    if (elapsedMs < 5000)  return 'Launching browser…';
    if (elapsedMs < 15000) return 'Loading WhatsApp Web…';
    if (elapsedMs < 30000) return 'Waiting for QR code…';
    if (elapsedMs < 60000) return 'Almost ready — this can take up to a minute…';
    return 'Still working, please wait…';
  })();

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
    <Card className="bg-[#07080F] border-[#1E2340]">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <QrCode className="w-5 h-5 text-[#4F6EF7]" />
          WhatsApp Web Connection
        </CardTitle>
        <CardDescription className="text-[#64748B]">
          Link your personal or business phone to Blu_bot by scanning a QR code.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">

        {/* ── DISCONNECTED ── */}
        {status === 'disconnected' && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Button
              onClick={handleConnect}
              disabled={loading || cooldownSec > 0}
              className="bg-[#4F6EF7] hover:bg-[#3D5FE6] text-white w-full sm:w-auto disabled:opacity-50"
            >
              {loading
                ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Starting…</>
                : cooldownSec > 0
                  ? <><RefreshCw className="w-4 h-4 mr-2" />Wait {cooldownSec}s…</>
                  : <><QrCode className="w-4 h-4 mr-2" />Generate QR Code</>
              }
            </Button>
            <p className="text-xs text-[#64748B]">
              Chrome will launch in the background — first start may take up to 60 seconds.
            </p>
          </div>
        )}

        {/* ── QR PENDING ── */}
        {status === 'qr_pending' && (
          <div className="flex flex-col items-center space-y-4">
            {qrCode ? (
              /* QR ready */
              <div className="bg-white rounded-2xl p-5 shadow-lg">
                <QRCodeSVG value={qrCode} size={220} />
              </div>
            ) : (
              /* Waiting for QR */
              <div className="flex flex-col items-center justify-center gap-4 py-6 w-full">
                {/* Spinner + message */}
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#4F6EF7]" />
                  <span className="text-sm text-[#94A3B8]">{loadingMessage}</span>
                </div>

                {/* Progress bar */}
                <div className="w-full max-w-sm">
                  <div className="w-full h-1.5 bg-[#1E2340] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#4F6EF7] rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-[#3A4060]">{waitSeconds}s elapsed</span>
                    <span className="text-[10px] text-[#3A4060]">up to 90s</span>
                  </div>
                </div>

                {/* Slow hint */}
                {isSlow && (
                  <p className="text-xs text-[#64748B] text-center max-w-xs">
                    ⏳ Chrome is initializing for the first time. This only happens once — future connections will be instant.
                  </p>
                )}
              </div>
            )}

            {/* Instructions */}
            {qrCode && (
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-[#E2E8F0]">Scan this QR code</p>
                <p className="text-xs text-[#64748B]">
                  Open WhatsApp → Menu → Linked Devices → Link a Device
                </p>
              </div>
            )}

            {/* Cancel button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { stopPolling(); setStatus('disconnected'); setQrCode(null); setElapsedMs(0); }}
              className="text-[#64748B] hover:text-white"
            >
              Cancel
            </Button>
          </div>
        )}

        {/* ── CONNECTED ── */}
        {status === 'connected' && (
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 border border-[#22D3A0]/20 bg-[#22D3A0]/5 rounded-xl gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#22D3A0]/10 flex items-center justify-center">
                <Phone className="w-5 h-5 text-[#22D3A0]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-[#22D3A0]" />
                  Device Linked Successfully
                </p>
                <p className="text-xs font-mono text-[#22D3A0]">{phoneNumber || 'Connected'}</p>
              </div>
            </div>
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading
                ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                : <Unplug className="w-4 h-4 mr-2" />
              }
              Disconnect
            </Button>
          </div>
        )}

        {/* ── ERROR ── */}
        {status === 'error' && (
          <div className="flex flex-col items-center gap-4 p-5 border border-[#FF4D6D]/20 bg-[#FF4D6D]/5 rounded-xl text-center">
            <AlertCircle className="w-8 h-8 text-[#FF4D6D]" />
            <div>
              <p className="text-sm font-semibold text-white">Connection Failed</p>
              <p className="text-xs text-[#64748B] mt-1 max-w-xs">{errorMsg}</p>
            </div>
            <Button
              onClick={handleRetry}
              className="bg-[#4F6EF7] hover:bg-[#3D5FE6] text-white"
            >
              Try Again
            </Button>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
