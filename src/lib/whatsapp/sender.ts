export class WhatsAppSender {
  private apiToken: string | null = null;
  private fromNumber: string | null = null;
  private initialized = false;

  /** Lazily initialize credentials — avoids crashing at import time if env vars are missing */
  private init(): boolean {
    if (this.initialized) return !!(this.apiToken && this.fromNumber);

    this.initialized = true;
    this.apiToken = process.env.WHATSAPP_API_TOKEN || null;
    this.fromNumber = process.env.WHATSAPP_FROM_NUMBER || null;

    if (!this.apiToken || !this.fromNumber) {
      console.warn(
        '[WhatsAppSender] Missing WHATSAPP_API_TOKEN or WHATSAPP_FROM_NUMBER. ' +
        'WhatsApp messaging will be unavailable until these are configured.'
      );
      return false;
    }
    return true;
  }

  async send(to: string, message: string) {
    if (!this.init()) {
      console.warn('[WhatsAppSender] Cannot send — credentials not configured.');
      return null;
    }

    const url = `https://graph.facebook.com/v19.0/${this.fromNumber}/messages`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: message },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Failed to send WhatsApp message:', errorData);
      throw new Error(`WhatsApp API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }
}

export const whatsappSender = new WhatsAppSender();
