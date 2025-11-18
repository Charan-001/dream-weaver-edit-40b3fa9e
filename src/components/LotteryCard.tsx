import { Card, CardContent } from "@/components/ui/card";

interface LotteryCardProps {
  title: string;
  image: string;
  onClick: () => void;
}

const LotteryCard = ({ title, image, onClick }: LotteryCardProps) => {
  return (
    <Card
      className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl overflow-hidden group"
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="aspect-square overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        </div>
        <div className="p-4 bg-gradient-to-r from-primary to-accent">
          <h3 className="text-lg font-bold text-center text-white">{title}</h3>
        </div>
      </CardContent>
    </Card>
  );
};

export default LotteryCard;
