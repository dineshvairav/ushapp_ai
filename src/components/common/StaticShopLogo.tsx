
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
  // The src path MUST start with a leading slash for local public assets.
  const logoSrc = "./logo.png"; 

  return (
    <Image
      src={logoSrc}
      alt={alt}
      width={width}
      height={height}
      className={cn(
        "rounded-lg",
        // Ensuring width and height props define aspect, not overridden by h-auto unless intended
        className
      )}
      style={{ height: 'auto' }} // Added to help maintain aspect ratio if CSS resizes
      priority
      data-ai-hint="app logo"
    />
  );
}
