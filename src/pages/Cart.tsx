import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

interface CartItem {
  id: string;
  lottery_id: string;
  ticket_numbers: string[];
  draw_dates: string[];
  lotteries?: {
    name: string;
    ticket_price: number;
    prize: number;
  };
}

const Cart = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data, error } = await supabase
      .from('cart_items')
      .select('*, lotteries(name, ticket_price, prize)')
      .eq('user_id', session.user.id);
    
    if (!error && data) {
      setCartItems(data);
    }
    setLoading(false);
  };

  const removeItem = async (itemId: string) => {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive"
      });
      return;
    }

    setCartItems(cartItems.filter(item => item.id !== itemId));
    toast({
      title: "Item Removed",
      description: "Item removed from cart",
    });
  };

  const calculateSubTotal = () => {
    return cartItems.reduce((total, item) => {
      const ticketCount = item.ticket_numbers.length * item.draw_dates.length;
      return total + (ticketCount * (item.lotteries?.ticket_price || 0));
    }, 0);
  };

  const handlePayNow = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to cart",
        variant: "destructive",
      });
      return;
    }

    // Redirect to payment page
    navigate("/payment");
  };

  const subTotal = calculateSubTotal();
  const deliveryCharges = 0;
  const discount = 0;
  const amountPayable = subTotal + deliveryCharges - discount;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 bg-card border-b border-border shadow-sm p-6 z-10">
        <div className="container mx-auto px-4 md:px-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-6 md:px-8 lg:px-12 py-8 md:py-12">
        <h1 className="text-3xl font-bold mb-8 text-center">
          My Cart ({cartItems.reduce((sum, item) => sum + item.ticket_numbers.length, 0)} tickets)
        </h1>

        {loading ? (
          <Card className="max-w-2xl mx-auto">
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading cart...</p>
            </div>
          </Card>
        ) : cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="grid grid-cols-5 gap-4 pb-4 border-b border-border font-semibold">
                    <div>Draw Date</div>
                    <div className="col-span-2">Ticket No.</div>
                    <div className="text-center">Qty.</div>
                    <div className="text-right">Amt.</div>
                  </div>

                  {/* Cart Items */}
                  {cartItems.map((item) => (
                    <div key={item.id} className="space-y-3 border-b border-border pb-4 last:border-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold">{item.lotteries?.name || 'Lottery'}</div>
                          <div className="text-xs text-muted-foreground">Prize: ₹{((item.lotteries?.prize || 0) / 100000).toFixed(1)}L</div>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      {item.ticket_numbers.map((ticketNum, idx) => (
                        <div key={idx} className="grid grid-cols-5 gap-4 items-center">
                          <div className="border border-border rounded-full px-4 py-2 text-center text-sm">
                            {item.draw_dates[0]}
                          </div>
                          <div className="col-span-2">
                            <div className="border border-border rounded-full px-4 py-2 text-center font-semibold">
                              {ticketNum}
                            </div>
                          </div>
                          <div className="border border-border rounded-full px-4 py-2 text-center font-semibold">
                            {item.draw_dates.length}
                          </div>
                          <div className="text-right font-semibold">
                            ₹{(item.lotteries?.ticket_price || 0) * item.draw_dates.length}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}

                  {/* Sub Total */}
                  <div className="flex justify-between items-center pt-4 border-t border-border font-semibold text-lg">
                    <span>Sub Total</span>
                    <span>₹{subTotal}</span>
                  </div>
                </div>
              </Card>

              {/* Note Section */}
              <div className="mt-6 text-sm text-muted-foreground">
                <h3 className="font-semibold text-foreground mb-2">NOTE:</h3>
                <div className="space-y-1">
                  <p>*Book of same number</p>
                  <p>#You can write your choice digit an explanation remark box be will try to fulfil</p>
                </div>
              </div>
            </div>

            {/* Price Summary */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-24">
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-border">
                    <span className="text-muted-foreground">Ticket Price</span>
                    <span className="font-semibold">₹{subTotal}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-border">
                    <span className="text-muted-foreground">Delivery Charges</span>
                    <span className="font-semibold">₹{deliveryCharges}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-border">
                    <span className="text-muted-foreground">Discount/Promo</span>
                    <span className="font-semibold">₹{discount}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold pt-2">
                    <span>Amount Payable</span>
                    <span>₹{amountPayable}</span>
                  </div>
                  <Button 
                    onClick={handlePayNow}
                    className="w-full bg-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/90 text-white rounded-full py-6 text-lg font-semibold"
                  >
                    Pay Now
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="max-w-2xl mx-auto">
            <div className="p-12 text-center">
              <p className="text-xl text-muted-foreground mb-4">Your cart is empty</p>
              <Button onClick={() => navigate("/dashboard")}>
                Browse Lotteries
              </Button>
            </div>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Cart;
