
"use client";

import { Button } from "@/components/ui/button";
import { categories, type Category } from "@/data/categories";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

interface CategoryScrollerProps {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

export function CategoryScroller({ selectedCategory, onSelectCategory }: CategoryScrollerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };
  
  return (
    <div className="relative mb-8">
      <Button 
        variant="outline" 
        size="icon" 
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-card/80 hover:bg-primary hover:text-primary-foreground border-primary/30 shadow-md hidden sm:flex"
        onClick={() => scroll('left')}
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div
        ref={scrollContainerRef}
        className="flex flex-nowrap space-x-3 overflow-x-auto pb-2 no-scrollbar scroll-smooth px-10 sm:px-12" // Added flex-nowrap
      >
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            onClick={() => onSelectCategory(category.id)}
            className={cn(
              "whitespace-nowrap rounded-full px-4 py-2 text-sm transition-all duration-200 ease-out",
              selectedCategory === category.id
                ? "shadow-md text-primary-foreground" // variant="default" handles bg-primary. Ensure text is primary-foreground.
                : "text-muted-foreground border-border hover:border-accent hover:text-accent-foreground" // variant="outline" for bg-background. Customize text & hover.
            )}
          >
            {category.name}
          </Button>
        ))}
      </div>
      <Button 
        variant="outline" 
        size="icon" 
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-card/80 hover:bg-primary hover:text-primary-foreground border-primary/30 shadow-md hidden sm:flex"
        onClick={() => scroll('right')}
        aria-label="Scroll right"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none; 
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

