
"use client";

import type { Metadata } from 'next';
import { MainAppLayout } from '@/components/layout/MainAppLayout';
import { categories as allCategories, type Category } from '@/data/categories';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import * as LucideIcons from 'lucide-react';

// export const metadata: Metadata = { // Metadata should be defined in Server Components or layout files
//   title: 'Product Categories - ushªOªpp',
//   description: 'Browse all product categories available at ushªOªpp.',
// };

export default function CategoriesPage() {
  const displayCategories = allCategories.filter(cat => cat.id !== 'all');

  return (
    <MainAppLayout>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">
          Product Categories
        </h1>
        <p className="text-lg text-muted-foreground">
          Explore products based on your interests.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {displayCategories.map((category) => {
          const IconComponent = category.iconName ? (LucideIcons as any)[category.iconName] : LucideIcons.List;
          return (
            <Link key={category.id} href={`/shop?category=${category.id}`} className="group">
              <Card className="h-full hover:shadow-primary/20 hover:border-primary/50 transition-all duration-300 ease-out flex flex-col bg-card border-border">
                <CardHeader>
                  <div className="mb-3 p-3 bg-primary/10 rounded-full w-fit group-hover:bg-primary/20 transition-colors">
                    <IconComponent className="h-8 w-8 text-primary group-hover:text-primary/90 transition-colors" />
                  </div>
                  <CardTitle className="text-xl text-foreground group-hover:text-primary transition-colors">{category.name}</CardTitle>
                </CardHeader>
                {category.description && (
                  <CardContent className="flex-grow">
                    <CardDescription className="text-muted-foreground">{category.description}</CardDescription>
                  </CardContent>
                )}
              </Card>
            </Link>
          );
        })}
      </div>
      {displayCategories.length === 0 && (
        <p className="text-xl text-muted-foreground text-center py-10">
          No categories available at the moment.
        </p>
      )}
    </MainAppLayout>
  );
}
