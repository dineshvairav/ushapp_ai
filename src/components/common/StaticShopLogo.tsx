
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
        // Ensure h-auto or w-auto is applied if only one dimension might be controlled by external CSS
        // However, since width and height props are passed, this should be managed by next/image
        className
      )}
      style={{ aspectRatio: `${width}/${height}` }} // Explicitly set aspect ratio
      priority
      data-ai-hint="app logo"
    />
  );
}
