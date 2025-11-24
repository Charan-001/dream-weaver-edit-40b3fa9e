import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import lotteryLogo from "@/assets/lottery-logo.png";
import Footer from "@/components/Footer";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("userLoggedIn");
    if (isLoggedIn) {
      navigate("/dashboard");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6 md:px-8 lg:px-12 py-8 md:py-12">
        <div className="text-center max-w-2xl mx-auto space-y-8">
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <h1 className="text-3xl md:text-5xl font-bold text-foreground">
              DL Raffle
            </h1>
            
            <div className="flex justify-center py-6">
              <img 
                src={lotteryLogo} 
                alt="DL Raffle Logo" 
                className="w-32 h-32 md:w-40 md:h-40 drop-shadow-2xl animate-in zoom-in duration-700 delay-300"
              />
            </div>
            
            <p className="text-xl md:text-2xl text-muted-foreground font-medium">
              Digital Lottery - Book Your Tickets Online
            </p>
          </div>

          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
            <div className="flex gap-4 justify-center">
              <Button 
                size="lg" 
                className="w-48 text-lg h-14 shadow-xl hover:shadow-2xl transition-all duration-300"
                onClick={() => navigate("/auth?mode=login")}
              >
                Login
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="w-48 text-lg h-14 shadow-xl hover:shadow-2xl transition-all duration-300"
                onClick={() => navigate("/auth?mode=register")}
              >
                Register
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Index;
