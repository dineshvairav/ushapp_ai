
"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/auth/AuthModal';
import { GuestLoginSheet } from '@/components/auth/GuestLoginSheet'; // Added import
import { StaticShopLogo } from '@/components/common/StaticShopLogo';
import { Zap, ShoppingBag, CheckCircle, Gift } from 'lucide-react';
import Autoplay from "embla-carousel-autoplay";
import { cn } from '@/lib/utils';

const onboardingSlides = [
  {
    icon: <Zap size={64} className="text-primary mb-6" />,
    title: "Welcome to StaticShop!",
    description: "Discover a world of curated products, handpicked for quality and style. Your next favorite item is just a click away.",
  },
  {
    icon: <ShoppingBag size={64} className="text-primary mb-6" />,
    title: "Seamless Shopping Experience",
    description: "Enjoy easy navigation, beautiful product displays, and a straightforward checkout process. Shopping made simple and enjoyable.",
  },
  {
    icon: <Gift size={64} className="text-primary mb-6" />,
    title: "Exclusive Deals & Finds",
    description: "Get access to unique items and special offers you won't find anywhere else. We're constantly updating our collection.",
  },
  {
    icon: <CheckCircle size={64} className="text-primary mb-6" />,
    title: "Ready to Get Started?",
    description: "Sign up or log in to personalize your experience, save your favorites, and start exploring the best of StaticShop.",
  },
];

export default function OnboardingPage() {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const [isGuestLoginSheetOpen, setIsGuestLoginSheetOpen] = React.useState(false); // New state
  const router = useRouter();

  React.useEffect(() => {
    if (!api) {
      return;
    }
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
      if (api.selectedScrollSnap() === onboardingSlides.length - 1) {
         // Optional: Automatically open modal on last slide after a delay
        // setTimeout(() => setIsAuthModalOpen(true), 1000);
      }
    });
  }, [api]);

  const handleGetStarted = () => {
    setIsAuthModalOpen(true);
  };

  const handleSkip = () => {
    router.push('/shop'); // Allow skipping to shop page
  };

  const handleGuestLoginInitiated = () => {
    // AuthModal calls onOpenChange(false) itself, so we don't need setIsAuthModalOpen(false) here.
    setIsGuestLoginSheetOpen(true);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4 relative overflow-hidden">
       <button 
        onClick={handleSkip}
        className="absolute top-6 right-6 text-sm text-muted-foreground hover:text-primary transition-colors z-20"
      >
        Skip
      </button>
      <StaticShopLogo className="h-20 w-20 mb-8 animate-fadeIn" />
      <div className="w-full max-w-xl md:max-w-2xl">
        <Carousel 
          setApi={setApi} 
          className="w-full"
          plugins={[Autoplay({ delay: 5000, stopOnInteraction: true })]}
        >
          <CarouselContent>
            {onboardingSlides.map((slide, index) => (
              <CarouselItem key={index}>
                <div className="flex flex-col items-center justify-center text-center p-6 sm:p-10 h-[400px] sm:h-[450px] bg-card/80 backdrop-blur-sm rounded-xl shadow-2xl">
                  <div className="animate-pulseOnce">{slide.icon}</div>
                  <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-foreground">{slide.title}</h2>
                  <p className="text-sm sm:text-base text-muted-foreground max-w-md">{slide.description}</p>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden sm:block">
            <CarouselPrevious className="bg-card/50 hover:bg-primary hover:text-primary-foreground border-primary/30" />
            <CarouselNext className="bg-card/50 hover:bg-primary hover:text-primary-foreground border-primary/30" />
          </div>
        </Carousel>
      </div>

      <div className="flex space-x-2 mt-8 mb-8">
        {onboardingSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => api?.scrollTo(index)}
            className={cn(
              "h-2.5 w-2.5 rounded-full transition-all duration-300 ease-out",
              current === index ? "w-6 bg-primary" : "bg-muted hover:bg-primary/50"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
      
      {current === onboardingSlides.length - 1 && (
        <Button 
          size="lg" 
          onClick={handleGetStarted} 
          className="bg-primary hover:bg-primary/90 text-primary-foreground animate-bounceIn"
        >
          Sign In / Sign Up
        </Button>
      )}

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onOpenChange={setIsAuthModalOpen} 
        onGuestLoginClick={handleGuestLoginInitiated} // Pass the handler
      />
      <GuestLoginSheet 
        isOpen={isGuestLoginSheetOpen} 
        onOpenChange={setIsGuestLoginSheetOpen} 
      />

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }

        @keyframes pulseOnce {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .animate-pulseOnce { animation: pulseOnce 0.6s ease-in-out; }

        @keyframes bounceIn {
          0% { opacity: 0; transform: scale(0.3) translateY(20px); }
          50% { transform: scale(1.05) translateY(-5px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-bounceIn { animation: bounceIn 0.5s cubic-bezier(0.215, 0.61, 0.355, 1) forwards; }
      `}</style>
    </div>
  );
}

    