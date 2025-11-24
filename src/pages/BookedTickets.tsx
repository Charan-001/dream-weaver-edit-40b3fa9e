import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Footer from "@/components/Footer";

interface OrderDetails {
  lotteryName: string;
  lotteryPrice: number;
  drawTime: string;
  tickets: string[];
  total: number;
  date: string;
  transactionId: string;
}

const BookedTickets = () => {
  const navigate = useNavigate();
  const orderDetailsStr = localStorage.getItem("orderDetails");
  const orderDetails: OrderDetails[] = orderDetailsStr ? JSON.parse(orderDetailsStr) : [];

  // Flatten all tickets from all orders
  const allTickets = orderDetails.flatMap(order => 
    order.tickets.map(ticket => ({
      ticketNumber: ticket,
      lotteryName: order.lotteryName,
      price: order.lotteryPrice,
      drawTime: order.drawTime,
      purchaseDate: order.date,
      transactionId: order.transactionId
    }))
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 bg-card border-b border-border shadow-sm p-4 z-10">
        <div className="container mx-auto">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-6 md:px-8 lg:px-12 py-8 md:py-12">
        <h1 className="text-3xl font-bold mb-8 text-center">Your Booked Tickets</h1>

        <div className="max-w-6xl mx-auto">
          {allTickets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allTickets.map((ticket, index) => (
                <Card key={index} className="overflow-hidden border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg">
                  <div className="bg-gradient-to-r from-primary to-accent p-4">
                    <h3 className="text-white font-bold text-lg">{ticket.lotteryName}</h3>
                    <p className="text-white/90 text-sm">Draw: {ticket.drawTime}</p>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div className="text-center py-4 bg-muted/50 rounded-lg border-2 border-dashed border-border">
                      <p className="text-xs text-muted-foreground mb-1">Ticket Number</p>
                      <p className="text-3xl font-bold text-primary">{ticket.ticketNumber}</p>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Price:</span>
                        <span className="font-semibold">₹{ticket.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Purchase Date:</span>
                        <span className="font-semibold">{new Date(ticket.purchaseDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transaction ID:</span>
                        <span className="font-semibold text-xs">{ticket.transactionId.slice(0, 12)}...</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-xl text-muted-foreground">No tickets booked yet</p>
                <Button onClick={() => navigate("/dashboard")} className="mt-4">
                  Book Tickets
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BookedTickets;
