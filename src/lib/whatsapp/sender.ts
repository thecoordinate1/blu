export class WhatsAppSender {
  private apiToken: string;
  private fromNumber: string;

  constructor() {
    const token = process.env.WHATSAPP_API_TOKEN;
    const fromNumber = process.env.WHATSAPP_FROM_NUMBER;

    if (!token || !fromNumber) {
      throw new Error('Missing WHATSAPP_API_TOKEN or WHATSAPP_FROM_NUMBER environment variables.');
    }

    this.apiToken = token;
    this.fromNumber = fromNumber;
  }

  async send(to: string, message: string) {
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
