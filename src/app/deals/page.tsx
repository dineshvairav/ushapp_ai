
"use client";

import { useEffect, useState } from 'react';
import { MainAppLayout } from '@/components/layout/MainAppLayout';
import type { Product } from '@/data/products';
import { ProductCard } from '@/components/shop/ProductCard';
import { Badge } from '@/components/ui/badge';
import { Percent, Loader2, AlertTriangle } from 'lucide-react';
import { rtdb } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';

export default function DealsPage() {
  const [dealProducts, setDealProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const productsRef = ref(rtdb, 'products');
    const unsubscribe = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const productList: Product[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        // For demonstration, let's pick the first 3 products as "deals"
        // Or products with MOP for a more "deal-like" feel
        const potentialDeals = productList.filter(p => p.mop && p.mop > p.price);
        setDealProducts(potentialDeals.length > 0 ? potentialDeals.slice(0, 4) : productList.slice(0, 4));
        setError(null);
      } else {
        setDealProducts([]);
      }
      setIsLoading(false);
    }, (err) => {
      console.error("Firebase RTDB read error on deals page:", err);
      setError("Failed to load deals from the database. Please try again later.");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <MainAppLayout>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Percent className="h-10 w-10 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Special Deals
          </h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Grab these amazing offers while they last! Live from our database.
        </p>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center min-h-[30vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Loading deals...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md flex items-center gap-3">
          <AlertTriangle className="h-6 w-6" />
          <div>
            <h3 className="font-semibold">Error Loading Deals</h3>
            <p>{error}</p>
          </div>
        </div>
      )}

      {!isLoading && !error && dealProducts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {dealProducts.map((product) => (
            <div key={product.id} className="relative group">
              <ProductCard product={product} />
              <Badge 
                variant="destructive" 
                className="absolute top-3 right-3 text-sm py-1 px-2.5 animate-custom-pulse"
              >
                DEAL!
              </Badge>
            </div>
          ))}
        </div>
      )}
      
      {!isLoading && !error && dealProducts.length === 0 && (
        <p className="text-xl text-muted-foreground text-center py-10">
          No special deals available right now. Check back soon!
        </p>
      )}

      <style jsx global>{`
        @keyframes customPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        .animate-custom-pulse {
          animation: customPulse 1.5s infinite ease-in-out;
        }
      `}</style>
    </MainAppLayout>
  );
}
