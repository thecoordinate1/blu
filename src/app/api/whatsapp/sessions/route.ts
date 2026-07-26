import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// POST: Save and verify WhatsApp Cloud API credentials
export async function POST(req: NextRequest) {
  try {
    const { businessId, phoneNumberId, accessToken, wabaId } = await req.json();

    if (!businessId || !phoneNumberId || !accessToken) {
      return NextResponse.json(
        { success: false, error: 'businessId, phoneNumberId, and accessToken are required' },
        { status: 400 }
      );
    }

    // 1. Verify with Meta Graph API
    let verifiedName: string | null = null;
    let displayPhone: string | null = null;
    let isValid = false;

    try {
      const graphRes = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (graphRes.ok) {
        const metaData = await graphRes.json();
        verifiedName = metaData.verified_name || metaData.display_phone_number || null;
        displayPhone = metaData.display_phone_number || phoneNumberId;
        isValid = true;
      }
    } catch (graphErr) {
      console.warn('Meta Graph API check warning:', graphErr);
    }

    // 2. Save credentials in Supabase
    const { error: dbErr } = await supabase
      .from('whatsapp_sessions')
      .upsert({
        business_id: businessId,
        provider: 'cloud_api',
        wa_phone_number_id: phoneNumberId,
        wa_access_token: accessToken,
        wa_business_account_id: wabaId || null,
        phone_number: displayPhone || phoneNumberId,
        status: isValid ? 'connected' : 'configured',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'business_id' });

    if (dbErr) {
      return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      status: isValid ? 'connected' : 'configured',
      verifiedName,
      displayPhone,
      message: 'Cloud API credentials saved successfully',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// GET: Fetch status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ success: false, error: 'businessId is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('business_id', businessId)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ success: true, status: 'disconnected' });
    }

    return NextResponse.json({
      success: true,
      status: data.status || 'configured',
      phoneNumberId: (data as any).wa_phone_number_id,
      phoneNumber: (data as any).phone_number,
      wabaId: (data as any).wa_business_account_id,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE: Disconnect
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ success: false, error: 'businessId is required' }, { status: 400 });
    }

    await supabase
      .from('whatsapp_sessions')
      .update({
        status: 'disconnected',
        wa_access_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq('business_id', businessId);

    return NextResponse.json({ success: true, message: 'Session disconnected' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
