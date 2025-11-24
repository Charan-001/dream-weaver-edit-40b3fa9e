import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Download, Home, Ticket } from "lucide-react";
import Footer from "@/components/Footer";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    // Get order details from localStorage
    const details = localStorage.getItem("lastOrder");
    if (details) {
      setOrderDetails(JSON.parse(details));
      // Clear the last order after retrieving
      localStorage.removeItem("lastOrder");
    } else {
      // If no order details, redirect to dashboard
      navigate("/dashboard");
    }
  }, [navigate]);

  if (!orderDetails) {
    return null;
  }

  const transactionId = `TXN${Date.now().toString().slice(-10)}`;
  const orderDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 container mx-auto px-6 md:px-8 lg:px-12 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Success Animation */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-4 animate-in zoom-in duration-500">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Payment Successful!
            </h1>
            <p className="text-muted-foreground text-lg">
              Your lottery tickets have been booked successfully
            </p>
          </div>

          {/* Order Details Card */}
          <Card className="p-6 md:p-8 mb-6">
            <div className="space-y-6">
              {/* Transaction Info */}
              <div className="pb-6 border-b border-border">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-mono font-semibold">{transactionId}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-muted-foreground">Order Date</span>
                  <span className="font-semibold">{orderDate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Payment Status</span>
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Completed
                  </span>
                </div>
              </div>

              {/* Amount Details */}
              <div className="pb-6 border-b border-border">
                <h3 className="font-semibold text-lg mb-4">Payment Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Tickets</span>
                    <span className="font-semibold">{orderDetails.ticketCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ticket Price</span>
                    <span className="font-semibold">₹{orderDetails.subTotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Processing Fee</span>
                    <span className="font-semibold text-green-600">FREE</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-border text-lg">
                    <span className="font-bold">Total Paid</span>
                    <span className="font-bold text-primary text-2xl">
                      ₹{orderDetails.amountPaid}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tickets Preview */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Your Tickets</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {orderDetails.tickets.slice(0, 10).map((ticket: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Ticket className="w-5 h-5 text-primary" />
                        <div>
                          <div className="font-mono font-semibold">{ticket.ticketNumber}</div>
                          <div className="text-xs text-muted-foreground">{ticket.drawDate}</div>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">₹{ticket.price}</span>
                    </div>
                  ))}
                  {orderDetails.tickets.length > 10 && (
                    <div className="text-sm text-muted-foreground text-center py-2">
                      +{orderDetails.tickets.length - 10} more tickets
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => navigate("/dashboard")}
              variant="outline"
              className="gap-2"
              size="lg"
            >
              <Home className="w-4 h-4" />
              Home
            </Button>
            <Button
              onClick={() => navigate("/booked-tickets")}
              className="gap-2"
              size="lg"
            >
              <Ticket className="w-4 h-4" />
              View Tickets
            </Button>
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="gap-2"
              size="lg"
            >
              <Download className="w-4 h-4" />
              Download Receipt
            </Button>
          </div>

          {/* Info Note */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              📧 A confirmation email with your ticket details has been sent to your registered email address.
              Please check your tickets in the "Booked Tickets" section.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PaymentSuccess;
