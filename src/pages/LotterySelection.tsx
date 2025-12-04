import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const LotterySelection = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [numbers, setNumbers] = useState<string[]>([]);
  const [selectedBunch, setSelectedBunch] = useState(5);
  const [visibleCount, setVisibleCount] = useState(18);
  const [lottery, setLottery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    fetchLottery();
  }, [id]);

  const calculateCountdown = useCallback(() => {
    if (!lottery) return;
    
    const now = new Date().getTime();
    const drawDate = new Date(lottery.draw_date).getTime();
    const distance = drawDate - now;

    if (distance < 0) {
      setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    setCountdown({ days, hours, minutes, seconds });
  }, [lottery]);

  useEffect(() => {
    if (!lottery) return;
    
    calculateCountdown();
    const timer = setInterval(calculateCountdown, 1000);
    
    return () => clearInterval(timer);
  }, [lottery, calculateCountdown]);

  const fetchLottery = async () => {
    if (!id) return;
    
    const { data, error } = await supabase
      .from('lotteries')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      toast({
        title: "Error",
        description: "Lottery not found",
        variant: "destructive"
      });
      navigate("/lotteries");
      return;
    }
    
    setLottery(data);
    
    // Fetch already booked tickets for this lottery
    const { data: bookedTickets } = await supabase
      .from('booked_tickets')
      .select('ticket_number')
      .eq('draw_date', data.draw_date);
    
    const bookedNumbers = new Set(bookedTickets?.map(t => t.ticket_number) || []);
    
    // Generate unique ticket numbers that aren't already booked
    const prefix = `${Math.floor(Math.random() * 50)}-${new Date(data.draw_date).getFullYear().toString().slice(-2)}`;
    const startNum = Math.floor(Math.random() * 5000) + 1000;
    const numberArray: string[] = [];
    
    for (let i = 0; numberArray.length < 100; i++) {
      const num = startNum + i;
      const ticketNum = `${prefix}/${num}`;
      if (!bookedNumbers.has(ticketNum)) {
        numberArray.push(ticketNum);
      }
    }
    
    setNumbers(numberArray);
    setLoading(false);
  };

  const toggleNumber = (number: string) => {
    if (selectedNumbers.length >= selectedBunch && !selectedNumbers.includes(number)) {
      toast({
        title: "Limit Reached",
        description: `You can only select ${selectedBunch} tickets at a time`,
        variant: "destructive",
      });
      return;
    }
    setSelectedNumbers((prev) =>
      prev.includes(number) ? prev.filter((n) => n !== number) : [...prev, number]
    );
  };

  const selectRandomBunch = () => {
    // Clear current selection
    setSelectedNumbers([]);
    
    // Get random tickets based on selected bunch size
    const availableNumbers = [...numbers];
    const randomSelection: string[] = [];
    
    for (let i = 0; i < selectedBunch && availableNumbers.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * availableNumbers.length);
      randomSelection.push(availableNumbers[randomIndex]);
      availableNumbers.splice(randomIndex, 1);
    }
    
    setSelectedNumbers(randomSelection);
    
    toast({
      title: "Tickets Selected",
      description: `${randomSelection.length} ticket(s) randomly selected`,
    });
  };

  const handleAddToCart = async () => {
    if (selectedNumbers.length === 0) {
      toast({
        title: "No tickets selected",
        description: "Please select at least one ticket",
        variant: "destructive",
      });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Login Required",
        description: "Please login to add items to cart",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }

    // Save to database cart_items
    const { error } = await supabase
      .from('cart_items')
      .insert([{
        user_id: session.user.id,
        lottery_id: lottery.id,
        ticket_numbers: selectedNumbers,
        draw_dates: [lottery.draw_date]
      }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add to cart",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Added to Cart",
      description: `${selectedNumbers.length} ticket(s) added to cart`,
    });

    setSelectedNumbers([]);
  };

  const handleBuyNow = async () => {
    if (selectedNumbers.length === 0) {
      toast({
        title: "No tickets selected",
        description: "Please select at least one ticket",
        variant: "destructive",
      });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Login Required",
        description: "Please login to purchase tickets",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }

    // Save to database and redirect
    const { error } = await supabase
      .from('cart_items')
      .insert([{
        user_id: session.user.id,
        lottery_id: lottery.id,
        ticket_numbers: selectedNumbers,
        draw_dates: [lottery.draw_date]
      }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to proceed",
        variant: "destructive"
      });
      return;
    }

    navigate("/cart");
  };

  const displayedNumbers = numbers.slice(0, visibleCount);

  const handleShowMore = () => {
    setVisibleCount(prev => Math.min(prev + 20, numbers.length));
  };

  const handleShowLess = () => {
    setVisibleCount(prev => Math.max(prev - 20, 18));
  };

  if (loading || !lottery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading lottery details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8 md:pb-12">
      <div className="bg-card border-b border-border shadow-sm p-6">
        <div className="container mx-auto px-6 md:px-8 lg:px-12">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => navigate("/dashboard")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium">
                Sale closes in
              </div>
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center font-bold">
                    {countdown.days}
                  </div>
                </div>
                <span className="font-bold">:</span>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center font-bold">
                    {countdown.hours}
                  </div>
                </div>
                <span className="font-bold">:</span>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center font-bold">
                    {countdown.minutes}
                  </div>
                </div>
                <span className="font-bold">:</span>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center font-bold">
                    {countdown.seconds}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 px-6 md:px-8 lg:px-0">
            <div>
              <h1 className="text-2xl font-bold mb-2">{lottery.name}</h1>
              <div className="flex items-center gap-6 text-sm">
                <div>Ticket Price ₹{lottery.ticket_price}</div>
                <div className="h-8 w-px bg-border" />
                <div>Draw Date : {new Date(lottery.draw_date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                <div className="h-8 w-px bg-border" />
                <div>Prize : ₹{lottery.prize >= 10000000 
                  ? `${(lottery.prize / 10000000).toFixed(1)} Crore` 
                  : lottery.prize >= 100000 
                  ? `${(lottery.prize / 100000).toFixed(1)} Lakh` 
                  : lottery.prize.toFixed(0)}</div>
              </div>
            </div>

            {/* Select Bunch */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold">Select Bunch</h2>
                <Button
                  onClick={selectRandomBunch}
                  variant="secondary"
                  className="rounded-full px-6"
                >
                  Auto Select {selectedBunch} Tickets
                </Button>
              </div>
              <div className="flex gap-3 flex-wrap">
                {[1, 5, 10, 25, 50, 100].map((bunch) => (
                  <Button
                    key={bunch}
                    variant={selectedBunch === bunch ? "default" : "outline"}
                    onClick={() => setSelectedBunch(bunch)}
                    className="rounded-full px-8"
                  >
                    {bunch}
                  </Button>
                ))}
              </div>
            </div>

            {/* Select Ticket Number */}
            <div>
              <h2 className="text-xl font-semibold mb-3">Select Ticket Number</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-3">
                {displayedNumbers.map((number) => {
                  const isSelected = selectedNumbers.includes(number);
                  return (
                    <Button
                      key={number}
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => toggleNumber(number)}
                      className="rounded-full h-12"
                    >
                      {number}
                    </Button>
                  );
                })}
              </div>
              <div className="flex justify-center gap-4 mt-4">
                {visibleCount > 18 && (
                  <Button
                    variant="ghost"
                    onClick={handleShowLess}
                    className="gap-2"
                  >
                    <ChevronUp className="h-4 w-4" /> Less
                  </Button>
                )}
                {visibleCount < numbers.length && (
                  <Button
                    variant="ghost"
                    onClick={handleShowMore}
                    className="gap-2"
                  >
                    More <ChevronDown className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center py-6">
              <Button
                variant="secondary"
                onClick={handleAddToCart}
                className="rounded-full px-8 gap-2"
                size="lg"
              >
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </Button>
              <Button
                onClick={handleBuyNow}
                className="rounded-full px-8"
                size="lg"
                disabled={selectedNumbers.length === 0}
              >
                Buy
              </Button>
            </div>

            {/* Note */}
            <div className="border-t border-border pt-4">
              <h3 className="font-semibold mb-2">NOTE:</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>*Book of same number</p>
                <p>#You can write your choice digit an explanation remark box be will try to fulfil</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LotterySelection;
