
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Star, Tag, Loader2 } from 'lucide-react';
import type { Product } from '@/data/products';
import { auth, rtdb } from '@/lib/firebase'; // Import rtdb
import { ref, onValue } from 'firebase/database'; // Import onValue
import type { User } from 'firebase/auth';
import type { AppSettings } from '@/app/admin/settings/page'; // Import AppSettings type

interface ProductDisplayPricingProps {
  product: Product;
}

const defaultCurrencySymbol = '₹'; // Fallback currency

export default function ProductDisplayPricing({ product }: ProductDisplayPricingProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isDealer, setIsDealer] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState(defaultCurrencySymbol);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    const settingsRef = ref(rtdb, 'appSettings');
    const unsubscribeSettings = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val() as AppSettings | null;
      if (data && data.currencySymbol) {
        setCurrencySymbol(data.currencySymbol);
      } else {
        setCurrencySymbol(defaultCurrencySymbol);
      }
      setIsLoadingSettings(false);
    }, () => {
      setCurrencySymbol(defaultCurrencySymbol); // Fallback on error
      setIsLoadingSettings(false);
    });

    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const idTokenResult = await user.getIdTokenResult(true); // Force refresh token
          setIsDealer(idTokenResult.claims.isDealer === true);
        } catch (error) {
          console.error("Error fetching custom claims:", error);
          setIsDealer(false);
        }
      } else {
        setCurrentUser(null);
        setIsDealer(false);
      }
      setIsLoadingAuth(false);
    });
    
    return () => {
      unsubscribeAuth();
      unsubscribeSettings();
    };
  }, []);

  const displayPrice = isDealer && product.dp ? product.dp : product.price;
  const showMop = !isDealer && product.mop && product.mop > product.price;

  if (isLoadingAuth || isLoadingSettings) {
    return (
      <div className="py-4">
        <div className="h-8 w-1/3 bg-muted rounded animate-pulse mb-3"></div> {/* Price placeholder */}
        <div className="h-5 w-1/4 bg-muted rounded animate-pulse mb-1"></div> {/* MOP/DP placeholder */}
        <div className="h-6 w-1/2 bg-muted rounded animate-pulse mb-6"></div> {/* Stock placeholder */}
        <Button size="lg" className="w-full sm:w-auto" disabled>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...
        </Button>
      </div>
    );
  }

  return (
    <div className="py-4">
      {product.category && (
        <Badge variant="outline" className="mb-2 border-accent text-accent">
          {product.category.toUpperCase()}
        </Badge>
      )}
      <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground mb-3">{product.name}</h1>

      <div className="flex items-center mb-4">
        <div className="flex items-center text-yellow-400">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`h-5 w-5 ${i < 4 ? 'fill-current' : 'text-muted'}`} />
          ))}
        </div>
        <span className="ml-2 text-sm text-muted-foreground">(123 reviews)</span>
      </div>

      <p className="text-3xl font-extrabold text-primary mb-1">
        {currencySymbol}{displayPrice.toFixed(2)}
      </p>

      {showMop && product.mop && (
        <p className="text-sm text-muted-foreground mb-1">
          M.R.P.: <span className="line-through">{currencySymbol}{product.mop.toFixed(2)}</span>
        </p>
      )}

      {isDealer && product.dp && (
        <div className="text-sm text-accent mb-4 font-semibold flex items-center">
          <Tag size={14} className="mr-1.5" /> Dealer Price Applied
        </div>
      )}
       {!isDealer && product.dp && (
         <p className="text-xs text-muted-foreground mb-4">(Special dealer pricing available for registered dealers)</p>
       )}


      <p className="text-base text-muted-foreground mb-6 leading-relaxed">{product.description}</p>

      {product.qty !== undefined && product.qty > 0 ? (
        <p className="text-sm text-green-500 mb-6">In Stock ({product.qty} available)</p>
      ) : product.qty === 0 ? (
        <p className="text-sm text-red-500 mb-6">Out of Stock</p>
      ) : (
        <p className="text-sm text-yellow-500 mb-6">Stock level not specified</p>
      )}

      <Button
        size="lg"
        className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground transition-colors duration-300"
        disabled={product.qty === 0}
      >
        <ShoppingCart className="mr-2 h-5 w-5" /> {product.qty === 0 ? "Out of Stock" : "Add to Cart"}
      </Button>
      
      {!isLoadingAuth && !isDealer && (
          <p className="text-xs text-muted-foreground mt-4">
            Note: Dealer pricing is available for approved accounts. Admin sets dealer status via Firebase Custom Claims.
          </p>
      )}
      
    </div>
  );
}
