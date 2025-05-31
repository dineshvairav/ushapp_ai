
"use client"; 

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { products as allProducts, type Product } from '@/data/products';
import { categories as allCategories, type Category } from '@/data/categories';
import { ProductCard } from '@/components/shop/ProductCard';
import { MainAppLayout } from '@/components/layout/MainAppLayout';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Link from 'next/link';
import { Plus, ArrowLeft } from 'lucide-react';

const PRODUCTS_PER_CAROUSEL_DISPLAY = 4;

interface CategoryWithProducts extends Category {
  products: Product[];
}

export default function ShopPage() {
  const searchParams = useSearchParams();
  const selectedCategoryId = searchParams.get('category');

  // Memoized categories with products for the "all categories" carousel view
  const categoriesForCarousels: CategoryWithProducts[] = useMemo(() => {
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

  // If a specific category is selected via URL parameter
  if (selectedCategoryId) {
    const category = allCategories.find(cat => cat.id === selectedCategoryId && cat.id !== 'all');
    const productsToShow = allProducts.filter(prod => prod.category === selectedCategoryId);

    if (!category) {
      // Handle case where category ID is invalid or "all"
      return (
        <MainAppLayout>
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
        </MainAppLayout>
      );
    }

    return (
      <MainAppLayout>
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
      </MainAppLayout>
    );
  }

  // Default view: Show all categories with carousels
  return (
    <MainAppLayout>
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
        {categoriesForCarousels.length === 0 && (
           <p className="text-xl text-muted-foreground text-center py-10">No products available at the moment. Please check back later!</p>
        )}
      </div>
    </MainAppLayout>
  );
}
