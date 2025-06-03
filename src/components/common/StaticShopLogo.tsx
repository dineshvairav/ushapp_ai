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
  // Temporarily using a placeholder.
  // For your actual logo, place 'logo.png' in the '/public' directory.
  const logoSrc = "/logo.png"; // This will work if public/logo.png exists.
  const placeholderSrc = `https://placehold.co/${width}x${height}.png?text=Logo`;

  return (
    <Image
      // Attempt to load the actual logo, if it fails, Next.js's default behavior for broken images will occur.
      // For a more robust fallback an onError handler could be used, but this keeps it simple for now
      // and directs the user to place their logo correctly.
      src={logoSrc} 
      alt={alt}
      width={width}
      height={height}
      className={cn("rounded-lg", className)}
      priority 
      // If you want to force a placeholder until the logo is fixed, uncomment the line below and comment out the src={logoSrc} line.
      // src={placeholderSrc}
      // data-ai-hint="logo placeholder" // Use this if forcing placeholder
      data-ai-hint="app logo" // Assuming the user will place their logo
      onError={(e) => {
        // If the logo.png fails to load, switch to a placeholder
        // This requires the component to be a client component or for this logic to be handled differently
        // For simplicity with server components, we'll rely on the user placing the logo.
        // If this were a client component, we could do: e.currentTarget.src = placeholderSrc;
        // console.warn("Logo not found at /logo.png, consider adding it to your /public folder.");
      }}
    />
  );
}
