
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Product } from '@/data/products';
import { ArrowRight } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="overflow-hidden h-full flex flex-col bg-card border-border hover:shadow-xl hover:border-primary/50 transition-all duration-300 ease-out rounded-lg group">
      <CardHeader className="p-0 relative">
        <Link href={`/products/${product.id}`} className="block aspect-square overflow-hidden">
          <Image
            src={product.images[0]?.src || 'https://placehold.co/400x400.png'}
            alt={product.name}
            width={400}
            height={400}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300 ease-out"
            data-ai-hint={product.images[0]?.hint || 'product image'}
          />
        </Link>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg font-semibold mb-1 leading-tight hover:text-primary transition-colors">
          <Link href={`/products/${product.id}`}>{product.name}</Link>
        </CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {product.description}
        </p>
        <p className="text-xl font-bold text-primary">
          ₹{product.price.toFixed(2)}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button asChild variant="outline" className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
          <Link href={`/products/${product.id}`}>
            View More <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
