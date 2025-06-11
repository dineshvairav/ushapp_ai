
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
  // This component expects the logo image to be located at `public/logo.png`
  const logoSrc = "/logo.png";
  // const placeholderSrc = `https://placehold.co/${width}x${height}.png?text=Logo`;

  return (
    <Image
      src={logoSrc}
      alt={alt}
      width={width}
      height={height}
      className={cn(
        "rounded-lg",
        // "h-auto", // Removed based on previous interaction; width/height props should define aspect.
        className
      )}
      priority
      data-ai-hint="app logo"
    />
  );
}
