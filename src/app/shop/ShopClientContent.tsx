
"use client"; 

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Product } from '@/data/products';
import { categories as allCategories, type Category } from '@/data/categories';
import { ProductCard } from '@/components/shop/ProductCard';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Link from 'next/link';
import { Plus, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { rtdb } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';

const PRODUCTS_PER_CAROUSEL_DISPLAY = 4;

interface CategoryWithProducts extends Category {
  products: Product[];
}

export function ShopClientContent() {
  const searchParams = useSearchParams();
  const selectedCategoryId = searchParams.get('category');

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const productsRef = ref(rtdb, 'products');
    const unsubscribe = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const productList: Product[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setAllProducts(productList);
        setError(null);
      } else {
        setAllProducts([]);
      }
      setIsLoading(false);
    }, (err) => {
      console.error("Firebase RTDB read error on shop page:", err);
      setError("Failed to load products from the database. Please try again later.");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const categoriesForCarousels: CategoryWithProducts[] = useMemo(() => {
    if (isLoading || error) return [];
    return allCategories
      .filter(category => category.id !== 'all') 
      .map(category => {
        const productsInCategory = allProducts.filter(
          product => product.category === category.id
        );
        return {
          ...category,
          products: productsInCategory,
        };
      })
      .filter(categoryGroup => categoryGroup.products.length > 0); 
  }, [allProducts, isLoading, error]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-300px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading products from database...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive text-destructive p-6 rounded-md flex flex-col items-center gap-3 text-center">
        <AlertTriangle className="h-10 w-10" />
        <div>
          <h3 className="font-semibold text-xl mb-2">Error Loading Products</h3>
          <p>{error}</p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()} className="mt-4 border-destructive text-destructive hover:bg-destructive/20">
          Try Again
        </Button>
      </div>
    );
  }

  if (selectedCategoryId) {
    const category = allCategories.find(cat => cat.id === selectedCategoryId && cat.id !== 'all');
    const productsToShow = allProducts.filter(prod => prod.category === selectedCategoryId);

    if (!category) {
      return (
        <>
          <div className="mb-6">
            <Button asChild variant="outline" size="sm">
              <Link href="/shop">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Shop
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">
            Category Not Found
          </h1>
          <p className="text-lg text-muted-foreground">
            The category you're looking for doesn't exist or has no products.
          </p>
        </>
      );
    }

    return (
      <>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary mb-1">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-lg text-muted-foreground">{category.description}</p>
            )}
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/shop">
              <ArrowLeft className="mr-2 h-4 w-4" />
              All Categories
            </Link>
          </Button>
        </div>

        {productsToShow.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {productsToShow.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-xl text-muted-foreground text-center py-10">
            No products available in the {category.name} category.
          </p>
        )}
      </>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-6">
          Shop by Category
        </h1>
      </div>

      <div className="space-y-12">
        {categoriesForCarousels.map((categoryGroup) => (
          <section key={categoryGroup.id} aria-labelledby={`category-title-${categoryGroup.id}`}>
            <div className="flex justify-between items-center mb-5">
              <h2 id={`category-title-${categoryGroup.id}`} className="text-2xl font-semibold text-primary">
                {categoryGroup.name}
              </h2>
              {categoryGroup.products.length > PRODUCTS_PER_CAROUSEL_DISPLAY && (
                <Button asChild variant="outline" size="sm" className="ml-auto border-accent text-accent hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Link href={`/shop?category=${categoryGroup.id}`}>
                    View More <Plus className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
            
            {categoryGroup.products.length > 0 ? (
              <Carousel
                opts={{
                  align: "start",
                  loop: categoryGroup.products.length > PRODUCTS_PER_CAROUSEL_DISPLAY, 
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-4">
                  {categoryGroup.products.slice(0, PRODUCTS_PER_CAROUSEL_DISPLAY).map((product) => (
                    <CarouselItem key={product.id} className="pl-4 sm:basis-1/2 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                      <div className="h-full p-1"> 
                        <ProductCard product={product} />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {categoryGroup.products.length > PRODUCTS_PER_CAROUSEL_DISPLAY && (
                  <>
                    <CarouselPrevious className="absolute left-[-20px] sm:left-[-25px] top-1/2 -translate-y-1/2 z-10 bg-card/80 hover:bg-primary text-foreground hover:text-primary-foreground border-primary/30 shadow-md h-8 w-8 sm:h-10 sm:w-10 hidden sm:flex" />
                    <CarouselNext className="absolute right-[-20px] sm:right-[-25px] top-1/2 -translate-y-1/2 z-10 bg-card/80 hover:bg-primary text-foreground hover:text-primary-foreground border-primary/30 shadow-md h-8 w-8 sm:h-10 sm:w-10 hidden sm:flex" />
                  </>
                )}
              </Carousel>
            ) : (
              <p className="text-muted-foreground">No products currently available in this category.</p>
            )}
          </section>
        ))}
        {categoriesForCarousels.length === 0 && allProducts.length > 0 && (
            <p className="text-xl text-muted-foreground text-center py-10">
                Products are available, but none match the defined categories for carousel display. Check product category assignments.
            </p>
        )}
        {allProducts.length === 0 && !isLoading && (
           <p className="text-xl text-muted-foreground text-center py-10">No products available in the store at the moment. Please check back later!</p>
        )}
      </div>
    </>
  );
}
