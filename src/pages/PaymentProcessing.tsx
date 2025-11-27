import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PaymentProcessing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    processPayment();
  }, []);

  const processPayment = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    // Get cart items from database
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select('*, lotteries(*)')
      .eq('user_id', session.user.id);
    
    if (cartError || !cartItems || cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to cart",
        variant: "destructive"
      });
      navigate("/cart");
      return;
    }

    // Create orders and booked tickets
    try {
      for (const cartItem of cartItems) {
        const lottery = cartItem.lotteries;
        if (!lottery) continue;

        // For each ticket number and draw date combination
        for (const ticketNumber of cartItem.ticket_numbers) {
          for (const drawDate of cartItem.draw_dates) {
            // Create order
            const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 10000)}`;
            const { data: order, error: orderError } = await supabase
              .from('orders')
              .insert([{
                user_id: session.user.id,
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
              throw new Error('Failed to create order');
            }

            // Create booked ticket
            const { error: ticketError } = await supabase
              .from('booked_tickets')
              .insert([{
                user_id: session.user.id,
                order_id: order.id,
                ticket_number: ticketNumber,
                draw_date: lottery.draw_date
              }]);

            if (ticketError) {
              throw new Error('Failed to book ticket');
            }
          }
        }
      }

      // Clear cart
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', session.user.id);

      // Redirect to success
      setTimeout(() => {
        navigate("/payment-success", { replace: true });
      }, 2000);

    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
      navigate("/cart");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 md:p-12">
        <div className="text-center space-y-6">
          {/* Animated Loader */}
          <div className="flex justify-center">
            <div className="relative">
              <Loader2 className="w-20 h-20 text-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary/20 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Processing Messages */}
          <div className="space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Processing Payment
            </h2>
            <p className="text-muted-foreground text-lg">
              Please wait while we confirm your payment...
            </p>
          </div>

          {/* Progress Steps */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-3 text-left">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm text-muted-foreground">Verifying payment details</span>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse delay-100"></div>
              <span className="text-sm text-muted-foreground">Booking your tickets</span>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse delay-200"></div>
              <span className="text-sm text-muted-foreground">Generating confirmation</span>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-8 p-4 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              🔒 Do not refresh or close this page
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PaymentProcessing;
