
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { StaticShopLogo } from '@/components/common/StaticShopLogo';
import { MapPin, Mail, Phone, Facebook, Twitter, Instagram, ShoppingBag, Layers, Sparkles } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const categoriesSummary = [
  { name: 'Electronics', description: 'Cutting-edge tech and gadgets.', icon: <Sparkles className="h-8 w-8 text-accent" /> },
  { name: 'Fashion', description: 'Latest trends and timeless styles.', icon: <ShoppingBag className="h-8 w-8 text-accent" /> },
  { name: 'Home Goods', description: 'Essentials for a cozy living.', icon: <Layers className="h-8 w-8 text-accent" /> },
  { name: 'Collectibles', description: 'Unique finds for enthusiasts.', icon: <Layers className="h-8 w-8 text-accent" /> }, // Re-using icon for brevity
];

export default function WelcomePage() {
  const [showCategories, setShowCategories] = useState(false);
  const categoriesSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (showCategories && categoriesSectionRef.current) {
      categoriesSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showCategories]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="py-6 px-4 sm:px-8 flex justify-center items-center">
        <Link href="/" aria-label="StaticShop Home">
          <StaticShopLogo className="h-12 w-12 sm:h-16 sm:w-16" />
        </Link>
      </header>

      <main className="flex-grow">
        <section className="flex flex-col items-center justify-center p-4 text-center min-h-[calc(100vh-200px-4rem)] sm:min-h-[calc(100vh-200px-5rem)]">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 tracking-tight">
            Welcome to <span className="text-primary">ushªOªpp</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mb-10">
            Discover a curated selection of unique products. Quality and style, delivered.
          </p>
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 flex flex-col sm:flex-row">
            <Button 
              size="lg" 
              variant="outline" 
              className="border-accent text-accent hover:bg-accent hover:text-accent-foreground transition-colors duration-300"
              onClick={() => setShowCategories(true)}
            >
              Know More
            </Button>
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-300">
              <Link href="/onboarding">Get Started</Link>
            </Button>
          </div>
        </section>

        {showCategories && (
          <section 
            ref={categoriesSectionRef} 
            id="know-more" 
            className="py-16 md:py-24 bg-background"
          >
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl sm:text-4xl font-semibold mb-4 text-primary tracking-tight">Our Product Categories</h2>
              <p className="text-md sm:text-lg text-muted-foreground max-w-3xl mx-auto mb-12">
                Explore a wide range of products across various categories. We focus on quality, innovation, and customer satisfaction.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                {categoriesSummary.map((category) => (
                  <div key={category.name} className="p-6 bg-card rounded-xl shadow-lg hover:shadow-primary/30 transition-shadow duration-300 flex flex-col items-center">
                    <div className="mb-4 p-3 bg-primary/10 rounded-full">
                      {category.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">{category.name}</h3>
                    <p className="text-muted-foreground text-sm">{category.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="py-12 bg-card text-card-foreground border-t border-border">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div>
            <h3 className="text-lg font-semibold mb-3 text-primary">Location</h3>
            <div className="flex items-center justify-center md:justify-start space-x-2">
              <MapPin size={18} />
              <a href="https://maps.app.goo.gl/6tUDuyAkT62byw3Z9" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-accent transition-colors">IX, Usha Building, Fancy Bazaar, Changanacherry</a>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3 text-primary">Contact Us</h3>
            <div className="flex items-center justify-center md:justify-start space-x-2 mb-1">
              <Mail size={18} />
              <a href="mailto:ushaagency1960@gmail.com" className="text-muted-foreground hover:text-accent transition-colors">info@usha1960.trade</a>
            </div>
            <div className="flex items-center justify-center md:justify-start space-x-2">
              <Phone size={18} />
              <a href="tel:9961295835" className="text-muted-foreground hover:text-accent transition-colors">+91 (996) 129-5835</a>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3 text-primary">Follow Us</h3>
            <div className="flex justify-center md:justify-start space-x-4">
              <a href="#" aria-label="Facebook" className="text-muted-foreground hover:text-accent transition-colors"><Facebook size={22} /></a>
              <a href="#" aria-label="Twitter" className="text-muted-foreground hover:text-accent transition-colors"><Twitter size={22} /></a>
              <a href="#" aria-label="Instagram" className="text-muted-foreground hover:text-accent transition-colors"><Instagram size={22} /></a>
            </div>
          </div>
        </div>
        <div className="text-center text-sm text-muted-foreground mt-8 pt-8 border-t border-border/50">
          <p>&copy; {new Date().getFullYear()} ushªOªpp. All rights reserved. Designed with passion.</p>
        </div>
      </footer>
    </div>
  );
}
