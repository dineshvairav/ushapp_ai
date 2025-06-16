
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Product } from '@/data/products';
import { ArrowRight, Tag, Loader2 } from 'lucide-react'; 
import { useState, useEffect } from 'react';
import { auth, rtdb, firestore } from '@/lib/firebase'; 
import { ref as rtdbRef, onValue as onRtdbValue } from 'firebase/database';
import { doc, getDoc } from "firebase/firestore"; 
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

  const [isDealer, setIsDealer] = useState(false);
  const [isLoadingAuthAndRoles, setIsLoadingAuthAndRoles] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState(defaultCurrencySymbol);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    const settingsDbRef = rtdbRef(rtdb, 'appSettings');
    const unsubscribeSettings = onRtdbValue(settingsDbRef, (snapshot) => {
      const data = snapshot.val() as AppSettings | null;
      setCurrencySymbol(data?.currencySymbol || defaultCurrencySymbol);
      setIsLoadingSettings(false);
    }, () => {
      setCurrencySymbol(defaultCurrencySymbol);
      setIsLoadingSettings(false);
    });

    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      setIsLoadingAuthAndRoles(true);
      if (user) {
        try {
          const userProfileRef = doc(firestore, "userProfiles", user.uid);
          const docSnap = await getDoc(userProfileRef);
          setIsDealer(docSnap.exists() && docSnap.data().isDealer === true);
        } catch (error) {
          console.error("Error fetching user dealer status for product card:", error);
          setIsDealer(false);
        }
      } else {
        setIsDealer(false);
      }
      setIsLoadingAuthAndRoles(false);
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

  if (!isLoadingAuthAndRoles && !isLoadingSettings) {
    if (isDealer && product.dp != null && !isNaN(Number(product.dp))) {
      actualSellingPrice = Number(product.dp);
      isDealerPriceApplied = true;
    } else {
      if (product.mop != null && !isNaN(Number(product.mop))) {
        actualSellingPrice = Number(product.mop);
        if (product.price > actualSellingPrice) {
          mrpStrikethroughValue = product.price;
          shouldShowMrpStrikethrough = true;
        }
      } else {
        actualSellingPrice = product.price;
      }
    }
    if (actualSellingPrice === null) {
        actualSellingPrice = product.price;
    }
  }

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
            priority 
          />
        </Link>
        {isDealerPriceApplied && (
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
        {isLoadingSettings || isLoadingAuthAndRoles || actualSellingPrice === null ? (
             <div className="flex items-center">
                <Loader2 className="h-5 w-5 text-primary animate-spin mr-2" /> 
                <div className="h-6 w-16 bg-muted rounded animate-pulse"></div>
             </div>
        ) : (
        <>
            <p className="text-xl font-bold text-primary">
              {currencySymbol}{actualSellingPrice.toFixed(2)}
            </p>
            {shouldShowMrpStrikethrough && mrpStrikethroughValue != null && (
            <p className="text-xs text-muted-foreground line-through">
                M.R.P: {currencySymbol}{mrpStrikethroughValue.toFixed(2)}
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
