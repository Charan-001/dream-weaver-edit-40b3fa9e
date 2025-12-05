import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  cartItems: {
    lottery_id: string;
    ticket_numbers: string[];
    draw_dates: string[];
    lotteries: {
      name: string;
      ticket_price: number;
      draw_date: string;
    };
  }[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing payment for user:', user.id);

    // Fetch cart items from database to verify they belong to the user
    const { data: cartItems, error: cartError } = await supabaseClient
      .from('cart_items')
      .select('*, lotteries(*)')
      .eq('user_id', user.id);

    if (cartError || !cartItems || cartItems.length === 0) {
      console.error('Cart error or empty:', cartError);
      return new Response(
        JSON.stringify({ error: 'Cart is empty or not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Cart items found:', cartItems.length);

    // Process orders - generate server-side transaction ID
    const orderIds: string[] = [];

    for (const cartItem of cartItems) {
      const lottery = cartItem.lotteries;
      if (!lottery) {
        console.warn('Skipping cart item without lottery:', cartItem.id);
        continue;
      }

      // For each ticket number and draw date combination
      for (const ticketNumber of cartItem.ticket_numbers) {
        for (const drawDate of cartItem.draw_dates) {
          // Generate secure server-side transaction ID
          const transactionId = `TXN${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
          
          console.log('Creating order for ticket:', ticketNumber, 'transaction:', transactionId);

          // Create order
          const { data: order, error: orderError } = await supabaseClient
            .from('orders')
            .insert([{
              user_id: user.id,
              lottery_id: cartItem.lottery_id,
              lottery_name: lottery.name,
              ticket_price: lottery.ticket_price,
              draw_time: drawDate,
              transaction_id: transactionId,
              status: 'confirmed'
            }])
            .select()
            .single();

          if (orderError || !order) {
            console.error('Order creation failed:', orderError);
            return new Response(
              JSON.stringify({ error: 'Failed to create order' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          orderIds.push(order.id);

          // Create booked ticket
          const { error: ticketError } = await supabaseClient
            .from('booked_tickets')
            .insert([{
              user_id: user.id,
              order_id: order.id,
              ticket_number: ticketNumber,
              draw_date: lottery.draw_date
            }]);

          if (ticketError) {
            console.error('Ticket booking failed:', ticketError);
            return new Response(
              JSON.stringify({ error: 'Failed to book ticket' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      }
    }

    // Clear cart
    const { error: deleteError } = await supabaseClient
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.warn('Failed to clear cart:', deleteError);
    }

    console.log('Payment processed successfully. Orders:', orderIds.length);

    return new Response(
      JSON.stringify({ 
        success: true, 
        orderIds,
        message: 'Payment processed successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Payment processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
