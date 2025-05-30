
"use client"; 

import { useMemo } from 'react';
import { products as allProducts } from '@/data/products';
import { categories as allCategories } from '@/data/categories';
import type { Product } from '@/data/products';
import type { Category } from '@/data/categories';
import { ProductCard } from '@/components/shop/ProductCard';
import { MainAppLayout } from '@/components/layout/MainAppLayout';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Link from 'next/link';
import { Plus } from 'lucide-react';

const PRODUCTS_PER_CAROUSEL_DISPLAY = 4; // Number of products to show initially in each carousel

interface CategoryWithProducts extends Category {
  products: Product[];
}

export default function ShopPage() {
  // Memoize the categories with their respective products
  const categoriesWithProducts: CategoryWithProducts[] = useMemo(() => {
    return allCategories
      .filter(category => category.id !== 'all') // Exclude the 'all' meta-category
      .map(category => {
        const productsInCategory = allProducts.filter(
          product => product.category === category.id
        );
        return {
          ...category,
          products: productsInCategory,
        };
      })
      .filter(categoryGroup => categoryGroup.products.length > 0); // Only include categories that have products
  }, []);

  return (
    <MainAppLayout>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-6">
          Shop by Category
        </h1>
      </div>

      <div className="space-y-12">
        {categoriesWithProducts.map((categoryGroup) => (
          <section key={categoryGroup.id} aria-labelledby={`category-title-${categoryGroup.id}`}>
            <div className="flex justify-between items-center mb-5">
              <h2 id={`category-title-${categoryGroup.id}`} className="text-2xl font-semibold text-primary">
                {categoryGroup.name}
              </h2>
              {categoryGroup.products.length > PRODUCTS_PER_CAROUSEL_DISPLAY && (
                <Button asChild variant="outline" size="sm" className="ml-auto border-accent text-accent hover:bg-accent hover:text-accent-foreground transition-colors">
                  {/* This link can be updated later to point to a page showing all products for this category */}
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
                  loop: categoryGroup.products.length > PRODUCTS_PER_CAROUSEL_DISPLAY, // Loop only if there are more items than fit
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-4">
                  {categoryGroup.products.slice(0, PRODUCTS_PER_CAROUSEL_DISPLAY).map((product) => (
                    <CarouselItem key={product.id} className="pl-4 sm:basis-1/2 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                      <div className="h-full p-1"> {/* Added p-1 for slight spacing if cards have borders/shadows */}
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
        {categoriesWithProducts.length === 0 && (
           <p className="text-xl text-muted-foreground text-center py-10">No products available at the moment. Please check back later!</p>
        )}
      </div>
    </MainAppLayout>
  );
}
