import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";

const WinnersSection = () => {
  const winners = [
    {
      name: "Priya S.",
      prize: "₹10 Lakhs",
      lottery: "DL 10 Evening",
      month: "November 2025",
    },
    {
      name: "Rahul K.",
      prize: "₹21 Lakhs",
      lottery: "DL 50 Weekly",
      month: "October 2025",
    },
    {
      name: "Anjali M.",
      prize: "₹10 Lakhs",
      lottery: "DL Night Weekly",
      month: "October 2025",
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-center">Recent Winners</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {winners.map((winner, index) => (
          <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">{winner.name}</h3>
              <p className="text-2xl font-bold text-primary mb-1">{winner.prize}</p>
              <p className="text-sm text-muted-foreground mb-1">{winner.lottery}</p>
              <p className="text-xs text-muted-foreground">{winner.month}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default WinnersSection;
