
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
  const logoSrc = "/logo.png"; // This will work if public/logo.png exists.
  // const placeholderSrc = `https://placehold.co/${width}x${height}.png?text=Logo`;

  return (
    <Image
      src={logoSrc}
      alt={alt}
      width={width}
      height={height}
      className={cn(
        "rounded-lg",
        "h-auto", // Add h-auto to maintain aspect ratio if width is styled by CSS
        className
      )}
      priority
      data-ai-hint="app logo"
    />
  );
}
