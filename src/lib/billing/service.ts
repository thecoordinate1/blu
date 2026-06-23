import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';

export type PaymentMethod = 'mtn' | 'airtel' | 'zamtel' | 'card';

export interface CheckoutRequestPayload {
  businessId: string;
  amount: number;
  currency?: string;
  paymentMethod: PaymentMethod;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
}

export class BillingService {
  private apiKey: string;
  private baseUrl = 'https://api.lenco.co/access/v2'; // Assuming Lenco v2 API

  constructor() {
    const key = process.env.LENCO_API_KEY;
    if (!key) {
      console.warn('LENCO_API_KEY is not set. Billing service may fail.');
    }
    this.apiKey = key || '';
  }

  /**
   * Initiates a checkout request with Lenco
   */
  async createCheckoutRequest(payload: CheckoutRequestPayload) {
    const reference = `blu_${crypto.randomUUID()}`;
    const currency = payload.currency || 'ZMW';

    // 1. Create a pending payment record in Supabase
    const { data: payment, error: dbError } = await supabaseAdmin
      .from('payments')
      .insert({
        business_id: payload.businessId,
        amount: payload.amount,
        currency: currency,
        status: 'pending',
        provider: 'lenco',
        payment_method: payload.paymentMethod,
        reference: reference
      })
      .select('id, reference')
      .single();

    if (dbError) {
      console.error('[BillingService] Failed to create payment record:', dbError);
      throw new Error('Database error while creating payment record');
    }

    // 2. Send checkout request to Lenco API
    try {
      const response = await fetch(`${this.baseUrl}/checkouts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: payload.amount,
          currency: currency,
          reference: reference,
          paymentMethod: payload.paymentMethod,
          customerEmail: payload.customerEmail,
          customerPhone: payload.customerPhone,
          customerName: payload.customerName,
          // Example webhook URL, assuming a route exists or will be created
          webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhook/lenco`
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('[BillingService] Lenco API Error:', errorData);
        throw new Error(`Lenco API error: ${response.status} ${response.statusText}`);
      }

      const lencoData = await response.json();
      return {
        success: true,
        paymentId: payment.id,
        reference: reference,
        checkoutUrl: lencoData.data?.checkoutUrl, // if applicable
        providerResponse: lencoData
      };
    } catch (error) {
      console.error('[BillingService] Checkout request failed:', error);
      
      // Update payment to failed status if API call failed
      await supabaseAdmin
        .from('payments')
        .update({ status: 'failed' })
        .eq('reference', reference);
        
      throw error;
    }
  }

  /**
   * Verifies a transaction status
   */
  async verifyTransaction(reference: string) {
    try {
      const response = await fetch(`${this.baseUrl}/transactions/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Lenco verification error: ${response.status}`);
      }

      const data = await response.json();
      
      // Update database status based on verification result
      const newStatus = data.data?.status === 'successful' ? 'successful' : 
                        data.data?.status === 'failed' ? 'failed' : 'pending';

      await supabaseAdmin
        .from('payments')
        .update({ status: newStatus })
        .eq('reference', reference);

      return data;
    } catch (error) {
      console.error('[BillingService] Verification failed:', error);
      throw error;
    }
  }
}

export const billingService = new BillingService();
