import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import crore1 from "@/assets/1-crore.png";
import lakh50 from "@/assets/50-lakh.png";
import lakh10 from "@/assets/10-lakh.png";

const Slideshow = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  
  const slides = [
    {
      title: "Win Big with 1 Crore Lottery",
      description: "Your chance to become a crorepati!",
      gradient: "from-orange-500 to-orange-700",
      image: crore1,
      link: "/lottery/night-weekly"
    },
    {
      title: "50 Lakh Prize Draw",
      description: "Multiple winners every month",
      gradient: "from-orange-600 to-red-600",
      image: lakh50,
      link: "/lottery/50-weekly"
    },
    {
      title: "10 Lakh Lucky Draw",
      description: "Best odds of winning",
      gradient: "from-orange-400 to-orange-600",
      image: lakh10,
      link: "/lottery/10-evening"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 cursor-pointer ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => navigate(slide.link)}
        >
          <div className={`w-full h-full bg-gradient-to-r ${slide.gradient} flex items-center justify-center text-white`}>
            <div className="text-center px-4">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">{slide.title}</h2>
              <p className="text-xl md:text-2xl">{slide.description}</p>
            </div>
          </div>
        </div>
      ))}
      
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
        onClick={prevSlide}
      >
        <ChevronLeft className="h-8 w-8" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
        onClick={nextSlide}
      >
        <ChevronRight className="h-8 w-8" />
      </Button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide ? "bg-white w-8" : "bg-white/50"
            }`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default Slideshow;
