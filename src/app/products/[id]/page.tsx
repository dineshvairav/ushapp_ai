
import type { Product as ProductType } from '@/data/products';
import { MainAppLayout } from '@/components/layout/MainAppLayout';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ChevronLeft, PackageOpen, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { rtdb } from '@/lib/firebase';
import { ref, get, child, query, limitToFirst, orderByChild, equalTo } from 'firebase/database';
import { ProductCard } from '@/components/shop/ProductCard';
import ProductDisplayPricing from './ProductDisplayPricing'; // Import the client component

const PLACEHOLDER_IMAGE_URL_600 = 'https://placehold.co/600x600.png';
const PLACEHOLDER_IMAGE_URL_400 = 'https://placehold.co/400x400.png';


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
    if (error instanceof Error) {
      console.error(`Error fetching related products for category ${currentProduct.category}:`, error.message);
    } else {
      console.error(`An unknown error occurred while fetching related products for category ${currentProduct.category}:`, error);
    }
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
                  const imageSrc = img.src || PLACEHOLDER_IMAGE_URL_600;
                  let imageHint = "product photo"; 
                  if (!img.src || img.src === PLACEHOLDER_IMAGE_URL_600 || img.src === PLACEHOLDER_IMAGE_URL_400) {
                    imageHint = "placeholder image";
                  } else if (img.hint) {
                    imageHint = img.hint.split(' ').slice(0, 2).join(' ');
                  }
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
                     <Image src={PLACEHOLDER_IMAGE_URL_600} alt="Placeholder image" fill className="object-cover opacity-50" data-ai-hint="placeholder image" />
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

        <ProductDisplayPricing product={product} />

      </div>
      
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
