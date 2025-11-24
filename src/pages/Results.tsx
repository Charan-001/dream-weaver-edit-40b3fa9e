import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, CalendarIcon, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import Footer from "@/components/Footer";

const Results = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [results, setResults] = useState<any[]>([]);
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const [withdrawalData, setWithdrawalData] = useState({
    name: "",
    email: "",
    bankName: "",
    branch: "",
    accountNumber: "",
    ifscCode: "",
    panCard: "",
    aadharCard: "",
  });

  useEffect(() => {
    fetchResults();
    
    const channel = supabase
      .channel('results-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lottery_results' }, () => {
        fetchResults();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchResults = async () => {
    const { data, error } = await supabase
      .from('lottery_results')
      .select(`
        *,
        lotteries (
          name,
          lottery_type,
          first_prize,
          second_prize,
          third_prize,
          draw_date
        )
      `)
      .order('declared_at', { ascending: false });

    if (!error && data) {
      setResults(data);
    }
  };

  const bookedTickets = JSON.parse(localStorage.getItem("bookedTickets") || "[]");
  
  const checkWinningTickets = () => {
    const winningTickets: string[] = [];
    results.forEach(result => {
      if (bookedTickets.includes(result.first_prize_number)) winningTickets.push(result.first_prize_number);
      if (result.second_prize_number && bookedTickets.includes(result.second_prize_number)) winningTickets.push(result.second_prize_number);
      if (result.third_prize_number && bookedTickets.includes(result.third_prize_number)) winningTickets.push(result.third_prize_number);
    });
    return winningTickets;
  };

  const userWinningTickets = checkWinningTickets();
  const hasWon = userWinningTickets.length > 0;

  const handleWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !withdrawalData.name ||
      !withdrawalData.email ||
      !withdrawalData.bankName ||
      !withdrawalData.branch ||
      !withdrawalData.accountNumber ||
      !withdrawalData.ifscCode ||
      !withdrawalData.panCard ||
      !withdrawalData.aadharCard
    ) {
      toast({
        title: "Error",
        description: "Please fill all fields",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Withdrawal Request Submitted",
      description: "After verification, amount will be transferred to bank account under the terms and conditions",
      duration: 5000,
    });

    setTimeout(() => {
      navigate("/dashboard");
    }, 2000);
  };

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
        <h1 className="text-3xl font-bold mb-8 text-center">Lottery Results</h1>

        <div className="max-w-4xl mx-auto mb-8">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Select Draw Date
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-2">
                    Choose any date to view lottery results
                  </p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="max-w-6xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold text-center mb-6">Latest Lottery Results</h2>
          
          {results.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">No results declared yet</p>
              </CardContent>
            </Card>
          ) : (
            results.map((result) => (
              <Card key={result.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gradient-to-r from-primary/20 to-accent/20">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xl">{result.lotteries?.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Draw Date: {new Date(result.lotteries?.draw_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-muted-foreground">Type</p>
                      <p className="text-lg font-bold capitalize">{result.lotteries?.lottery_type}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 rounded-lg border border-yellow-500/20">
                      <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                      <p className="text-sm font-medium text-muted-foreground mb-1">First Prize</p>
                      <p className="text-2xl font-bold text-yellow-600 mb-2">{result.first_prize_number}</p>
                      <p className="text-lg font-semibold">₹{result.lotteries?.first_prize?.toLocaleString()}</p>
                    </div>

                    {result.second_prize_number && (
                      <div className="text-center p-4 bg-gradient-to-br from-gray-400/10 to-gray-500/10 rounded-lg border border-gray-400/20">
                        <Trophy className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm font-medium text-muted-foreground mb-1">Second Prize</p>
                        <p className="text-2xl font-bold text-gray-600 mb-2">{result.second_prize_number}</p>
                        <p className="text-lg font-semibold">₹{result.lotteries?.second_prize?.toLocaleString()}</p>
                      </div>
                    )}

                    {result.third_prize_number && (
                      <div className="text-center p-4 bg-gradient-to-br from-orange-600/10 to-orange-700/10 rounded-lg border border-orange-600/20">
                        <Trophy className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                        <p className="text-sm font-medium text-muted-foreground mb-1">Third Prize</p>
                        <p className="text-2xl font-bold text-orange-600 mb-2">{result.third_prize_number}</p>
                        <p className="text-lg font-semibold">₹{result.lotteries?.third_prize?.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Result declared on {new Date(result.declared_at).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {hasWon && (
          <div className="max-w-4xl mx-auto mt-12">
            <Card className="border-2 border-green-500">
              <CardHeader className="bg-gradient-to-r from-green-500/20 to-emerald-500/20">
                <CardTitle className="text-center text-2xl flex items-center justify-center gap-2">
                  <Trophy className="h-6 w-6" />
                  Congratulations! You Won!
                </CardTitle>
                <p className="text-center text-sm text-muted-foreground mt-2">
                  Winning Tickets: {userWinningTickets.join(", ")}
                </p>
              </CardHeader>
              <CardContent className="p-6">
                {!showWithdrawal ? (
                  <div className="text-center">
                    <p className="mb-4">Click below to submit your withdrawal request</p>
                    <Button onClick={() => setShowWithdrawal(true)} size="lg" className="w-full md:w-auto">
                      Claim Prize
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleWithdrawal} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={withdrawalData.name}
                          onChange={(e) => setWithdrawalData({ ...withdrawalData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={withdrawalData.email}
                          onChange={(e) => setWithdrawalData({ ...withdrawalData, email: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="bankName">Bank Name</Label>
                        <Input
                          id="bankName"
                          value={withdrawalData.bankName}
                          onChange={(e) => setWithdrawalData({ ...withdrawalData, bankName: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="branch">Branch</Label>
                        <Input
                          id="branch"
                          value={withdrawalData.branch}
                          onChange={(e) => setWithdrawalData({ ...withdrawalData, branch: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="accountNumber">Account Number</Label>
                        <Input
                          id="accountNumber"
                          value={withdrawalData.accountNumber}
                          onChange={(e) => setWithdrawalData({ ...withdrawalData, accountNumber: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="ifscCode">IFSC Code</Label>
                        <Input
                          id="ifscCode"
                          value={withdrawalData.ifscCode}
                          onChange={(e) => setWithdrawalData({ ...withdrawalData, ifscCode: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="panCard">PAN Card Number</Label>
                        <Input
                          id="panCard"
                          value={withdrawalData.panCard}
                          onChange={(e) => setWithdrawalData({ ...withdrawalData, panCard: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="aadharCard">Aadhar Card Number</Label>
                        <Input
                          id="aadharCard"
                          value={withdrawalData.aadharCard}
                          onChange={(e) => setWithdrawalData({ ...withdrawalData, aadharCard: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" size="lg">
                      Submit Withdrawal Request
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Results;