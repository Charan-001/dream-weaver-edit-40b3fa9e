import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";

interface CartItem {
  drawDate: string;
  lotteryName: string;
  ticketNumber: string;
  quantity: number;
  price: number;
}

const Cart = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItems(items);
  }, []);

  const removeItem = (index: number) => {
    const updatedCart = cartItems.filter((_, i) => i !== index);
    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    toast({
      title: "Item Removed",
      description: "Item removed from cart",
    });
  };

  const calculateSubTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
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
        <h1 className="text-3xl font-bold mb-8 text-center">My Cart ({cartItems.length})</h1>

        {cartItems.length > 0 ? (
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
                  {cartItems.map((item, index) => (
                    <div key={index} className="space-y-3">
                      <div className="grid grid-cols-5 gap-4 items-center">
                        <div className="border border-border rounded-full px-4 py-2 text-center text-sm">
                          {item.drawDate}
                        </div>
                        <div className="col-span-2">
                          <div className="text-xs text-muted-foreground mb-1">{item.lotteryName}</div>
                          <div className="border border-border rounded-full px-4 py-2 text-center font-semibold">
                            {item.ticketNumber}
                          </div>
                        </div>
                        <div className="border border-border rounded-full px-4 py-2 text-center font-semibold">
                          {item.quantity}
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-semibold">₹{item.price * item.quantity}</span>
                          <button
                            onClick={() => removeItem(index)}
                            className="w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
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
