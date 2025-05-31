import Image from 'next/image';
import { cn } from '@/lib/utils';

interface StaticShopLogoProps {
  width: number;
  height: number;
  alt?: string;
  className?: string;
}

export function StaticShopLogo({ 
  width, 
  height, 
  alt = "ushªOªpp Logo", 
  className 
}: StaticShopLogoProps) {
  return (
    <Image
      src="/logo.png" // Assumes your logo is at public/logo.png
      alt={alt}
      width={width}
      height={height}
      className={cn("rounded-lg", className)} // Maintains rounded corners and allows additional classes
      priority // Good practice for LCP elements like logos
    />
  );
}
