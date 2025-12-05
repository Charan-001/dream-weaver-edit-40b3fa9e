import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const Lotteries = () => {
  const navigate = useNavigate();
  const [lotteries, setLotteries] = useState<any[]>([]);

  useEffect(() => {
    fetchLotteries();

    const lotteriesChannel = supabase
      .channel('lotteries-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lotteries' }, () => {
        fetchLotteries();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(lotteriesChannel);
    };
  }, []);

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header activeTab="lotteries" onTabChange={(tab) => {
        if (tab === "home") navigate("/dashboard");
        else if (tab === "result") navigate("/results");
      }} />
      
      <div className="flex-1 container mx-auto px-6 md:px-8 lg:px-12 py-8 md:py-12">
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">All Lotteries</h1>
            <p className="text-muted-foreground">Choose your lucky lottery and win big!</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lotteries.map((lottery, index) => {
              const isUpcoming = lottery.status === 'upcoming';
              return (
                <Card 
                  key={lottery.id} 
                  className={`overflow-hidden transition-all duration-300 ${
                    isUpcoming 
                      ? 'opacity-70 grayscale-[30%]' 
                      : 'hover:shadow-lg hover:scale-105'
                  }`}
                >
                  <div className={`bg-gradient-to-br ${getColorForLottery(index)} p-8 text-white relative`}>
                    {isUpcoming && (
                      <span className="absolute top-3 right-3 bg-black/50 text-white text-xs font-semibold px-3 py-1 rounded-full">
                        Coming Soon
                      </span>
                    )}
                    <h3 className="text-2xl font-bold mb-2">{lottery.name}</h3>
                    <p className="text-sm opacity-90 mb-4 capitalize">{lottery.type} Draw</p>
                    <p className="text-5xl font-bold mb-2">₹{(lottery.prize / 100000).toFixed(0)}L</p>
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
                      disabled={isUpcoming}
                    >
                      {isUpcoming ? 'Coming Soon' : 'Buy now'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {lotteries.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No lotteries available at the moment.</p>
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Lotteries;
