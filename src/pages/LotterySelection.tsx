import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ShoppingCart, Info, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LotterySelection = () => {
  const { prizeType } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [numbers, setNumbers] = useState<string[]>([]);
  const [selectedBunch, setSelectedBunch] = useState(5);
  const [selectedDates, setSelectedDates] = useState<string[]>(["08/11/2025"]);
  const [showMoreNumbers, setShowMoreNumbers] = useState(false);

  useEffect(() => {
    // Generate ticket numbers based on lottery type
    let prefix = "15-19";
    let startNum = 2548;
    
    switch (prizeType) {
      case "10-evening":
        prefix = "10-19";
        startNum = 1000;
        break;
      case "50-weekly":
        prefix = "50-19";
        startNum = 5000;
        break;
      case "night-weekly":
        prefix = "20-19";
        startNum = 2000;
        break;
      default:
        prefix = "15-19";
        startNum = 2548;
    }
    
    const numberArray = Array.from({ length: 100 }, (_, i) => {
      const num = startNum + i;
      return `${prefix}/${num}`;
    });
    setNumbers(numberArray);
  }, [prizeType]);

  const generateDateOptions = () => {
    const dates = [];
    for (let i = 0; i < 9; i++) {
      const date = new Date(2025, 10, 8 + i); // Starting from 08/11/2025
      dates.push(date.toLocaleDateString('en-GB'));
    }
    return dates;
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

  const toggleDate = (date: string) => {
    setSelectedDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]
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

  const handleAddToCart = () => {
    if (selectedNumbers.length === 0) {
      toast({
        title: "No tickets selected",
        description: "Please select at least one ticket",
        variant: "destructive",
      });
      return;
    }

    // Add items to cart
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    selectedNumbers.forEach(number => {
      selectedDates.forEach(date => {
        cart.push({
          drawDate: date,
          lotteryName: `${lotteryDetails.name} (${lotteryDetails.time})`,
          ticketNumber: number,
          quantity: 1,
          price: lotteryDetails.price
        });
      });
    });
    localStorage.setItem("cart", JSON.stringify(cart));

    toast({
      title: "Added to Cart",
      description: `${selectedNumbers.length} ticket(s) added to cart`,
    });

    // Reset selected numbers after adding to cart
    setSelectedNumbers([]);
  };

  const handleBuyNow = () => {
    if (selectedNumbers.length === 0) {
      toast({
        title: "No tickets selected",
        description: "Please select at least one ticket",
        variant: "destructive",
      });
      return;
    }

    // Add items to cart and redirect
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    selectedNumbers.forEach(number => {
      selectedDates.forEach(date => {
        cart.push({
          drawDate: date,
          lotteryName: `${lotteryDetails.name} (${lotteryDetails.time})`,
          ticketNumber: number,
          quantity: 1,
          price: lotteryDetails.price
        });
      });
    });
    localStorage.setItem("cart", JSON.stringify(cart));

    navigate("/cart");
  };

  const displayedNumbers = showMoreNumbers ? numbers : numbers.slice(0, 18);
  const dateOptions = generateDateOptions();

  // Countdown timer (dummy values for now)
  const countdown = { days: 0, hours: 3, minutes: 52, seconds: 9 };

  const getLotteryDetails = () => {
    switch (prizeType) {
      case "10-evening":
        return { name: "DL 10 EVENING", price: 10, time: "5:40 PM" };
      case "50-weekly":
        return { name: "DL 50 WEEKLY", price: 50, time: "8:00 PM" };
      case "night-weekly":
        return { name: "DL 20 NIGHT WEEKLY", price: 20, time: "9:30 PM" };
      case "1-crore":
        return { name: "DL 1 CRORE BUMPER", price: 100, time: "12:00 PM" };
      case "50-lakh":
        return { name: "DL 50 LAKH SPECIAL", price: 50, time: "3:00 PM" };
      case "10-lakh":
        return { name: "DL 10 LAKH MONTHLY", price: 40, time: "6:00 PM" };
      default:
        return { name: "DL LOTTERY", price: 10, time: "5:40 PM" };
    }
  };

  const lotteryDetails = getLotteryDetails();

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
              <h1 className="text-2xl font-bold mb-2">{lotteryDetails.name}</h1>
              <div className="flex items-center gap-6 text-sm">
                <div>Ticket Price ₹{lotteryDetails.price}</div>
                <div className="h-8 w-px bg-border" />
                <div>Draw Date : 08/11/2025</div>
                <div className="h-8 w-px bg-border" />
                <div>Draw Time : {lotteryDetails.time}</div>
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
              {!showMoreNumbers && numbers.length > 18 && (
                <div className="flex justify-center mt-4">
                  <Button
                    variant="ghost"
                    onClick={() => setShowMoreNumbers(true)}
                    className="gap-2"
                  >
                    More <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Add Another Draw */}
            <div>
              <h2 className="text-xl font-semibold mb-3">Add Another Draw</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {dateOptions.map((date) => {
                  const isSelected = selectedDates.includes(date);
                  return (
                    <Button
                      key={date}
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => toggleDate(date)}
                      className="rounded-full h-12"
                    >
                      {date}
                    </Button>
                  );
                })}
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
