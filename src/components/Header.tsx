import { useNavigate } from "react-router-dom";
import { Home, Trophy, Award, ShoppingCart, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import lotteryLogo from "@/assets/lottery-logo.png";

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Header = ({ activeTab, onTabChange }: HeaderProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("userLoggedIn");
    navigate("/");
  };

  return (
    <header className="bg-card border-b border-border shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={lotteryLogo} alt="DL Raffle" className="h-10 md:h-12" />
            <div className="hidden md:block">
              <h1 className="text-lg font-bold text-foreground">DL Raffle</h1>
              <p className="text-xs text-muted-foreground">Digital Lottery</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Button
              variant="ghost"
              onClick={() => onTabChange("home")}
              className={activeTab === "home" ? "text-primary" : ""}
            >
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
            <Button
              variant="ghost"
              onClick={() => onTabChange("lotteries")}
              className={activeTab === "lotteries" ? "text-primary" : ""}
            >
              <Trophy className="mr-2 h-4 w-4" />
              Lotteries
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/results")}
              className={activeTab === "result" ? "text-primary" : ""}
            >
              <Award className="mr-2 h-4 w-4" />
              Results
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/cart")}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Cart
            </Button>
          </nav>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">Account</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/booked-tickets")}>
                  My Tickets
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex gap-2 mt-3 overflow-x-auto pb-2">
          <Button
            size="sm"
            variant={activeTab === "home" ? "default" : "ghost"}
            onClick={() => onTabChange("home")}
          >
            Home
          </Button>
          <Button
            size="sm"
            variant={activeTab === "lotteries" ? "default" : "ghost"}
            onClick={() => onTabChange("lotteries")}
          >
            Lotteries
          </Button>
          <Button
            size="sm"
            variant={activeTab === "result" ? "default" : "ghost"}
            onClick={() => onTabChange("result")}
          >
            Results
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
