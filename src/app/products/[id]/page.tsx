
import { products, type Product as ProductType } from '@/data/products';
import { MainAppLayout } from '@/components/layout/MainAppLayout';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Star, ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { use } from 'react'; // Ensure 'use' is imported from React

// Helper function to get product by ID (simulates API call)
async function getProduct(id: string): Promise<ProductType | undefined> {
  return products.find(p => p.id === id);
}

export async function generateStaticParams() {
  return products.map(product => ({
    id: product.id,
  }));
}

interface ProductDetailsPageProps {
  params: Promise<{ id: string }>; // Changed to Promise
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>; // Changed to Promise
}

export default async function ProductDetailsPage(props: ProductDetailsPageProps) {
  // Unwrap props using React.use()
  const params = use(props.params);
  const searchParams = use(props.searchParams); // Even if not used, unwrap if typed as Promise

  const product = await getProduct(params.id);

  if (!product) {
    return (
      <MainAppLayout>
        <div className="text-center py-20">
          <h1 className="text-2xl font-semibold">Product not found</h1>
          <Link href="/shop">
            <Button variant="link" className="mt-4 text-primary">Back to Shop</Button>
          </Link>
        </div>
      </MainAppLayout>
    );
  }

  return (
    <MainAppLayout>
      <div className="mb-6">
        <Link href="/shop" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Shop
        </Link>
      </div>
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Image Carousel */}
        <div className="md:sticky md:top-24">
           <Carousel className="w-full max-w-md mx-auto rounded-lg overflow-hidden shadow-xl border border-border bg-card">
            <CarouselContent>
              {product.images.map((img, index) => (
                <CarouselItem key={index}>
                  <div className="aspect-square relative">
                    <Image
                      src={img.src}
                      alt={`${product.name} image ${index + 1}`}
                      fill
                      className="object-cover"
                      data-ai-hint={img.hint}
                      priority={index === 0}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {product.images.length > 1 && (
              <>
                <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-primary text-foreground hover:text-primary-foreground border-none" />
                <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-primary text-foreground hover:text-primary-foreground border-none" />
              </>
            )}
          </Carousel>
        </div>

        {/* Product Info */}
        <div className="py-4">
          <Badge variant="outline" className="mb-2 border-accent text-accent">{product.category.toUpperCase()}</Badge>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground mb-3">{product.name}</h1>
          
          <div className="flex items-center mb-4">
            <div className="flex items-center text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-5 w-5 ${i < 4 ? 'fill-current' : 'text-muted'}`} /> // Static rating
              ))}
            </div>
            <span className="ml-2 text-sm text-muted-foreground">(123 reviews)</span> {/* Static review count */}
          </div>

          <p className="text-3xl font-extrabold text-primary mb-6">${product.price.toFixed(2)}</p>
          
          <p className="text-base text-muted-foreground mb-6 leading-relaxed">{product.description}</p>

          {product.stock && product.stock > 0 ? (
             <p className="text-sm text-green-500 mb-6">In Stock ({product.stock} available)</p>
           ) : (
             <p className="text-sm text-red-500 mb-6">Out of Stock</p>
           )}

          <Button size="lg" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground transition-colors duration-300">
            <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
          </Button>

          {product.details && Object.keys(product.details).length > 0 && (
            <div className="mt-8 pt-6 border-t border-border">
              <h3 className="text-xl font-semibold text-foreground mb-4">Product Details</h3>
              <ul className="space-y-2 text-sm">
                {Object.entries(product.details).map(([key, value]) => (
                  <li key={key} className="flex justify-between">
                    <span className="text-muted-foreground">{key}:</span>
                    <span className="text-foreground font-medium text-right">{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      {/* Related Products Section (Placeholder) */}
      <Separator className="my-12" />
      <div>
        <h2 className="text-2xl font-bold text-center mb-8 text-foreground">You Might Also Like</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {/* Placeholder for related product cards */}
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
              <div className="aspect-square bg-muted rounded mb-3"></div>
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    </MainAppLayout>
  );
}
