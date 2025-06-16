
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Star, Tag, Loader2 } from 'lucide-react';
import type { Product } from '@/data/products';
import { auth, rtdb, firestore } from '@/lib/firebase'; // Added firestore
import { ref as rtdbRef, onValue as onRtdbValue } from 'firebase/database';
import { doc, getDoc } from "firebase/firestore"; // Added firestore imports
import type { User } from 'firebase/auth';
import type { AppSettings } from '@/app/admin/settings/page';
import type { Category } from '@/data/categories';

interface ProductDisplayPricingProps {
  product: Product;
}

const defaultCurrencySymbol = '₹';

export default function ProductDisplayPricing({ product }: ProductDisplayPricingProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isDealer, setIsDealer] = useState(false);
  const [isLoadingAuthAndRoles, setIsLoadingAuthAndRoles] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState(defaultCurrencySymbol);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [isLoadingCategory, setIsLoadingCategory] = useState(true);

  useEffect(() => {
    // Fetch App Settings (Currency Symbol)
    const settingsDbRef = rtdbRef(rtdb, 'appSettings');
    const unsubscribeSettings = onRtdbValue(settingsDbRef, (snapshot) => {
      const data = snapshot.val() as AppSettings | null;
      setCurrencySymbol(data?.currencySymbol || defaultCurrencySymbol);
      setIsLoadingSettings(false);
    }, () => {
      setCurrencySymbol(defaultCurrencySymbol);
      setIsLoadingSettings(false);
    });

    // Auth State Change Listener & Firestore Role Fetch
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      setIsLoadingAuthAndRoles(true);
      if (user) {
        setCurrentUser(user);
        try {
          const userProfileRef = doc(firestore, "userProfiles", user.uid);
          const docSnap = await getDoc(userProfileRef);
          if (docSnap.exists() && docSnap.data().isDealer === true) {
            setIsDealer(true);
          } else {
            setIsDealer(false);
          }
        } catch (error) {
          console.error("Error fetching user dealer status from Firestore:", error);
          setIsDealer(false);
        }
      } else {
        setCurrentUser(null);
        setIsDealer(false);
      }
      setIsLoadingAuthAndRoles(false);
    });

    // Fetch Category Name
    if (product.category) {
      setIsLoadingCategory(true);
      const categoryDbRef = rtdbRef(rtdb, `categories/${product.category}`);
      const unsubscribeCategory = onRtdbValue(categoryDbRef, (snapshot) => {
        const catData = snapshot.val() as Category | null;
        setCategoryName(catData?.name || product.category);
        setIsLoadingCategory(false);
      }, () => {
        setCategoryName(product.category);
        setIsLoadingCategory(false);
      });
       return () => {
        unsubscribeAuth();
        unsubscribeSettings();
        unsubscribeCategory();
      };
    }

    return () => {
      unsubscribeAuth();
      unsubscribeSettings();
    };
  }, [product.category]);

  let actualSellingPrice: number | null = null;
  let originalMrpDisplayValue: number | null = null;
  let shouldShowOriginalMrpStrikethrough = false;
  let isDealerPriceApplied = false;

  if (!isLoadingAuthAndRoles && !isLoadingSettings) {
    if (isDealer && product.dp != null && !isNaN(Number(product.dp))) {
      actualSellingPrice = Number(product.dp);
      isDealerPriceApplied = true;
    } else {
      if (product.mop != null && !isNaN(Number(product.mop))) {
        actualSellingPrice = Number(product.mop);
        if (product.price > actualSellingPrice) {
          originalMrpDisplayValue = product.price;
          shouldShowOriginalMrpStrikethrough = true;
        }
      } else {
        actualSellingPrice = product.price;
      }
    }
    if (actualSellingPrice === null) {
      actualSellingPrice = product.price;
    }
  }

  if (isLoadingAuthAndRoles || isLoadingSettings || isLoadingCategory || actualSellingPrice === null) {
    return (
      <div className="py-4">
        <div className="h-6 w-1/4 bg-muted rounded animate-pulse mb-2"></div>
        <div className="h-10 w-3/4 bg-muted rounded animate-pulse mb-3"></div>
        <div className="h-8 w-1/3 bg-muted rounded animate-pulse mb-3"></div>
        <div className="h-5 w-1/4 bg-muted rounded animate-pulse mb-1"></div>
        <div className="h-6 w-1/2 bg-muted rounded animate-pulse mb-6"></div>
        <Button size="lg" className="w-full sm:w-auto" disabled>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...
        </Button>
      </div>
    );
  }

  return (
    <div className="py-4">
      {categoryName && (
        <Badge variant="outline" className="mb-2 border-accent text-accent uppercase tracking-wide">
          {categoryName}
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

      {shouldShowOriginalMrpStrikethrough && originalMrpDisplayValue != null && (
        <p className="text-sm text-muted-foreground line-through mb-1">
          M.R.P.: {currencySymbol}{originalMrpDisplayValue.toFixed(2)}
        </p>
      )}

      {isDealerPriceApplied && (
        <div className="text-sm text-accent mb-4 font-semibold flex items-center">
          <Tag size={14} className="mr-1.5" /> Dealer Price Applied
        </div>
      )}
       {!isLoadingAuthAndRoles && !currentUser && product.dp && (
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
    </div>
  );
}
