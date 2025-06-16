
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
  const logoSrc = "/logo.png"; 

  return (
    <Image
      src={logoSrc}
      alt={alt}
      width={width}
      height={height}
      className={cn(
        "rounded-lg",
        className
      )}
      style={{ height: 'auto' }} 
      priority 
      data-ai-hint="app logo"
    />
  );
}
