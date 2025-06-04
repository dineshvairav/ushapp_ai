
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Star, Tag, Loader2 } from 'lucide-react';
import type { Product } from '@/data/products';
import { auth, rtdb } from '@/lib/firebase'; 
import { ref, onValue } from 'firebase/database'; 
import type { User } from 'firebase/auth';
import type { AppSettings } from '@/app/admin/settings/page'; 

interface ProductDisplayPricingProps {
  product: Product;
}

const defaultCurrencySymbol = '₹'; 

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
      setCurrencySymbol(defaultCurrencySymbol); 
      setIsLoadingSettings(false);
    });

    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const idTokenResult = await user.getIdTokenResult(true); 
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

  let actualSellingPrice: number | null = null;
  let mrpStrikethroughValue: number | null = null;
  let shouldShowMrpStrikethrough = false;
  let isDealerPriceApplied = false;

  if (!isLoadingAuth && !isLoadingSettings) {
    if (isDealer && product.dp != null && !isNaN(Number(product.dp))) {
      actualSellingPrice = Number(product.dp);
      isDealerPriceApplied = true;
      // Dealers see their price directly, no M.R.P. strikethrough for now.
    } else {
      // This block handles non-dealers, or dealers if their DP isn't valid/set.
      if (product.mop != null && !isNaN(Number(product.mop))) {
        actualSellingPrice = Number(product.mop);
        if (product.price > actualSellingPrice) { // Only show original price as strikethrough if it's higher than MOP
          mrpStrikethroughValue = product.price;
          shouldShowMrpStrikethrough = true;
        }
      } else {
        actualSellingPrice = product.price; // Fallback to original price if MOP is not available
      }
    }
    // Ensure actualSellingPrice has a fallback if all else fails
    if (actualSellingPrice === null) {
        actualSellingPrice = product.price;
    }
  }


  if (isLoadingAuth || isLoadingSettings || actualSellingPrice === null) {
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
          {product.category.toUpperCase()} {/* This assumes category ID can be uppercased. Better to fetch category name if available */}
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
        {currencySymbol}{actualSellingPrice.toFixed(2)}
      </p>

      {shouldShowMrpStrikethrough && mrpStrikethroughValue != null && (
        <p className="text-sm text-muted-foreground line-through mb-1">
          M.R.P.: {currencySymbol}{mrpStrikethroughValue.toFixed(2)}
        </p>
      )}

      {isDealerPriceApplied && (
        <div className="text-sm text-accent mb-4 font-semibold flex items-center">
          <Tag size={14} className="mr-1.5" /> Dealer Price Applied
        </div>
      )}
       {!isLoadingAuth && !currentUser && product.dp && ( // Show if not loading auth, not logged in (so not dealer), and DP exists
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
      
      {!isLoadingAuth && !isDealer && ( // Show note about dealer pricing if user is not a dealer and auth check is complete
          <p className="text-xs text-muted-foreground mt-4">
            Note: Dealer pricing is available for approved accounts. Admin sets dealer status via Firebase Custom Claims.
          </p>
      )}
      
    </div>
  );
}
