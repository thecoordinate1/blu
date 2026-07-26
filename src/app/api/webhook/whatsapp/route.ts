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
    if (!payload.entry?.[0]?.changes?.[0]?.value) {
      return NextResponse.json({ ok: true });
    }

    const change = payload.entry[0].changes[0].value;
    const message = change.messages?.[0];
    
    if (!message) return NextResponse.json({ ok: true });

    const from = message.from;
    const body = message.text?.body;

    if (!body) return NextResponse.json({ ok: true });

    // 2. Identify business by the phone_number_id from the webhook metadata
    const phoneNumberId = change.metadata?.phone_number_id;
    console.log(`[WhatsApp Webhook] Received from ${from} on phone_number_id ${phoneNumberId}: ${body}`);

    let businessId: string | null = null;

    if (phoneNumberId) {
      // Look up which business owns this phone number ID
      const { data: session } = await supabaseAdmin
        .from('whatsapp_sessions')
        .select('business_id')
        .eq('wa_phone_number_id', phoneNumberId)
        .maybeSingle();
      
      if (session) {
        businessId = session.business_id;
      }
    }

    // Fallback: if no match found by phone_number_id, use first available business
    if (!businessId) {
      const { data: firstBusiness } = await supabaseAdmin
        .from('businesses')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      if (firstBusiness) {
        businessId = firstBusiness.id;
      } else {
        console.warn('[WhatsApp Webhook] No business found for incoming message');
        return NextResponse.json({ ok: true });
      }
    }

    // 3. Trigger Agent Pipeline Asynchronously
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
    // 1. Get or create conversation for this customer number
    let conversationId: string | null = null;
    const { data: existingConvo } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('business_id', businessId)
      .eq('customer_number', from)
      .maybeSingle();

    if (existingConvo) {
      conversationId = existingConvo.id;
    } else {
      const { data: newConvo, error: createConvoErr } = await supabaseAdmin
        .from('conversations')
        .insert({
          business_id: businessId,
          customer_number: from,
          status: 'active'
        })
        .select('id')
        .single();
      
      if (newConvo) {
        conversationId = newConvo.id;
      } else {
        console.error('[Agent Pipeline] Failed to create conversation in Supabase:', createConvoErr);
      }
    }

    // 2. Fetch conversation history for AI context
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

      // Save inbound customer message
      await supabaseAdmin
        .from('messages')
        .insert({
          conversation_id: conversationId,
          business_id: businessId,
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
             business_id: businessId,
             role: 'system',
             content: `Conversation escalated: ${detection.escalateReason}`
           });

         // Log escalation action
         await supabaseAdmin
           .from('agent_actions')
           .insert({
             conversation_id: conversationId,
             business_id: businessId,
             action_type: 'escalation',
             payload: { reason: detection.escalateReason },
             status: 'success'
           });
       }
       return;
    }

    // B. Generate AI Response (with retry on transient 503)
    let businessName = 'Blu Business';
    let businessContext = '';
    
    const { data: busProfile } = await supabaseAdmin
      .from('businesses')
      .select('name')
      .eq('id', businessId)
      .maybeSingle();

    if (busProfile?.name) {
      businessName = busProfile.name;
    }

    const { data: products } = await supabaseAdmin
      .from('products')
      .select('name, sku, category, price, stock')
      .eq('business_id', businessId);

    if (products && products.length > 0) {
      businessContext = 'Available Products & Stock:\n' + products.map(p => 
        `- ${p.name} (SKU: ${p.sku}, Category: ${p.category}): K ${p.price} | Stock: ${p.stock > 0 ? `${p.stock} units` : 'Out of Stock'}`
      ).join('\n');
    }

    let response: { reply: string } | null = null;
    try {
      response = await aiAgentAutomaticResponse({ 
        customerMessage: body,
        conversationHistory: conversationHistory,
        businessName,
        businessContext
      });
    } catch (err: any) {
      console.warn('[Agent Pipeline] AI response failed (attempt 1), retrying in 3s...', err?.originalMessage || err?.message);
      await new Promise(r => setTimeout(r, 3000));
      try {
        response = await aiAgentAutomaticResponse({ 
          customerMessage: body,
          conversationHistory: conversationHistory,
          businessName,
          businessContext
        });
      } catch (retryErr: any) {
        console.warn('[Agent Pipeline] AI response failed after retry — using fallback reply.', retryErr?.originalMessage || retryErr?.message);
        response = { reply: `Thanks for reaching out to ${businessName}! I'm experiencing high demand right now. A team member will follow up with you shortly.` };
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
          business_id: businessId,
          role: 'agent',
          content: response.reply
        });

      // Log auto-reply action
      await supabaseAdmin
        .from('agent_actions')
        .insert({
          conversation_id: conversationId,
          business_id: businessId,
          action_type: 'auto_reply',
          payload: { reply: response.reply },
          status: 'success'
        });
    }

    // C. Send WhatsApp Message via Cloud API
    await whatsappSender.send(from, response.reply, businessId);
  } catch (err) {
    console.error('[Agent Pipeline] Async processing failed:', err);
  }
}
