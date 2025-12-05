import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, CalendarIcon, Trophy, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import Footer from "@/components/Footer";
import { withdrawalSchema } from "@/lib/validation";

const Results = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [results, setResults] = useState<any[]>([]);
  const [userTickets, setUserTickets] = useState<string[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
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
    fetchUserTickets();
    
    const channel = supabase
      .channel('results-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lottery_results' }, () => {
        fetchResults();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDate]);

  const fetchUserTickets = async () => {
    setLoadingTickets(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      setUserTickets([]);
      setLoadingTickets(false);
      return;
    }

    // Fetch user's actual booked tickets from database
    const { data, error } = await supabase
      .from('booked_tickets')
      .select('ticket_number')
      .eq('user_id', session.user.id);

    if (!error && data) {
      setUserTickets(data.map(t => t.ticket_number));
    }
    setLoadingTickets(false);
  };

  const fetchResults = async () => {
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('lottery_results')
      .select(`
        *,
        lotteries (
          name,
          type,
          prize,
          draw_date
        )
      `)
      .gte('draw_date', startOfDay.toISOString())
      .lte('draw_date', endOfDay.toISOString())
      .order('created_at', { ascending: false });

    if (!error && data) {
      setResults(data);
    }
  };

  const checkWinningTickets = () => {
    const winningTickets: string[] = [];
    results.forEach(result => {
      result.winning_numbers?.forEach((number: string) => {
        if (userTickets.includes(number)) {
          winningTickets.push(number);
        }
      });
    });
    return winningTickets;
  };

  const userWinningTickets = checkWinningTickets();
  const hasWon = userWinningTickets.length > 0;

  const handleWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    // Validate with zod schema
    const result = withdrawalSchema.safeParse(withdrawalData);
    
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setValidationErrors(errors);
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
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
                        className={cn("p-3 pointer-events-auto")}
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
                <p className="text-lg text-muted-foreground">
                  No results found for {format(selectedDate, "PPP")}
                </p>
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
                      <p className="text-lg font-bold capitalize">{result.lotteries?.type}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {result.winning_numbers?.map((number: string, idx: number) => {
                      const prizes = [
                        { color: 'yellow', label: 'First Prize', amount: result.prize_amount },
                        { color: 'gray', label: 'Second Prize', amount: result.prize_amount * 0.5 },
                        { color: 'orange', label: 'Third Prize', amount: result.prize_amount * 0.25 }
                      ];
                      const prize = prizes[idx] || prizes[0];
                      
                      return (
                        <div key={idx} className={`text-center p-4 bg-gradient-to-br from-${prize.color}-500/10 to-${prize.color}-600/10 rounded-lg border border-${prize.color}-500/20`}>
                          <Trophy className={`h-8 w-8 mx-auto mb-2 text-${prize.color}-500`} />
                          <p className="text-sm font-medium text-muted-foreground mb-1">{prize.label}</p>
                          <p className={`text-2xl font-bold text-${prize.color}-600 mb-2`}>{number}</p>
                          <p className="text-lg font-semibold">₹{prize.amount?.toLocaleString()}</p>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Result declared on {new Date(result.created_at).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {loadingTickets ? (
          <div className="max-w-4xl mx-auto mt-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">Checking your tickets...</p>
          </div>
        ) : hasWon && (
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
                          className={validationErrors.name ? "border-destructive" : ""}
                        />
                        {validationErrors.name && <p className="text-xs text-destructive mt-1">{validationErrors.name}</p>}
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={withdrawalData.email}
                          onChange={(e) => setWithdrawalData({ ...withdrawalData, email: e.target.value })}
                          className={validationErrors.email ? "border-destructive" : ""}
                        />
                        {validationErrors.email && <p className="text-xs text-destructive mt-1">{validationErrors.email}</p>}
                      </div>
                      <div>
                        <Label htmlFor="bankName">Bank Name</Label>
                        <Input
                          id="bankName"
                          value={withdrawalData.bankName}
                          onChange={(e) => setWithdrawalData({ ...withdrawalData, bankName: e.target.value })}
                          className={validationErrors.bankName ? "border-destructive" : ""}
                        />
                        {validationErrors.bankName && <p className="text-xs text-destructive mt-1">{validationErrors.bankName}</p>}
                      </div>
                      <div>
                        <Label htmlFor="branch">Branch</Label>
                        <Input
                          id="branch"
                          value={withdrawalData.branch}
                          onChange={(e) => setWithdrawalData({ ...withdrawalData, branch: e.target.value })}
                          className={validationErrors.branch ? "border-destructive" : ""}
                        />
                        {validationErrors.branch && <p className="text-xs text-destructive mt-1">{validationErrors.branch}</p>}
                      </div>
                      <div>
                        <Label htmlFor="accountNumber">Account Number</Label>
                        <Input
                          id="accountNumber"
                          value={withdrawalData.accountNumber}
                          onChange={(e) => setWithdrawalData({ ...withdrawalData, accountNumber: e.target.value })}
                          className={validationErrors.accountNumber ? "border-destructive" : ""}
                        />
                        {validationErrors.accountNumber && <p className="text-xs text-destructive mt-1">{validationErrors.accountNumber}</p>}
                      </div>
                      <div>
                        <Label htmlFor="ifscCode">IFSC Code</Label>
                        <Input
                          id="ifscCode"
                          value={withdrawalData.ifscCode}
                          onChange={(e) => setWithdrawalData({ ...withdrawalData, ifscCode: e.target.value.toUpperCase() })}
                          className={validationErrors.ifscCode ? "border-destructive" : ""}
                          placeholder="e.g., SBIN0001234"
                        />
                        {validationErrors.ifscCode && <p className="text-xs text-destructive mt-1">{validationErrors.ifscCode}</p>}
                      </div>
                      <div>
                        <Label htmlFor="panCard">PAN Card Number</Label>
                        <Input
                          id="panCard"
                          value={withdrawalData.panCard}
                          onChange={(e) => setWithdrawalData({ ...withdrawalData, panCard: e.target.value.toUpperCase() })}
                          className={validationErrors.panCard ? "border-destructive" : ""}
                          placeholder="e.g., ABCDE1234F"
                        />
                        {validationErrors.panCard && <p className="text-xs text-destructive mt-1">{validationErrors.panCard}</p>}
                      </div>
                      <div>
                        <Label htmlFor="aadharCard">Aadhar Card Number</Label>
                        <Input
                          id="aadharCard"
                          value={withdrawalData.aadharCard}
                          onChange={(e) => setWithdrawalData({ ...withdrawalData, aadharCard: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                          className={validationErrors.aadharCard ? "border-destructive" : ""}
                          placeholder="12 digit number"
                        />
                        {validationErrors.aadharCard && <p className="text-xs text-destructive mt-1">{validationErrors.aadharCard}</p>}
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
