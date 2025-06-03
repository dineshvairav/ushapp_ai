
import type { Product as ProductType } from '@/data/products';
import { MainAppLayout } from '@/components/layout/MainAppLayout';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Star, ChevronLeft, PackageOpen, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { rtdb } from '@/lib/firebase';
import { ref, get, child, query, limitToFirst, orderByChild, equalTo } from 'firebase/database';
import { ProductCard } from '@/components/shop/ProductCard'; // For related products

async function getProductFromDB(id: string): Promise<ProductType | undefined> {
  try {
    const productRef = child(ref(rtdb, 'products'), id);
    const snapshot = await get(productRef);
    if (snapshot.exists()) {
      return { id: snapshot.key, ...snapshot.val() } as ProductType;
    }
    return undefined;
  } catch (error) {
    console.error(`Error fetching product ${id} from RTDB:`, error);
    return undefined;
  }
}

async function getRelatedProducts(currentProduct: ProductType): Promise<ProductType[]> {
  if (!currentProduct.category) return [];
  try {
    const productsRef = ref(rtdb, 'products');
    const categoryQuery = query(
      productsRef,
      orderByChild('category'),
      equalTo(currentProduct.category),
      limitToFirst(5) 
    );
    const snapshot = await get(categoryQuery);
    if (snapshot.exists()) {
      const productList: ProductType[] = [];
      snapshot.forEach(childSnapshot => {
        if (childSnapshot.key !== currentProduct.id) {
          productList.push({ id: childSnapshot.key!, ...childSnapshot.val() });
        }
      });
      return productList.slice(0, 4); 
    }
    return [];
  } catch (error) {
    // Log the error but return an empty array to prevent page crash if index is missing
    console.error(`Error fetching related products for category ${currentProduct.category}:`, error.message);
    // You might want to add a more user-friendly error message or logging here
    return []; 
  }
}


