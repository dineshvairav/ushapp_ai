
"use client";

import Link from 'next/link';
import { StaticShopLogo } from '@/components/common/StaticShopLogo';
import { Button } from '@/components/ui/button';
import { ShoppingCart, UserCircle, Search, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from 'react';

const navLinks = [
  { href: '/shop', label: 'Shop' },
  { href: '/categories', label: 'Categories' },
  { href: '/deals', label: 'Deals' },
];

export function AppHeader() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/shop" className="flex items-center gap-2" aria-label="ushªOªpp Home">
          <StaticShopLogo width={32} height={32} alt="ushªOªpp Logo" />
          <span className="font-semibold text-lg hidden sm:inline-block text-foreground">ushªOªpp</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "transition-colors hover:text-primary",
                pathname === link.href ? "text-primary font-medium" : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>
          <Button asChild variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Link href="/profile">
              <UserCircle className="h-5 w-5" />
              <span className="sr-only">Account</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              0 {/* Static cart count */}
            </span>
            <span className="sr-only">Cart</span>
          </Button>

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6 text-muted-foreground hover:text-primary" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[340px] bg-card p-6">
              <div className="mb-8">
                <Link href="/shop" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                  <StaticShopLogo width={32} height={32} alt="ushªOªpp Logo" />
                  <span className="font-semibold text-lg text-foreground">ushªOªpp</span>
                </Link>
              </div>
              <nav className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "text-lg transition-colors hover:text-primary py-2",
                      pathname === link.href ? "text-primary font-medium" : "text-muted-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                 {/* Profile link for mobile menu */}
                <Link
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "text-lg transition-colors hover:text-primary py-2 flex items-center",
                      pathname === "/profile" ? "text-primary font-medium" : "text-muted-foreground"
                    )}
                  >
                    <UserCircle className="mr-2 h-5 w-5" />
                    Profile
                  </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
