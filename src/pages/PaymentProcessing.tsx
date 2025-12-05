import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PaymentProcessing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    processPayment();
  }, []);

  const processPayment = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    try {
      // Call the server-side edge function to process payment securely
      const { data, error } = await supabase.functions.invoke('process-payment', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Payment error:', error);
        toast({
          title: "Payment Failed",
          description: error.message || "Something went wrong. Please try again.",
          variant: "destructive"
        });
        navigate("/cart");
        return;
      }

      if (!data?.success) {
        toast({
          title: "Payment Failed",
          description: data?.error || "Something went wrong. Please try again.",
          variant: "destructive"
        });
        navigate("/cart");
        return;
      }

      // Redirect to success with order IDs
      setTimeout(() => {
        navigate("/payment-success", { 
          replace: true,
          state: { orderIds: data.orderIds }
        });
      }, 1500);

    } catch (error) {
      console.error('Payment processing error:', error);
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
