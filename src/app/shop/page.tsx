"use client"; // For useState and client-side interactions

import { useState, useMemo } from 'react';
import { products as allProducts, type Product } from '@/data/products';
import { CategoryScroller } from '@/components/shop/CategoryScroller';
import { ProductCard } from '@/components/shop/ProductCard';
import { MainAppLayout } from '@/components/layout/MainAppLayout';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredProducts = useMemo(() => {
    return allProducts.filter(product => {
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchTerm]);

  return (
    <MainAppLayout>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">
          Our Collection
        </h1>
        <p className="text-lg text-muted-foreground">
          Browse through our curated selection of high-quality products.
        </p>
      </div>

      <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card border-border focus:border-primary"
          />
        </div>
      </div>
      
      <CategoryScroller
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">No products found matching your criteria.</p>
          { (selectedCategory !== 'all' || searchTerm !== '') && (
            <button 
              onClick={() => { setSelectedCategory('all'); setSearchTerm(''); }}
              className="mt-4 text-primary hover:underline"
            >
              Clear filters and search
            </button>
          )}
        </div>
      )}
    </MainAppLayout>
  );
}
