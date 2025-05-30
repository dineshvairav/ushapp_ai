
import Link from 'next/link';
import { StaticShopLogo } from '@/components/common/StaticShopLogo';
import { Mail, Phone, Facebook, Twitter, Instagram, MapPin, ShieldCheck } from 'lucide-react'; // Added ShieldCheck

export function AppFooter() {
  return (
    <footer className="bg-card text-card-foreground border-t border-border/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-8">
          <div className="lg:col-span-1">
            <Link href="/shop" className="inline-flex items-center gap-2 mb-4" aria-label="StaticShop Home">
              <StaticShopLogo className="h-10 w-10" />
              <span className="font-bold text-xl text-primary">StaticShop</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Curated products for a modern lifestyle. Quality and design at your fingertips.
            </p>
          </div>
          
          <div>
            <h3 className="text-md font-semibold mb-3 text-foreground uppercase tracking-wider">Shop</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/categories" className="text-muted-foreground hover:text-primary transition-colors">Categories</Link></li>
              <li><Link href="/deals" className="text-muted-foreground hover:text-primary transition-colors">Special Deals</Link></li>
              <li><Link href="/shop" className="text-muted-foreground hover:text-primary transition-colors">All Products</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-md font-semibold mb-3 text-foreground uppercase tracking-wider">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link href="/faq" className="text-muted-foreground hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link href="/shipping" className="text-muted-foreground hover:text-primary transition-colors">Shipping & Returns</Link></li>
              <li><Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li>
                <Link href="/admin" className="text-muted-foreground hover:text-primary transition-colors flex items-center">
                  <ShieldCheck size={16} className="mr-1.5 text-primary/80" /> Admin Panel
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-md font-semibold mb-3 text-foreground uppercase tracking-wider">Connect</h3>
             <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <MapPin size={16} className="text-primary" />
                  <a href="https://www.google.com/maps/search/?api=1&query=123+Static+Way,+Webville" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">123 Static Way, Webville</a>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail size={16} className="text-primary" />
                  <a href="mailto:info@staticshop.com" className="text-muted-foreground hover:text-primary transition-colors">info@staticshop.com</a>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone size={16} className="text-primary" />
                  <a href="tel:+15551234567" className="text-muted-foreground hover:text-primary transition-colors">+91 (996) 129-5835</a>
                </div>
              </div>
            <div className="flex space-x-3 mt-4">
              <a href="#" aria-label="Facebook" className="text-muted-foreground hover:text-primary transition-colors"><Facebook size={20} /></a>
              <a href="#" aria-label="Twitter" className="text-muted-foreground hover:text-primary transition-colors"><Twitter size={20} /></a>
              <a href="#" aria-label="Instagram" className="text-muted-foreground hover:text-primary transition-colors"><Instagram size={20} /></a>
            </div>
          </div>
        </div>
        
        <div className="text-center text-xs text-muted-foreground pt-8 border-t border-border/50">
          <p>&copy; {new Date().getFullYear()} StaticShop. All Rights Reserved. Minimalist design for maximum style.</p>
        </div>
      </div>
    </footer>
  );
}
