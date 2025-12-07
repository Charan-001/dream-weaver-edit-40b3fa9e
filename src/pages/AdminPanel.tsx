import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LogOut, Users, Ticket, TrendingUp, Settings, Trophy, Activity, DollarSign, RefreshCw, CheckCircle, Wallet, XCircle, Eye, CreditCard, Building2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";


const AdminPanel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [lotteries, setLotteries] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  
  const [newLottery, setNewLottery] = useState({
    name: "",
    lottery_type: "weekly" as "weekly" | "monthly" | "special" | "bumper",
    draw_date: "",
    ticket_price: "",
    first_prize: "",
    second_prize: "",
    third_prize: "",
    total_tickets: "100000",
    status: "upcoming" as "upcoming" | "active" | "completed" | "cancelled"
  });

  const [resultData, setResultData] = useState({
    lottery_id: "",
    first_prize_number: "",
    second_prize_number: "",
    third_prize_number: ""
  });

  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    checkAdmin();
    fetchAllData();
    
    const lotteriesChannel = supabase
      .channel('lotteries-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lotteries' }, () => {
        fetchLotteries();
      })
      .subscribe();

    const ticketsChannel = supabase
      .channel('tickets-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'booked_tickets' }, () => {
        fetchTickets();
      })
      .subscribe();

    const resultsChannel = supabase
      .channel('results-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lottery_results' }, () => {
        fetchResults();
      })
      .subscribe();

    const withdrawalsChannel = supabase
      .channel('withdrawals-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, () => {
        fetchWithdrawals();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(lotteriesChannel);
      supabase.removeChannel(ticketsChannel);
      supabase.removeChannel(resultsChannel);
      supabase.removeChannel(withdrawalsChannel);
    };
  }, [navigate]);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      toast({
        title: "Access Denied",
        description: "Admin privileges required",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  };

  const fetchAllData = async () => {
    await Promise.all([fetchLotteries(), fetchTickets(), fetchResults(), fetchTotalUsers(), fetchWithdrawals()]);
  };

  const fetchWithdrawals = async () => {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*, profiles(name, email)')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setWithdrawals(data);
    }
  };

  const handleUpdateWithdrawalStatus = async (withdrawalId: string, newStatus: 'approved' | 'rejected') => {
    const { data: { session } } = await supabase.auth.getSession();
    
    const { error } = await supabase
      .from('withdrawals')
      .update({ 
        status: newStatus, 
        processed_at: new Date().toISOString(),
        processed_by: session?.user.id
      })
      .eq('id', withdrawalId);

    if (error) {
      toast({
        title: "Error",
        description: `Failed to ${newStatus} withdrawal`,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: `Withdrawal ${newStatus} successfully`,
    });
    
    await fetchWithdrawals();
  };

  const fetchTotalUsers = async () => {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (!error && count !== null) {
      setTotalUsers(count);
    }
  };

  const fetchLotteries = async () => {
    const { data, error } = await supabase
      .from('lotteries')
      .select('*')
      .order('draw_date', { ascending: false });
    
    if (!error && data) {
      setLotteries(data);
    }
  };

  const fetchTickets = async () => {
    const { data, error } = await supabase
      .from('booked_tickets')
      .select('*, orders(lottery_name, ticket_price, lottery_id, lotteries(prize))')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setTickets(data);
    }
  };

  const fetchResults = async () => {
    const { data, error } = await supabase
      .from('lottery_results')
      .select('*, lotteries(name, type)')
      .order('created_at', { ascending: false});
    
    if (!error && data) {
      setResults(data);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "Admin logged out successfully",
    });
    navigate("/auth");
  };

  const handleCreateLottery = async () => {
    if (!newLottery.name || !newLottery.draw_date || !newLottery.ticket_price || !newLottery.first_prize) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('lotteries')
      .insert([{
        name: newLottery.name,
        type: newLottery.lottery_type,
        draw_date: new Date(newLottery.draw_date).toISOString(),
        ticket_price: parseFloat(newLottery.ticket_price),
        prize: parseFloat(newLottery.first_prize),
        status: newLottery.status
      }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create lottery",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: "Lottery created successfully",
    });

    setNewLottery({
      name: "",
      lottery_type: "weekly",
      draw_date: "",
      ticket_price: "",
      first_prize: "",
      second_prize: "",
      third_prize: "",
      total_tickets: "100000",
      status: "upcoming"
    });

    await fetchLotteries();
  };

  const handleDeclareResult = async () => {
    if (!resultData.lottery_id || !resultData.first_prize_number) {
      toast({
        title: "Error",
        description: "Please select lottery and enter winning ticket",
        variant: "destructive"
      });
      return;
    }

    const winningNumbers = [resultData.first_prize_number];
    if (resultData.second_prize_number) winningNumbers.push(resultData.second_prize_number);
    if (resultData.third_prize_number) winningNumbers.push(resultData.third_prize_number);

    const lottery = lotteries.find(l => l.id === resultData.lottery_id);
    if (!lottery) return;

    const { error } = await supabase
      .from('lottery_results')
      .insert([{
        lottery_id: resultData.lottery_id,
        winning_numbers: winningNumbers,
        prize_amount: lottery.prize,
        draw_date: lottery.draw_date
      }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to declare result",
        variant: "destructive"
      });
      return;
    }

    await supabase
      .from('lotteries')
      .update({ status: 'completed' })
      .eq('id', resultData.lottery_id);

    toast({
      title: "Result Declared",
      description: `Winning ticket: ${resultData.first_prize_number}`,
    });

    setResultData({
      lottery_id: "",
      first_prize_number: "",
      second_prize_number: "",
      third_prize_number: ""
    });

    await fetchResults();
  };

  const handleUpdateLotteryStatus = async (lotteryId: string, newStatus: "active" | "cancelled" | "completed" | "upcoming") => {
    const { error } = await supabase
      .from('lotteries')
      .update({ status: newStatus })
      .eq('id', lotteryId);

    if (!error) {
      toast({
        title: "Success",
        description: "Lottery status updated",
      });
      await fetchLotteries();
    }
  };

  const stats = {
    totalUsers: totalUsers,
    totalTickets: tickets.length,
    totalRevenue: `₹${tickets.reduce((sum, t) => {
      const price = t.orders?.ticket_price || 0;
      return sum + Number(price);
    }, 0).toLocaleString()}`,
    activeDraws: lotteries.filter(l => l.status === 'active' || l.status === 'upcoming').length,
    completedDraws: lotteries.filter(l => l.status === 'completed').length,
    winningTickets: results.reduce((sum, r) => sum + (r.winning_numbers?.length || 0), 0),
    pendingWithdrawals: withdrawals.filter(w => w.status === 'pending').length
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg p-3 sm:p-4 z-10">
        <div className="container mx-auto flex justify-between items-center gap-2">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">Admin Panel</h1>
            <p className="text-xs sm:text-sm opacity-90 hidden sm:block">Manage your lottery system</p>
          </div>
          <Button variant="secondary" onClick={handleLogout} size="sm" className="shrink-0">
            <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-3 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-6 md:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 gap-1 sm:gap-2 h-auto">
            <TabsTrigger value="overview" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">Home</span>
            </TabsTrigger>
            <TabsTrigger value="lotteries" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Lotteries</span>
              <span className="xs:hidden">Draws</span>
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <Ticket className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Tickets</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Results</span>
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 relative">
              <Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Withdrawals</span>
              <span className="sm:hidden">Withdraw</span>
              {stats.pendingWithdrawals > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                  {stats.pendingWithdrawals}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Settings</span>
              <span className="sm:hidden">More</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="text-2xl sm:text-3xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground mt-1">Unique participants</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border-emerald-500/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Tickets</CardTitle>
                  <Ticket className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500" />
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="text-2xl sm:text-3xl font-bold">{stats.totalTickets}</div>
                  <p className="text-xs text-muted-foreground mt-1">Tickets sold</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-amber-500/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500" />
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="text-2xl sm:text-3xl font-bold">{stats.totalRevenue}</div>
                  <p className="text-xs text-muted-foreground mt-1">From ticket sales</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Active Draws</CardTitle>
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="text-2xl sm:text-3xl font-bold">{stats.activeDraws}</div>
                  <p className="text-xs text-muted-foreground mt-1">Upcoming & active</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/10 border-rose-500/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Completed Draws</CardTitle>
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-rose-500" />
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="text-2xl sm:text-3xl font-bold">{stats.completedDraws}</div>
                  <p className="text-xs text-muted-foreground mt-1">Results declared</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 border-cyan-500/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Winning Tickets</CardTitle>
                  <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-cyan-500" />
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="text-2xl sm:text-3xl font-bold">{stats.winningTickets}</div>
                  <p className="text-xs text-muted-foreground mt-1">Lucky winners</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
                  Recent Tickets
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs sm:text-sm">User</TableHead>
                          <TableHead className="text-xs sm:text-sm">Ticket</TableHead>
                          <TableHead className="text-xs sm:text-sm">Lottery</TableHead>
                          <TableHead className="text-xs sm:text-sm">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tickets.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8 text-xs sm:text-sm">
                              No tickets purchased yet
                            </TableCell>
                          </TableRow>
                        ) : (
                          tickets.slice(0, 10).map((ticket) => (
                            <TableRow key={ticket.id}>
                              <TableCell className="font-mono text-[10px] sm:text-xs">{ticket.user_id?.slice(0, 8)}...</TableCell>
                              <TableCell className="font-mono font-semibold text-xs sm:text-sm">{ticket.ticket_number}</TableCell>
                              <TableCell className="text-xs sm:text-sm">{ticket.orders?.lottery_name || 'N/A'}</TableCell>
                              <TableCell className="text-xs sm:text-sm">{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lotteries" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Create New Lottery</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Add a new lottery draw to the system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lottery-name">Lottery Name</Label>
                    <Input
                      id="lottery-name"
                      placeholder="e.g., Weekly Super Draw"
                      value={newLottery.name}
                      onChange={(e) => setNewLottery({ ...newLottery, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lottery-type">Lottery Type</Label>
                    <Select
                      value={newLottery.lottery_type}
                      onValueChange={(value: any) => setNewLottery({ ...newLottery, lottery_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="special">Special</SelectItem>
                        <SelectItem value="bumper">Bumper</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="draw-date">Draw Date & Time</Label>
                    <Input
                      id="draw-date"
                      type="datetime-local"
                      value={newLottery.draw_date}
                      onChange={(e) => setNewLottery({ ...newLottery, draw_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ticket-price">Ticket Price (₹)</Label>
                    <Input
                      id="ticket-price"
                      type="number"
                      placeholder="50"
                      value={newLottery.ticket_price}
                      onChange={(e) => setNewLottery({ ...newLottery, ticket_price: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="first-prize">First Prize (₹)</Label>
                    <Input
                      id="first-prize"
                      type="number"
                      placeholder="1000000"
                      value={newLottery.first_prize}
                      onChange={(e) => setNewLottery({ ...newLottery, first_prize: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="second-prize">Second Prize (₹)</Label>
                    <Input
                      id="second-prize"
                      type="number"
                      placeholder="500000"
                      value={newLottery.second_prize}
                      onChange={(e) => setNewLottery({ ...newLottery, second_prize: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="third-prize">Third Prize (₹)</Label>
                    <Input
                      id="third-prize"
                      type="number"
                      placeholder="100000"
                      value={newLottery.third_prize}
                      onChange={(e) => setNewLottery({ ...newLottery, third_prize: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total-tickets">Total Tickets</Label>
                    <Input
                      id="total-tickets"
                      type="number"
                      value={newLottery.total_tickets}
                      onChange={(e) => setNewLottery({ ...newLottery, total_tickets: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleCreateLottery} className="w-full text-sm sm:text-base">
                  Create Lottery
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">All Lotteries</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs sm:text-sm">Name</TableHead>
                          <TableHead className="text-xs sm:text-sm">Type</TableHead>
                          <TableHead className="text-xs sm:text-sm">Draw Date</TableHead>
                          <TableHead className="text-xs sm:text-sm">Prize</TableHead>
                          <TableHead className="text-xs sm:text-sm">Status</TableHead>
                          <TableHead className="text-xs sm:text-sm">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lotteries.map((lottery) => (
                          <TableRow key={lottery.id}>
                            <TableCell className="font-medium text-xs sm:text-sm">{lottery.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px] sm:text-xs">{lottery.type}</Badge>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">{new Date(lottery.draw_date).toLocaleString()}</TableCell>
                            <TableCell className="text-xs sm:text-sm">₹{lottery.prize?.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant={
                                lottery.status === 'active' ? 'default' :
                                lottery.status === 'upcoming' ? 'secondary' :
                                lottery.status === 'completed' ? 'outline' : 'destructive'
                              } className="text-[10px] sm:text-xs">
                                {lottery.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={lottery.status}
                                onValueChange={(value: "active" | "cancelled" | "completed" | "upcoming") => handleUpdateLotteryStatus(lottery.id, value)}
                              >
                                <SelectTrigger className="w-24 sm:w-32 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="upcoming" className="text-xs">Upcoming</SelectItem>
                                  <SelectItem value="active" className="text-xs">Active</SelectItem>
                                  <SelectItem value="completed" className="text-xs">Completed</SelectItem>
                                  <SelectItem value="cancelled" className="text-xs">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">All Tickets</CardTitle>
                <CardDescription className="text-xs sm:text-sm">View all purchased tickets ({tickets.length} total)</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs sm:text-sm">Ticket Number</TableHead>
                          <TableHead className="text-xs sm:text-sm">Lottery</TableHead>
                          <TableHead className="text-xs sm:text-sm">Price</TableHead>
                          <TableHead className="text-xs sm:text-sm">Prize</TableHead>
                          <TableHead className="text-xs sm:text-sm">Draw Date</TableHead>
                          <TableHead className="text-xs sm:text-sm">User</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tickets.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-xs sm:text-sm">
                              No tickets purchased yet
                            </TableCell>
                          </TableRow>
                        ) : (
                          tickets.map((ticket) => (
                            <TableRow key={ticket.id}>
                              <TableCell className="font-mono font-bold text-primary text-xs sm:text-sm">{ticket.ticket_number}</TableCell>
                              <TableCell className="font-medium text-xs sm:text-sm">{ticket.orders?.lottery_name || 'N/A'}</TableCell>
                              <TableCell className="text-emerald-600 font-semibold text-xs sm:text-sm">₹{Number(ticket.orders?.ticket_price || 0).toLocaleString()}</TableCell>
                              <TableCell className="text-amber-600 font-semibold text-xs sm:text-sm">₹{Number(ticket.orders?.lotteries?.prize || 0).toLocaleString()}</TableCell>
                              <TableCell className="text-muted-foreground text-xs sm:text-sm">{new Date(ticket.draw_date).toLocaleDateString()}</TableCell>
                              <TableCell className="font-mono text-[10px] sm:text-xs text-muted-foreground">{ticket.user_id?.slice(0, 8)}...</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Declare Result</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Enter winning ticket numbers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                <div className="space-y-2">
                  <Label htmlFor="result-lottery">Select Lottery</Label>
                  <Select
                    value={resultData.lottery_id}
                    onValueChange={(value) => setResultData({ ...resultData, lottery_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose lottery" />
                    </SelectTrigger>
                    <SelectContent>
                      {lotteries.filter(l => l.status === 'active').map((lottery) => (
                        <SelectItem key={lottery.id} value={lottery.id}>
                          {lottery.name} - {new Date(lottery.draw_date).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first-winner">First Prize Winner</Label>
                    <Input
                      id="first-winner"
                      placeholder="10-19/1015"
                      value={resultData.first_prize_number}
                      onChange={(e) => setResultData({ ...resultData, first_prize_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="second-winner">Second Prize Winner</Label>
                    <Input
                      id="second-winner"
                      placeholder="10-19/2034"
                      value={resultData.second_prize_number}
                      onChange={(e) => setResultData({ ...resultData, second_prize_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="third-winner">Third Prize Winner</Label>
                    <Input
                      id="third-winner"
                      placeholder="10-19/3045"
                      value={resultData.third_prize_number}
                      onChange={(e) => setResultData({ ...resultData, third_prize_number: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleDeclareResult} className="w-full text-sm sm:text-base">
                  <Trophy className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Declare Result
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Declared Results</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs sm:text-sm">Lottery</TableHead>
                          <TableHead className="text-xs sm:text-sm">Type</TableHead>
                          <TableHead className="text-xs sm:text-sm">1st Prize</TableHead>
                          <TableHead className="text-xs sm:text-sm">2nd Prize</TableHead>
                          <TableHead className="text-xs sm:text-sm">3rd Prize</TableHead>
                          <TableHead className="text-xs sm:text-sm">Declared</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.map((result) => (
                          <TableRow key={result.id}>
                            <TableCell className="font-medium text-xs sm:text-sm">{result.lotteries?.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px] sm:text-xs">{result.lotteries?.type}</Badge>
                            </TableCell>
                            <TableCell className="font-mono font-bold text-green-600 text-xs sm:text-sm">
                              {result.winning_numbers?.[0] || '-'}
                            </TableCell>
                            <TableCell className="font-mono text-xs sm:text-sm">{result.winning_numbers?.[1] || '-'}</TableCell>
                            <TableCell className="font-mono text-xs sm:text-sm">{result.winning_numbers?.[2] || '-'}</TableCell>
                            <TableCell className="text-xs sm:text-sm">{new Date(result.created_at).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
                  Withdrawal Requests
                </CardTitle>
                <CardDescription>Manage user withdrawal requests</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs sm:text-sm">User</TableHead>
                          <TableHead className="text-xs sm:text-sm">Amount</TableHead>
                          <TableHead className="text-xs sm:text-sm">Bank Details</TableHead>
                          <TableHead className="text-xs sm:text-sm">Status</TableHead>
                          <TableHead className="text-xs sm:text-sm">Requested</TableHead>
                          <TableHead className="text-xs sm:text-sm">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {withdrawals.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-xs sm:text-sm">
                              No withdrawal requests yet
                            </TableCell>
                          </TableRow>
                        ) : (
                          withdrawals.map((withdrawal) => (
                            <TableRow key={withdrawal.id}>
                              <TableCell className="text-xs sm:text-sm">
                                <div>
                                  <p className="font-medium">{withdrawal.profiles?.name || 'N/A'}</p>
                                  <p className="text-muted-foreground text-[10px] sm:text-xs">{withdrawal.profiles?.email || withdrawal.user_id?.slice(0, 8)}</p>
                                </div>
                              </TableCell>
                              <TableCell className="font-bold text-xs sm:text-sm">₹{withdrawal.amount?.toLocaleString()}</TableCell>
                              <TableCell className="text-xs sm:text-sm">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-auto p-2 text-left flex items-start gap-2 hover:bg-muted"
                                  onClick={() => {
                                    setSelectedWithdrawal(withdrawal);
                                    setShowDetailsDialog(true);
                                  }}
                                >
                                  <Eye className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                                  <div className="space-y-0.5">
                                    <p className="font-medium">{withdrawal.bank_name || 'N/A'}</p>
                                    <p className="text-muted-foreground text-[10px] sm:text-xs">
                                      Click to view full details
                                    </p>
                                  </div>
                                </Button>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={
                                    withdrawal.status === 'approved' ? 'default' : 
                                    withdrawal.status === 'rejected' ? 'destructive' : 
                                    'secondary'
                                  }
                                  className="text-[10px] sm:text-xs"
                                >
                                  {withdrawal.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm">
                                {new Date(withdrawal.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                {withdrawal.status === 'pending' ? (
                                  <div className="flex gap-1 sm:gap-2">
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() => handleUpdateWithdrawalStatus(withdrawal.id, 'approved')}
                                      className="h-7 px-2 text-[10px] sm:text-xs"
                                    >
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleUpdateWithdrawalStatus(withdrawal.id, 'rejected')}
                                      className="h-7 px-2 text-[10px] sm:text-xs"
                                    >
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Reject
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-xs">
                                    {withdrawal.processed_at ? new Date(withdrawal.processed_at).toLocaleDateString() : '-'}
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bank Details Dialog */}
          <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Withdrawal Details
                </DialogTitle>
                <DialogDescription>
                  Full bank and identity details for this withdrawal request
                </DialogDescription>
              </DialogHeader>
              {selectedWithdrawal && (
                <div className="space-y-4">
                  {/* User Info */}
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Requested By</p>
                    <p className="font-medium">{selectedWithdrawal.profiles?.name || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">{selectedWithdrawal.profiles?.email || 'N/A'}</p>
                  </div>

                  {/* Amount */}
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Withdrawal Amount</p>
                    <p className="text-2xl font-bold text-primary">₹{selectedWithdrawal.amount?.toLocaleString()}</p>
                  </div>

                  {/* Bank Details */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Building2 className="h-4 w-4 text-primary" />
                      Bank Details
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Bank Name</p>
                        <p className="font-medium">{selectedWithdrawal.bank_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">IFSC Code</p>
                        <p className="font-mono font-medium">{selectedWithdrawal.ifsc_code || 'N/A'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">Account Number</p>
                        <p className="font-mono font-medium text-lg">{selectedWithdrawal.account_number || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Identity Documents */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="h-4 w-4 text-primary" />
                      Identity Documents
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">PAN Number</p>
                        <p className="font-mono font-medium">{selectedWithdrawal.pan_number || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Aadhar Number</p>
                        <p className="font-mono font-medium">{selectedWithdrawal.aadhar_number || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge 
                        variant={
                          selectedWithdrawal.status === 'approved' ? 'default' : 
                          selectedWithdrawal.status === 'rejected' ? 'destructive' : 
                          'secondary'
                        }
                      >
                        {selectedWithdrawal.status}
                      </Badge>
                    </div>
                    {selectedWithdrawal.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            handleUpdateWithdrawalStatus(selectedWithdrawal.id, 'approved');
                            setShowDetailsDialog(false);
                          }}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            handleUpdateWithdrawalStatus(selectedWithdrawal.id, 'rejected');
                            setShowDetailsDialog(false);
                          }}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <TabsContent value="settings" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">System Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                <div className="flex justify-between items-center p-3 sm:p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium text-sm sm:text-base">Database Status</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Connected and syncing in real-time</p>
                  </div>
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 shrink-0" />
                </div>
                <div className="flex justify-between items-center p-3 sm:p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium text-sm sm:text-base">Total Lotteries</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{lotteries.length} lotteries in system</p>
                  </div>
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                </div>
                <div className="flex justify-between items-center p-3 sm:p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium text-sm sm:text-base">Tickets Sold</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{tickets.length} total tickets</p>
                  </div>
                  <Ticket className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                </div>
                <Button onClick={fetchAllData} className="w-full text-sm sm:text-base" variant="outline">
                  <RefreshCw className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Refresh Data
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;