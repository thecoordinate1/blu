import { NextRequest, NextResponse } from 'next/server';
import { aiAgentAutomaticResponse } from '@/ai/flows/ai-agent-automatic-response-flow';
import { escalationDetection } from '@/ai/flows/escalation-detection-flow';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { whatsappSender } from '@/lib/whatsapp/sender';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    
    // 1. Validate Structure
    if (!payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      return NextResponse.json({ ok: true });
    }

    const message = payload.entry[0].changes[0].value.messages[0];
    const from = message.from;
    const body = message.text?.body;

    if (!body) return NextResponse.json({ ok: true });

    console.log(`[WhatsApp Webhook] Received from ${from}: ${body}`);

    // 2. Identify Tenant (Business) by the recipient number in metadata
    // For demo, we assume a static business ID
    const businessId = 'demo-business-id';

    // 3. Trigger Agent Pipeline Asynchronously (Simulated Queue)
    processMessageAsync(from, body, businessId);

    // 4. Respond Immediately
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[WhatsApp Webhook] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

async function processMessageAsync(from: string, body: string, businessId: string) {
  try {
    // 1. Get or create active business ID (checks if any exists, falls back cleanly)
    let activeBusinessId = businessId;
    const { data: existingBusiness } = await supabaseAdmin
      .from('businesses')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (existingBusiness) {
      activeBusinessId = existingBusiness.id;
    } else {
      // Attempt to auto-create demo business if a user exists in auth.users
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const firstUser = users?.users?.[0];
      if (firstUser) {
        const { data: newBus } = await supabaseAdmin
          .from('businesses')
          .insert({
            id: businessId,
            name: 'Demo Business',
            owner_id: firstUser.id,
            subscription_tier: 'free'
          })
          .select('id')
          .single();
        if (newBus) {
          activeBusinessId = newBus.id;
        }
      } else {
        console.warn('[Agent Pipeline] No auth users found. Please sign up a user first so business profile is created.');
      }
    }

    // 2. Get or create conversation for this customer number
    let conversationId: string | null = null;
    const { data: existingConvo } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('business_id', activeBusinessId)
      .eq('customer_number', from)
      .maybeSingle();

    if (existingConvo) {
      conversationId = existingConvo.id;
    } else {
      const { data: newConvo, error: createConvoErr } = await supabaseAdmin
        .from('conversations')
        .insert({
          business_id: activeBusinessId,
          customer_number: from,
          status: 'active'
        })
        .select('id')
        .single();
      
      if (newConvo) {
        conversationId = newConvo.id;
      } else {
        console.error('[Agent Pipeline] Failed to create conversation in Supabase:', createConvoErr);
        // Fallback to demo-id to continue processing in-memory if possible, but let's check
      }
    }

    // 3. Fetch conversation history for Genkit AI context
    let conversationHistory: Array<{ role: 'user' | 'agent' | 'system'; content: string }> = [];
    if (conversationId) {
      const { data: messages } = await supabaseAdmin
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(10);
      
      if (messages) {
        conversationHistory = messages.map(m => ({
          role: m.role as 'user' | 'agent' | 'system',
          content: m.content
        }));
      }

      // Save inbound customer message to Supabase
      await supabaseAdmin
        .from('messages')
        .insert({
          conversation_id: conversationId,
          business_id: activeBusinessId,
          role: 'user',
          content: body
        });
    }

    // A. Detect Escalation first (with retry on transient 503)
    let detection: Awaited<ReturnType<typeof escalationDetection>> | null = null;
    try {
      detection = await escalationDetection({ customerMessage: body });
    } catch (err: any) {
      console.warn('[Agent Pipeline] Escalation detection failed (attempt 1), retrying in 3s...', err?.originalMessage || err?.message);
      await new Promise(r => setTimeout(r, 3000));
      try {
        detection = await escalationDetection({ customerMessage: body });
      } catch (retryErr: any) {
        console.warn('[Agent Pipeline] Escalation detection failed after retry — skipping escalation check.', retryErr?.originalMessage || retryErr?.message);
      }
    }

    if (detection?.escalate) {
       console.log(`[Agent Pipeline] ESCALATING session for ${from} due to ${detection.escalateReason}`);
       if (conversationId) {
         await supabaseAdmin
           .from('conversations')
           .update({ 
             status: 'escalated',
             summary: detection.escalateReason 
           })
           .eq('id', conversationId);
         
         await supabaseAdmin
           .from('messages')
           .insert({
             conversation_id: conversationId,
             business_id: activeBusinessId,
             role: 'system',
             content: `Conversation escalated: ${detection.escalateReason}`
           });

         // Log escalation action
         await supabaseAdmin
           .from('agent_actions')
           .insert({
             conversation_id: conversationId,
             business_id: activeBusinessId,
             action_type: 'escalation',
             payload: { reason: detection.escalateReason },
             status: 'success'
           });
       }
       return;
    }

    // B. Generate AI Response (with retry on transient 503)
    let response: { reply: string } | null = null;
    try {
      response = await aiAgentAutomaticResponse({ 
        customerMessage: body,
        conversationHistory: conversationHistory
      });
    } catch (err: any) {
      console.warn('[Agent Pipeline] AI response failed (attempt 1), retrying in 3s...', err?.originalMessage || err?.message);
      await new Promise(r => setTimeout(r, 3000));
      try {
        response = await aiAgentAutomaticResponse({ 
          customerMessage: body,
          conversationHistory: conversationHistory
        });
      } catch (retryErr: any) {
        console.warn('[Agent Pipeline] AI response failed after retry — using fallback reply.', retryErr?.originalMessage || retryErr?.message);
        response = { reply: "Thanks for reaching out! I'm experiencing high demand right now. A team member will follow up with you shortly." };
      }
    }

    if (!response) return;

    console.log(`[Agent Pipeline] Generated response: ${response.reply}`);
    
    // Save generated AI response to Supabase
    if (conversationId) {
      await supabaseAdmin
        .from('messages')
        .insert({
          conversation_id: conversationId,
          business_id: activeBusinessId,
          role: 'agent',
          content: response.reply
        });

      // Log auto-reply action
      await supabaseAdmin
        .from('agent_actions')
        .insert({
          conversation_id: conversationId,
          business_id: activeBusinessId,
          action_type: 'auto_reply',
          payload: { reply: response.reply },
          status: 'success'
        });
    }

    // C. Send WhatsApp Message
    await whatsappSender.send(from, response.reply);
  } catch (err) {
    console.error('[Agent Pipeline] Async processing failed:', err);
  }
}
