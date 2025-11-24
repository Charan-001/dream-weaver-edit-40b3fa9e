import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, CreditCard, Wallet, Building2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";

const Payment = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [isProcessing, setIsProcessing] = useState(false);

  const cartItems = JSON.parse(localStorage.getItem("cart") || "[]");
  const subTotal = cartItems.reduce((total: number, item: any) => total + (item.price * item.quantity), 0);
  const deliveryCharges = 0;
  const discount = 0;
  const amountPayable = subTotal + deliveryCharges - discount;

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Redirect to processing page after brief validation
    setTimeout(() => {
      navigate("/payment-processing");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 bg-card border-b border-border shadow-sm p-6 z-10">
        <div className="container mx-auto px-4 md:px-6">
          <Button variant="ghost" onClick={() => navigate("/cart")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </Button>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-6 md:px-8 lg:px-12 py-8 md:py-12">
        <h1 className="text-3xl font-bold mb-8 text-center">Complete Your Payment</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <Card className="p-6 md:p-8">
              <form onSubmit={handlePayment} className="space-y-6">
                {/* Payment Method Selection */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Select Payment Method</h2>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 border border-border rounded-lg p-4 hover:bg-accent cursor-pointer">
                        <RadioGroupItem value="upi" id="upi" />
                        <Label htmlFor="upi" className="flex items-center gap-3 cursor-pointer flex-1">
                          <Wallet className="h-5 w-5" />
                          <span className="font-medium">UPI</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 border border-border rounded-lg p-4 hover:bg-accent cursor-pointer">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="flex items-center gap-3 cursor-pointer flex-1">
                          <CreditCard className="h-5 w-5" />
                          <span className="font-medium">Credit/Debit Card</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 border border-border rounded-lg p-4 hover:bg-accent cursor-pointer">
                        <RadioGroupItem value="netbanking" id="netbanking" />
                        <Label htmlFor="netbanking" className="flex items-center gap-3 cursor-pointer flex-1">
                          <Building2 className="h-5 w-5" />
                          <span className="font-medium">Net Banking</span>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* UPI Payment */}
                {paymentMethod === "upi" && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="upi-id">Enter UPI ID</Label>
                      <Input
                        id="upi-id"
                        type="text"
                        placeholder="example@upi"
                        className="mt-2"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Card Payment */}
                {paymentMethod === "card" && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="card-number">Card Number</Label>
                      <Input
                        id="card-number"
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        className="mt-2"
                        maxLength={19}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="card-name">Cardholder Name</Label>
                      <Input
                        id="card-name"
                        type="text"
                        placeholder="John Doe"
                        className="mt-2"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiry">Expiry Date</Label>
                        <Input
                          id="expiry"
                          type="text"
                          placeholder="MM/YY"
                          className="mt-2"
                          maxLength={5}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          type="password"
                          placeholder="123"
                          className="mt-2"
                          maxLength={3}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Net Banking */}
                {paymentMethod === "netbanking" && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bank">Select Your Bank</Label>
                      <select
                        id="bank"
                        className="w-full mt-2 flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        required
                      >
                        <option value="">Choose Bank</option>
                        <option value="sbi">State Bank of India</option>
                        <option value="hdfc">HDFC Bank</option>
                        <option value="icici">ICICI Bank</option>
                        <option value="axis">Axis Bank</option>
                        <option value="pnb">Punjab National Bank</option>
                        <option value="kotak">Kotak Mahindra Bank</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                <div className="space-y-4 pt-6 border-t border-border">
                  <h3 className="text-lg font-semibold">Contact Information</h3>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      className="mt-2"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 1234567890"
                      className="mt-2"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/90 text-white rounded-full py-6 text-lg font-semibold"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Pay ₹{amountPayable}
                    </span>
                  )}
                </Button>
              </form>

              {/* Security Notice */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground text-center">
                  🔒 Your payment information is encrypted and secure
                </p>
              </div>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-border">
                  <span className="text-muted-foreground">Total Tickets</span>
                  <span className="font-semibold">{cartItems.length}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-border">
                  <span className="text-muted-foreground">Ticket Price</span>
                  <span className="font-semibold">₹{subTotal}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-border">
                  <span className="text-muted-foreground">Delivery Charges</span>
                  <span className="font-semibold text-green-600">FREE</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-border">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-semibold">₹{discount}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold pt-2">
                  <span>Total Amount</span>
                  <span className="text-2xl">₹{amountPayable}</span>
                </div>
              </div>

              {/* Tickets Preview */}
              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="font-semibold mb-3">Your Tickets</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {cartItems.slice(0, 5).map((item: any, index: number) => (
                    <div key={index} className="text-sm p-2 bg-muted/50 rounded">
                      <div className="font-medium">{item.ticketNumber}</div>
                      <div className="text-xs text-muted-foreground">{item.drawDate}</div>
                    </div>
                  ))}
                  {cartItems.length > 5 && (
                    <div className="text-sm text-muted-foreground text-center">
                      +{cartItems.length - 5} more tickets
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Payment;
