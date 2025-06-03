
"use client"; 

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Product } from '@/data/products';
import type { Category as CategoryType } from '@/data/categories'; // Renamed to avoid conflict
import { ProductCard } from '@/components/shop/ProductCard';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Link from 'next/link';
import { Plus, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { rtdb } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';

const PRODUCTS_PER_CAROUSEL_DISPLAY = 4;

interface CategoryWithProducts extends CategoryType {
  products: Product[];
}

export function ShopClientContent() {
  const searchParams = useSearchParams();
  const selectedCategoryId = searchParams.get('category');

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [dbCategories, setDbCategories] = useState<CategoryType[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const productsRef = ref(rtdb, 'products');
    const unsubscribeProducts = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const productList: Product[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setAllProducts(productList);
        if (error && error.includes("products")) setError(null); // Clear product-specific error if successful
      } else {
        setAllProducts([]);
      }
      setIsLoadingProducts(false);
    }, (err) => {
      console.error("Firebase RTDB read error (products):", err);
      setError("Failed to load products. Please try again later.");
      setIsLoadingProducts(false);
    });

    const categoriesRef = ref(rtdb, 'categories');
    const unsubscribeCategories = onValue(categoriesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const categoryList: CategoryType[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setDbCategories(categoryList);
         if (error && error.includes("categories")) setError(null); // Clear category-specific error if successful
      } else {
        setDbCategories([]);
      }
      setIsLoadingCategories(false);
    }, (err) => {
      console.error("Firebase RTDB read error (categories):", err);
      setError("Failed to load categories. Please try again later.");
      setIsLoadingCategories(false);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
    };
  }, [error]); // Added error to dependency array to allow re-clearing

  const categoriesForCarousels: CategoryWithProducts[] = useMemo(() => {
    if (isLoadingProducts || isLoadingCategories || error) return [];
    return dbCategories
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
  }, [allProducts, dbCategories, isLoadingProducts, isLoadingCategories, error]);

  if (isLoadingProducts || isLoadingCategories) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-300px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">
          {isLoadingProducts && isLoadingCategories ? "Loading products and categories..." : isLoadingProducts ? "Loading products..." : "Loading categories..."}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive text-destructive p-6 rounded-md flex flex-col items-center gap-3 text-center">
        <AlertTriangle className="h-10 w-10" />
        <div>
          <h3 className="font-semibold text-xl mb-2">Error Loading Data</h3>
          <p>{error}</p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()} className="mt-4 border-destructive text-destructive hover:bg-destructive/20">
          Try Again
        </Button>
      </div>
    );
  }

  if (selectedCategoryId) {
    const category = dbCategories.find(cat => cat.id === selectedCategoryId && cat.id !== 'all');
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
        {categoriesForCarousels.length === 0 && (dbCategories.length > 0 || allProducts.length > 0) && !isLoadingCategories && !isLoadingProducts && (
            <p className="text-xl text-muted-foreground text-center py-10">
                Products or categories are available, but none match for carousel display. Check product category assignments or add more products.
            </p>
        )}
        {dbCategories.length === 0 && allProducts.length === 0 && !isLoadingCategories && !isLoadingProducts && (
           <p className="text-xl text-muted-foreground text-center py-10">No products or categories available in the store at the moment. Please check back later or add some in the Admin Panel!</p>
        )}
      </div>
    </>
  );
}
