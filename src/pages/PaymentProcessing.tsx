import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const PaymentProcessing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate payment processing
    const timer = setTimeout(() => {
      // Get cart items
      const cartItems = JSON.parse(localStorage.getItem("cart") || "[]");
      
      if (cartItems.length === 0) {
        navigate("/cart");
        return;
      }

      // Group cart items by lottery type
      const groupedOrders: { [key: string]: any[] } = {};
      cartItems.forEach((item: any) => {
        const key = `${item.lotteryName}_${item.drawTime}`;
        if (!groupedOrders[key]) {
          groupedOrders[key] = [];
        }
        groupedOrders[key].push(item);
      });

      // Create order details for each lottery type
      const existingOrders = JSON.parse(localStorage.getItem("orderDetails") || "[]");
      const newOrders = Object.values(groupedOrders).map((items) => {
        const firstItem = items[0];
        return {
          lotteryName: firstItem.lotteryName,
          lotteryPrice: firstItem.price,
          drawTime: firstItem.drawTime,
          tickets: items.map((item: any) => item.ticketNumber),
          total: items.reduce((sum: number, item: any) => sum + item.price, 0),
          date: new Date().toISOString(),
          transactionId: `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`
        };
      });

      // Append new orders to existing orders
      const allOrders = [...existingOrders, ...newOrders];
      localStorage.setItem("orderDetails", JSON.stringify(allOrders));

      // Save last order for success page
      const subTotal = cartItems.reduce((total: number, item: any) => total + item.price, 0);
      const lastOrderDetails = {
        tickets: cartItems,
        ticketCount: cartItems.length,
        subTotal: subTotal,
        amountPaid: subTotal,
        transactionId: newOrders[0].transactionId,
        date: new Date().toISOString()
      };
      localStorage.setItem("lastOrder", JSON.stringify(lastOrderDetails));

      // Clear cart
      localStorage.setItem("cart", "[]");

      // Redirect to success page
      navigate("/payment-success", { replace: true });
    }, 3000); // 3 seconds processing time

    return () => clearTimeout(timer);
  }, [navigate]);

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
