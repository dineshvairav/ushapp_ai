
"use client";

import { useEffect, useState } from 'react';
import { MainAppLayout } from '@/components/layout/MainAppLayout';
import type { Category } from '@/data/categories';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import * as LucideIcons from 'lucide-react';
import { rtdb } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Loader2, AlertTriangle } from 'lucide-react';

export default function CategoriesPage() {
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const categoriesRef = ref(rtdb, 'categories');
    const unsubscribe = onValue(categoriesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const categoryList: Category[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).filter(cat => cat.id !== 'all'); // Ensure 'all' pseudo-category is not displayed if it exists in DB
        setDbCategories(categoryList);
        setError(null);
      } else {
        setDbCategories([]);
      }
      setIsLoading(false);
    }, (err) => {
      console.error("Firebase RTDB read error (categories page):", err);
      setError("Failed to load categories from the database.");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);


  if (isLoading) {
    return (
      <MainAppLayout>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Loading categories...</p>
        </div>
      </MainAppLayout>
    );
  }

  if (error) {
    return (
      <MainAppLayout>
        <div className="bg-destructive/10 border border-destructive text-destructive p-6 rounded-md flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="h-10 w-10" />
          <div>
            <h3 className="font-semibold text-xl mb-2">Error Loading Categories</h3>
            <p>{error}</p>
          </div>
        </div>
      </MainAppLayout>
    );
  }

  return (
    <MainAppLayout>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">
          Product Categories
        </h1>
        <p className="text-lg text-muted-foreground">
          Explore products based on your interests. Categories loaded from database.
        </p>
      </div>

      {dbCategories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {dbCategories.map((category) => {
            const IconComponent = category.iconName && LucideIcons[category.iconName as keyof typeof LucideIcons]
              ? (LucideIcons as any)[category.iconName] 
              : LucideIcons.List;
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
      ) : (
        <p className="text-xl text-muted-foreground text-center py-10">
          No categories available at the moment. Please add some in the admin panel.
        </p>
      )}
    </MainAppLayout>
  );
}
