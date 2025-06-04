
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Product } from '@/data/products';
import { ArrowRight, Tag } from 'lucide-react';
import { useState, useEffect } from 'react';
import { rtdb, auth } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import type { User } from 'firebase/auth';
import type { AppSettings } from '@/app/admin/settings/page';

const defaultCurrencySymbol = '₹';
const PLACEHOLDER_IMAGE_URL_400 = 'https://placehold.co/400x400.png';

export function ProductCard({ product }: ProductCardProps) {
  const firstImage = product.images?.[0];
  const imageSrc = firstImage?.src || PLACEHOLDER_IMAGE_URL_400;
  
  let imageHint = "product photo"; 
  if (!imageSrc || imageSrc === PLACEHOLDER_IMAGE_URL_400) {
    imageHint = "placeholder image";
  } else if (firstImage?.hint) {
    imageHint = firstImage.hint.split(' ').slice(0, 2).join(' ');
  }


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
          console.error("Error fetching custom claims for product card:", error);
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
  // Show MOP strikethrough if user is logged in, not a dealer, and MOP exists.
  const showMop = currentUser && !isDealer && !!product.mop;


  return (
    <Card className="overflow-hidden h-full flex flex-col bg-card border-border hover:shadow-xl hover:border-primary/50 transition-all duration-300 ease-out rounded-lg group">
      <CardHeader className="p-0 relative">
        <Link href={`/products/${product.id}`} className="block aspect-square overflow-hidden">
          <Image
            src={imageSrc}
            alt={product.name}
            width={400}
            height={400}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300 ease-out"
            data-ai-hint={imageHint}
          />
        </Link>
        {isDealer && product.dp && (
          <div className="absolute top-2 left-2 bg-accent text-accent-foreground px-2 py-1 text-xs font-semibold rounded-md flex items-center shadow-lg">
            <Tag size={12} className="mr-1" /> Dealer Price
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg font-semibold mb-1 leading-tight hover:text-primary transition-colors">
          <Link href={`/products/${product.id}`}>{product.name}</Link>
        </CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {product.description}
        </p>
        {isLoadingSettings || isLoadingAuth ? (
             <div className="h-7 w-20 bg-muted rounded animate-pulse my-1"></div>
        ) : (
        <>
            <p className="text-xl font-bold text-primary">
            {currencySymbol}{displayPrice.toFixed(2)}
            </p>
            {showMop && product.mop && ( // Ensure product.mop exists before trying to display it
            <p className="text-xs text-muted-foreground line-through">
                M.R.P: {currencySymbol}{product.mop.toFixed(2)}
            </p>
            )}
        </>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button asChild variant="outline" className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
          <Link href={`/products/${product.id}`}>
            View More <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

interface ProductCardProps {
  product: Product;
}