export async function generateStaticParams() {
  try {
    const productsRef = ref(rtdb, 'products');
    const snapshot = await get(productsRef);
    if (snapshot.exists()) {
      const productIds = Object.keys(snapshot.val());
      return productIds.map((id) => ({
        id: id,
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching product IDs for generateStaticParams (product details):", error);
    return []; 
  }
}

interface ProductDetailsPageProps {
  params: Promise<{ id: string; }>;
}

export default async function ProductDetailsPage({ params: paramsPromise }: ProductDetailsPageProps) {
  const { id } = await paramsPromise;
  const product = await getProductFromDB(id);
  let relatedProducts: ProductType[] = [];

  if (product) {
    relatedProducts = await getRelatedProducts(product);
  }


  if (product === undefined && id) {
     return (
      <MainAppLayout>
        <div className="text-center py-10">
          <Loader2 className="mx-auto h-16 w-16 text-primary animate-spin mb-4" />
          <h1 className="text-2xl font-semibold text-foreground mb-2">Loading Product Details...</h1>
          <p className="text-muted-foreground mb-6">Attempting to fetch product with ID "{id}" from the database.</p>
          <p className="text-xs text-muted-foreground">If this persists, the product may not exist or there might be a connection issue.</p>
          <Button asChild variant="link" className="mt-4 text-primary">
            <Link href="/shop">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Shop
            </Link>
          </Button>
        </div>
      </MainAppLayout>
    );
  }

  if (!product) {
    return (
      <MainAppLayout>
        <div className="text-center py-20">
          <PackageOpen className="mx-auto h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-semibold">Product not found</h1>
          <p className="text-muted-foreground mb-6">The product with ID "{id}" could not be found in the database.</p>
          <Link href="/shop">
            <Button variant="link" className="mt-4 text-primary">
             <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Shop
            </Button>
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
        <div className="md:sticky md:top-24">
           <Carousel className="w-full max-w-md mx-auto rounded-lg overflow-hidden shadow-xl border border-border bg-card">
            <CarouselContent>
              {product.images && product.images.length > 0 ? (
                product.images.map((img, index) => {
                  const imageSrc = img.src || 'https://placehold.co/600x600.png';
                  const imageHint = img.src ? (img.hint || 'product photo') : 'placeholder image';
                  return (
                    <CarouselItem key={index}>
                      <div className="aspect-square relative">
                        <Image
                          src={imageSrc}
                          alt={`${product.name} image ${index + 1}`}
                          fill
                          className="object-cover"
                          data-ai-hint={imageHint}
                          priority={index === 0}
                        />
                      </div>
                    </CarouselItem>
                  );
                })
              ) : (
                <CarouselItem>
                  <div className="aspect-square relative bg-muted flex items-center justify-center">
                     <Image src="https://placehold.co/600x600.png" alt="Placeholder image" fill className="object-cover opacity-50" data-ai-hint="placeholder image" />
                     <p className="text-muted-foreground z-10">No image available</p>
                  </div>
                </CarouselItem>
              )}
            </CarouselContent>
            {product.images && product.images.length > 1 && (
              <>
                <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-primary text-foreground hover:text-primary-foreground border-none" />
                <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-primary text-foreground hover:text-primary-foreground border-none" />
              </>
            )}
          </Carousel>
        </div>

        <div className="py-4">
          {product.category && ( // Assuming category is an ID, you might want to fetch category name
            <Badge variant="outline" className="mb-2 border-accent text-accent">{(product.category).toUpperCase()}</Badge>
          )}
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground mb-3">{product.name}</h1>
          
          <div className="flex items-center mb-4">
            <div className="flex items-center text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-5 w-5 ${i < 4 ? 'fill-current' : 'text-muted'}`} /> 
              ))}
            </div>
            <span className="ml-2 text-sm text-muted-foreground">(123 reviews)</span> 
          </div>

          <p className="text-3xl font-extrabold text-primary mb-6">₹{product.price.toFixed(2)}</p>
          
          {product.mop && product.mop > product.price && ( // Show MOP only if it's higher than price
            <p className="text-sm text-muted-foreground mb-1">
              M.R.P.: <span className="line-through">₹{product.mop.toFixed(2)}</span>
            </p>
          )}
           {product.dp && (
            <p className="text-sm text-muted-foreground mb-1">
              Dealer Price: <span className="font-semibold text-accent">₹{product.dp.toFixed(2)}</span>
            </p>
          )}


          <p className="text-base text-muted-foreground mb-6 leading-relaxed">{product.description}</p>

          {product.qty !== undefined && product.qty > 0 ? (
             <p className="text-sm text-green-500 mb-6">In Stock ({product.qty} available)</p>
           ) : product.qty === 0 ? (
             <p className="text-sm text-red-500 mb-6">Out of Stock</p>
           ) : (
             <p className="text-sm text-yellow-500 mb-6">Stock level not specified</p>
           )}

          <Button size="lg" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground transition-colors duration-300" disabled={product.qty === 0}>
            <ShoppingCart className="mr-2 h-5 w-5" /> {product.qty === 0 ? "Out of Stock" : "Add to Cart"}
          </Button>

          {product.details && Object.keys(product.details).length > 0 && (
            <div className="mt-8 pt-6 border-t border-border">
              <h3 className="text-xl font-semibold text-foreground mb-4">Product Details</h3>
              <ul className="space-y-2 text-sm">
                {Object.entries(product.details).map(([key, value]) => (
                  <li key={key} className="flex justify-between">
                    <span className="text-muted-foreground">{key}:</span>
                    <span className="text-foreground font-medium text-right">{String(value)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      {relatedProducts.length > 0 && (
        <>
          <Separator className="my-12" />
          <div>
            <h2 className="text-2xl font-bold text-center mb-8 text-foreground">You Might Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        </>
      )}
    </MainAppLayout>
  );
}
