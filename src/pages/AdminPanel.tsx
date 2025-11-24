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
import { LogOut, Users, Ticket, TrendingUp, Settings, Trophy, Activity, DollarSign, RefreshCw, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Footer from "@/components/Footer";

const AdminPanel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [lotteries, setLotteries] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  
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

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (!isAdmin) {
      navigate("/auth");
      return;
    }
    
    fetchAllData();
    
    const lotteriesChannel = supabase
      .channel('lotteries-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lotteries' }, () => {
        fetchLotteries();
      })
      .subscribe();

    const ticketsChannel = supabase
      .channel('tickets-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
        fetchTickets();
      })
      .subscribe();

    const resultsChannel = supabase
      .channel('results-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lottery_results' }, () => {
        fetchResults();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(lotteriesChannel);
      supabase.removeChannel(ticketsChannel);
      supabase.removeChannel(resultsChannel);
    };
  }, [navigate]);

  const fetchAllData = async () => {
    await Promise.all([fetchLotteries(), fetchTickets(), fetchResults()]);
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
      .from('tickets')
      .select('*, lotteries(name)')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (!error && data) {
      setTickets(data);
    }
  };

  const fetchResults = async () => {
    const { data, error } = await supabase
      .from('lottery_results')
      .select('*, lotteries(name, lottery_type)')
      .order('declared_at', { ascending: false});
    
    if (!error && data) {
      setResults(data);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("isLoggedIn");
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
        lottery_type: newLottery.lottery_type,
        draw_date: new Date(newLottery.draw_date).toISOString(),
        ticket_price: parseFloat(newLottery.ticket_price),
        first_prize: parseFloat(newLottery.first_prize),
        second_prize: newLottery.second_prize ? parseFloat(newLottery.second_prize) : null,
        third_prize: newLottery.third_prize ? parseFloat(newLottery.third_prize) : null,
        total_tickets: parseInt(newLottery.total_tickets),
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

    const { error } = await supabase
      .from('lottery_results')
      .insert([{
        lottery_id: resultData.lottery_id,
        first_prize_number: resultData.first_prize_number,
        second_prize_number: resultData.second_prize_number || null,
        third_prize_number: resultData.third_prize_number || null
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

  const handleUpdateLotteryStatus = async (lotteryId: string, newStatus: string) => {
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
    totalUsers: tickets.filter((t, i, self) => self.findIndex(ticket => ticket.user_email === t.user_email) === i).length,
    totalTickets: tickets.length,
    totalRevenue: `₹${tickets.reduce((sum, t) => {
      const lottery = lotteries.find(l => l.id === t.lottery_id);
      return sum + (lottery?.ticket_price || 0);
    }, 0).toLocaleString()}`,
    activeDraws: lotteries.filter(l => l.status === 'active' || l.status === 'upcoming').length,
    completedDraws: lotteries.filter(l => l.status === 'completed').length,
    winningTickets: results.length * 3
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg p-4 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-sm opacity-90">Manage your lottery system</p>
          </div>
          <Button variant="secondary" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-6 md:px-8 lg:px-12 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="lotteries" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Lotteries
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Tickets
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Results
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground mt-1">Unique participants</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border-emerald-500/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                  <Ticket className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalTickets}</div>
                  <p className="text-xs text-muted-foreground mt-1">Tickets sold</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-amber-500/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalRevenue}</div>
                  <p className="text-xs text-muted-foreground mt-1">From ticket sales</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Active Draws</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.activeDraws}</div>
                  <p className="text-xs text-muted-foreground mt-1">Upcoming & active</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/10 border-rose-500/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Completed Draws</CardTitle>
                  <CheckCircle className="h-4 w-4 text-rose-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.completedDraws}</div>
                  <p className="text-xs text-muted-foreground mt-1">Results declared</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 border-cyan-500/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Winning Tickets</CardTitle>
                  <Trophy className="h-4 w-4 text-cyan-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.winningTickets}</div>
                  <p className="text-xs text-muted-foreground mt-1">Lucky winners</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Ticket</TableHead>
                        <TableHead>Lottery</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets.slice(0, 10).map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell>{ticket.user_email || 'N/A'}</TableCell>
                          <TableCell className="font-mono">{ticket.ticket_number}</TableCell>
                          <TableCell>{ticket.lotteries?.name}</TableCell>
                          <TableCell>{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lotteries" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Lottery</CardTitle>
                <CardDescription>Add a new lottery draw to the system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                <Button onClick={handleCreateLottery} className="w-full">
                  Create Lottery
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Lotteries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Draw Date</TableHead>
                        <TableHead>Prize</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lotteries.map((lottery) => (
                        <TableRow key={lottery.id}>
                          <TableCell className="font-medium">{lottery.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{lottery.lottery_type}</Badge>
                          </TableCell>
                          <TableCell>{new Date(lottery.draw_date).toLocaleString()}</TableCell>
                          <TableCell>₹{lottery.first_prize?.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={
                              lottery.status === 'active' ? 'default' :
                              lottery.status === 'upcoming' ? 'secondary' :
                              lottery.status === 'completed' ? 'outline' : 'destructive'
                            }>
                              {lottery.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={lottery.status}
                              onValueChange={(value: string) => handleUpdateLotteryStatus(lottery.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="upcoming">Upcoming</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Tickets</CardTitle>
                <CardDescription>View all purchased tickets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ticket Number</TableHead>
                        <TableHead>Lottery</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Purchase Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell className="font-mono font-bold">{ticket.ticket_number}</TableCell>
                          <TableCell>{ticket.lotteries?.name}</TableCell>
                          <TableCell>{ticket.user_email || ticket.user_name || 'N/A'}</TableCell>
                          <TableCell>{ticket.user_phone || 'N/A'}</TableCell>
                          <TableCell>{new Date(ticket.created_at).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Declare Result</CardTitle>
                <CardDescription>Enter winning ticket numbers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                <Button onClick={handleDeclareResult} className="w-full">
                  <Trophy className="mr-2 h-4 w-4" />
                  Declare Result
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Declared Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lottery</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>1st Prize</TableHead>
                        <TableHead>2nd Prize</TableHead>
                        <TableHead>3rd Prize</TableHead>
                        <TableHead>Declared</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((result) => (
                        <TableRow key={result.id}>
                          <TableCell className="font-medium">{result.lotteries?.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{result.lotteries?.lottery_type}</Badge>
                          </TableCell>
                          <TableCell className="font-mono font-bold text-green-600">
                            {result.first_prize_number}
                          </TableCell>
                          <TableCell className="font-mono">{result.second_prize_number || '-'}</TableCell>
                          <TableCell className="font-mono">{result.third_prize_number || '-'}</TableCell>
                          <TableCell>{new Date(result.declared_at).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Database Status</p>
                    <p className="text-sm text-muted-foreground">Connected and syncing in real-time</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Total Lotteries</p>
                    <p className="text-sm text-muted-foreground">{lotteries.length} lotteries in system</p>
                  </div>
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Tickets Sold</p>
                    <p className="text-sm text-muted-foreground">{tickets.length} total tickets</p>
                  </div>
                  <Ticket className="h-5 w-5 text-primary" />
                </div>
                <Button onClick={fetchAllData} className="w-full" variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Data
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default AdminPanel;