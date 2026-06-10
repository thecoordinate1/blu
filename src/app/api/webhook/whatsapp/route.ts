import { NextRequest, NextResponse } from 'next/server';
import { aiAgentAutomaticResponse } from '@/ai/flows/ai-agent-automatic-response-flow';
import { escalationDetection } from '@/ai/flows/escalation-detection-flow';

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
    // In production, this would be a BullMQ push: await messageQueue.add('process', { ... })
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
    // A. Detect Escalation first
    const detection = await escalationDetection({ customerMessage: body });
    
    if (detection.escalate) {
       console.log(`[Agent Pipeline] ESCALATING session for ${from} due to ${detection.escalateReason}`);
       // Trigger owner notification here
       return;
    }

    // B. Generate AI Response
    const response = await aiAgentAutomaticResponse({ 
      customerMessage: body,
      conversationHistory: [] // Should be fetched from Supabase
    });

    console.log(`[Agent Pipeline] Generated response: ${response.reply}`);
    
    // C. Send WhatsApp Message
    // await whatsappSender.send(from, response.reply);
  } catch (err) {
    console.error('[Agent Pipeline] Async processing failed:', err);
  }
}
