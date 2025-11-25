import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Slideshow from "@/components/Slideshow";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("home");
  const [lotteries, setLotteries] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
    fetchLotteries();
    fetchResults();

    const lotteriesChannel = supabase
      .channel('lotteries-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lotteries' }, () => {
        fetchLotteries();
      })
      .subscribe();

    const resultsChannel = supabase
      .channel('results-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lottery_results' }, () => {
        fetchResults();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(lotteriesChannel);
      supabase.removeChannel(resultsChannel);
    };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please log in to continue",
        variant: "destructive",
      });
      navigate("/auth");
    }
  };

  const fetchLotteries = async () => {
    const { data, error } = await supabase
      .from('lotteries')
      .select('*')
      .in('status', ['upcoming', 'active'])
      .order('draw_date', { ascending: true });
    
    if (!error && data) {
      setLotteries(data);
    }
  };

  const fetchResults = async () => {
    const { data, error } = await supabase
      .from('lottery_results')
      .select(`
        *,
        lotteries (
          name,
          first_prize
        )
      `)
      .order('declared_at', { ascending: false })
      .limit(3);
    
    if (!error && data) {
      setResults(data);
    }
  };

  const getColorForLottery = (index: number) => {
    const colors = [
      "from-blue-500 to-blue-600",
      "from-emerald-500 to-emerald-600",
      "from-orange-500 to-orange-600",
      "from-purple-500 to-purple-600",
      "from-pink-500 to-pink-600",
      "from-cyan-500 to-cyan-600"
    ];
    return colors[index % colors.length];
  };

  const renderContent = () => {
    switch (activeTab) {
      case "lotteries":
        return (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-center">All Lotteries</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lotteries.map((lottery, index) => (
                <Card key={lottery.id} className="overflow-hidden hover:shadow-lg transition-all hover:scale-105 duration-300">
                  <div className={`bg-gradient-to-br ${getColorForLottery(index)} p-8 text-white relative`}>
                    <h3 className="text-2xl font-bold mb-2">{lottery.name}</h3>
                    <p className="text-sm opacity-90 mb-4 capitalize">{lottery.lottery_type} Draw</p>
                    <p className="text-5xl font-bold mb-2">₹{(lottery.first_prize / 100000).toFixed(0)}L</p>
                  </div>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground mb-2">
                      Draw: {new Date(lottery.draw_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm font-medium mb-4">Ticket Price: ₹{lottery.ticket_price}</p>
                    <Button 
                      onClick={() => navigate(`/lottery/${lottery.id}`)} 
                      className="w-full shadow-md hover:shadow-lg transition-shadow" 
                      size="lg"
                    >
                      Buy now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      case "result":
        return null;
      default:
        return (
          <div className="space-y-12">
            <section>
              <h2 className="text-3xl font-bold text-center mb-8">Available Lotteries</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lotteries.slice(0, 3).map((lottery, index) => (
                  <Card key={lottery.id} className="overflow-hidden hover:shadow-lg transition-all hover:scale-105 duration-300">
                    <div className={`bg-gradient-to-br ${getColorForLottery(index)} p-8 text-white relative`}>
                      <h3 className="text-2xl font-bold mb-2">{lottery.name}</h3>
                      <p className="text-sm opacity-90 mb-4 capitalize">{lottery.lottery_type}</p>
                      <p className="text-5xl font-bold mb-2">₹{(lottery.first_prize / 100000).toFixed(0)}L</p>
                    </div>
                    <CardContent className="p-6">
                      <p className="text-sm text-muted-foreground mb-2">
                        Draw: {new Date(lottery.draw_date).toLocaleDateString()} at {new Date(lottery.draw_date).toLocaleTimeString()}
                      </p>
                      <p className="text-sm font-medium mb-4">Ticket Price: ₹{lottery.ticket_price}</p>
                      <Button 
                        onClick={() => navigate(`/lottery/${lottery.id}`)} 
                        className="w-full shadow-md hover:shadow-lg transition-shadow" 
                        size="lg"
                      >
                        Buy now
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <section className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-8">
              <h2 className="text-3xl font-bold text-center mb-8">Upcoming Attractions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {lotteries.filter(l => l.status === 'upcoming').slice(0, 3).map((lottery) => (
                  <Card key={lottery.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-xl">{lottery.name}</CardTitle>
                      <CardDescription>
                        {new Date(lottery.draw_date).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-primary">
                        ₹{(lottery.first_prize / 10000000).toFixed(1)} Cr
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-center mb-8">Latest Results</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {results.map((result) => (
                  <Card key={result.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle>{result.lotteries?.name}</CardTitle>
                      <CardDescription>
                        {new Date(result.declared_at).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Winner</p>
                          <p className="text-xl font-bold font-mono">{result.first_prize_number}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Prize</p>
                          <p className="text-lg font-semibold">
                            ₹{(result.lotteries?.first_prize / 10000000).toFixed(1)} Crore
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      <Slideshow />
      
      <div className="flex-1 container mx-auto px-6 md:px-8 lg:px-12 py-8 md:py-12">
        {renderContent()}
      </div>
      
      <Footer />
    </div>
  );
};

export default Dashboard;