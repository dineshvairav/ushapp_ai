
"use client";

import type { Metadata } from 'next';
import { MainAppLayout } from '@/components/layout/MainAppLayout';
import { products as allProducts, type Product } from '@/data/products';
import { ProductCard } from '@/components/shop/ProductCard';
import { Badge } from '@/components/ui/badge';
import { Percent } from 'lucide-react';

// export const metadata: Metadata = { // Metadata should be defined in Server Components or layout files
//   title: 'Special Deals - ushªOªpp',
//   description: 'Check out the latest special deals and offers at ushªOªpp.',
// };

// For demonstration, let's pick the first 3 products as "deals"
const dealProducts: Product[] = allProducts.slice(0, 3).map(p => ({
    ...p,
}));


export default function DealsPage() {
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
          Grab these amazing offers while they last!
        </p>
      </div>

      {dealProducts.length > 0 ? (
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
      ) : (
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
