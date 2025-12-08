import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppRequest {
  userId: string;
  ticketDetails: {
    lotteryName: string;
    ticketNumbers: string[];
    drawDate: string;
    transactionId: string;
    ticketPrice: number;
    totalAmount: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      console.error('WhatsApp credentials not configured');
      return new Response(
        JSON.stringify({ error: 'WhatsApp not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, ticketDetails }: WhatsAppRequest = await req.json();

    console.log('Sending WhatsApp notification for user:', userId);

    // Fetch user profile to get phone number
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('phone, name')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile.phone) {
      console.error('User phone number not available');
      return new Response(
        JSON.stringify({ error: 'Phone number not available' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone number (remove any non-digit characters and ensure country code)
    let phoneNumber = profile.phone.replace(/\D/g, '');
    if (!phoneNumber.startsWith('91') && phoneNumber.length === 10) {
      phoneNumber = '91' + phoneNumber; // Add India country code
    }

    // Create message content
    const ticketNumbersList = ticketDetails.ticketNumbers.join(', ');
    const messageBody = `🎟️ *Lottery Ticket Confirmation*

Hello ${profile.name || 'Customer'}!

Your lottery ticket purchase has been confirmed.

📋 *Details:*
• Lottery: ${ticketDetails.lotteryName}
• Ticket Numbers: ${ticketNumbersList}
• Draw Date: ${ticketDetails.drawDate}
• Transaction ID: ${ticketDetails.transactionId}

💰 *Payment:*
• Price per Ticket: ₹${ticketDetails.ticketPrice}
• Total Amount: ₹${ticketDetails.totalAmount}

Good luck! 🍀

Thank you for choosing us.`;

    // Send WhatsApp message using Meta API
    const whatsappResponse = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phoneNumber,
          type: 'text',
          text: {
            preview_url: false,
            body: messageBody,
          },
        }),
      }
    );

    const whatsappResult = await whatsappResponse.json();

    if (!whatsappResponse.ok) {
      console.error('WhatsApp API error:', whatsappResult);
      return new Response(
        JSON.stringify({ error: 'Failed to send WhatsApp message', details: whatsappResult }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('WhatsApp message sent successfully:', whatsappResult);

    return new Response(
      JSON.stringify({ success: true, messageId: whatsappResult.messages?.[0]?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('WhatsApp notification error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
