import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

export function StaticShopLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width="50"
      height="50"
      aria-label="StaticShop Logo"
      className={cn("rounded-lg", className)}
      {...props}
    >
      <rect width="100" height="100" rx="15" fill="hsl(var(--primary))" />
      <text
        x="50%"
        y="52%" /* Adjusted for better vertical alignment */
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="40"
        fontWeight="bold"
        fill="hsl(var(--primary-foreground))"
        fontFamily="var(--font-geist-sans)"
      >
        S S
      </text>
    </svg>
  );
}
