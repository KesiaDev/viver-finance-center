import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hubla-signature',
};

interface HublaPayload {
  type: string;
  version: string;
  event: {
    product?: {
      id: string;
      name: string;
    };
    products?: Array<{
      id: string;
      name: string;
      offers?: Array<{
        id: string;
        name: string;
      }>;
    }>;
    smartInstallment?: {
      id: string;
      subscriptionId: string;
      sourceInvoiceId: string;
      sellerId: string;
      payerId: string;
      installment: number;
      installments: number;
      paymentMethod: string;
      type: string;
      status: string;
      statusAt: Array<{
        status: string;
        when: string;
      }>;
      amount: {
        totalCents: number;
      };
      modifiedAt: string;
      createdAt: string;
      version: number;
    };
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      document: string;
      email: string;
      phone: string;
    };
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate HTTP method
    if (req.method !== 'POST') {
      console.log('Method not allowed:', req.method);
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate signature
    const signature = req.headers.get('X-Hubla-Signature') || req.headers.get('x-hubla-signature');
    const webhookSecret = Deno.env.get('HUBLA_WEBHOOK_SECRET');

    if (!webhookSecret) {
      console.error('HUBLA_WEBHOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!signature || signature !== webhookSecret) {
      console.log('Unauthorized: Invalid signature');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse payload
    const payload: HublaPayload = await req.json();
    console.log('Received webhook event:', payload.type);

    // Extract data from payload
    const { type, event } = payload;
    const smartInstallment = event?.smartInstallment;
    const user = event?.user;
    const product = event?.product || event?.products?.[0];

    // Create Supabase client with service role key (bypass RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build event record
    const eventRecord = {
      event_type: type,
      smart_installment_id: smartInstallment?.id || null,
      subscription_id: smartInstallment?.subscriptionId || null,
      source_invoice_id: smartInstallment?.sourceInvoiceId || null,
      seller_id: smartInstallment?.sellerId || null,
      payer_id: user?.id || smartInstallment?.payerId || null,
      payer_email: user?.email || null,
      payer_name: user ? `${user.firstName} ${user.lastName}`.trim() : null,
      payer_document: user?.document || null,
      payer_phone: user?.phone || null,
      status: smartInstallment?.status || null,
      amount_cents: smartInstallment?.amount?.totalCents || null,
      installment: smartInstallment?.installment || null,
      total_installments: smartInstallment?.installments || null,
      payment_method: smartInstallment?.paymentMethod || null,
      product_id: product?.id || null,
      product_name: product?.name || null,
      payload: payload,
      processed: false,
    };

    // Insert event into database (upsert to handle duplicates)
    const { data, error } = await supabase
      .from('hubla_webhook_events')
      .upsert(eventRecord, {
        onConflict: 'smart_installment_id,event_type,status',
        ignoreDuplicates: true
      })
      .select()
      .single();

    if (error) {
      // Check if it's a duplicate constraint violation (which is okay)
      if (error.code === '23505') {
        console.log('Duplicate event ignored:', smartInstallment?.id);
        return new Response(
          JSON.stringify({ success: true, message: 'Event already processed' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.error('Error inserting event:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to process event' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Event stored successfully:', data?.id);

    return new Response(
      JSON.stringify({ success: true, event_id: data?.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
