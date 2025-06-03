
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { MainAppLayout } from '@/components/layout/MainAppLayout';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Product } from '@/data/products';
import type { Category } from '@/data/categories'; // Import Category type
import { ArrowLeft, Package, PlusCircle, Edit2, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { rtdb } from '@/lib/firebase';
import { ref, onValue, remove } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';

export default function ProductManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [dbCategories, setDbCategories] = useState<Record<string, Category>>({}); // Store categories as an object for easier lookup
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const categoriesRef = ref(rtdb, 'categories');
    const unsubscribeCategories = onValue(categoriesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const categoryMap: Record<string, Category> = {};
        Object.keys(data).forEach(key => {
          categoryMap[key] = { id: key, ...data[key] };
        });
        setDbCategories(categoryMap);
      } else {
        setDbCategories({});
      }
    }, (err) => {
      console.error("Firebase RTDB read error (categories for product list):", err);
    });
    
    const productsRef = ref(rtdb, 'products');
    const unsubscribeProducts = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const productList: Product[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setProducts(productList);
        setError(null);
      } else {
        setProducts([]);
      }
      setIsLoading(false);
    }, (err) => {
      console.error("Firebase RTDB read error (products):", err);
      setError("Failed to load products from the database. Please try again later.");
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Database Error",
        description: "Could not fetch products.",
      });
    });

    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
    };
  }, [toast]);

  const getCategoryName = (categoryId: string) => {
    return dbCategories[categoryId]?.name || categoryId || 'Unknown'; 
  };

  const handleEditProduct = (productId: string) => {
    router.push(`/admin/products/edit/${productId}`);
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      try {
        await remove(ref(rtdb, `products/${productId}`));
        toast({
          title: "Product Deleted",
          description: `"${productName}" has been successfully deleted.`,
        });
      } catch (err) {
        console.error("Error deleting product:", err);
        toast({
          variant: "destructive",
          title: "Deletion Failed",
          description: `Could not delete "${productName}". Please try again.`,
        });
      }
    }
  };

  return (
    <MainAppLayout>
      <div className="mb-6 flex justify-between items-center">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin Dashboard
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/admin/products/add">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Product
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <Package className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Product Catalog Management
          </h1>
          <p className="text-lg text-muted-foreground">
            View, add, edit, or remove products from your shop. Data is live from Firebase.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center min-h-[30vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Loading products from database...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md flex items-center gap-3">
          <AlertTriangle className="h-6 w-6" />
          <div>
            <h3 className="font-semibold">Error Loading Products</h3>
            <p>{error}</p>
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <div className="bg-card border border-border rounded-xl shadow-lg">
          {products.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const firstImage = product.images?.[0];
                  const imageSrc = firstImage?.src || 'https://placehold.co/64x64.png';
                  const imageHint = firstImage?.src ? (firstImage.hint || 'product photo') : 'placeholder image';
                  return (
                    <TableRow key={product.id} className="hover:bg-muted/10">
                      <TableCell>
                        <Image
                          src={imageSrc}
                          alt={product.name}
                          width={64}
                          height={64}
                          className="rounded-md object-cover aspect-square"
                          data-ai-hint={imageHint}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                      <TableCell className="text-muted-foreground">{getCategoryName(product.category)}</TableCell>
                      <TableCell className="text-right text-foreground">₹{product.price.toFixed(2)}</TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {product.qty !== undefined ? product.qty : 'N/A'}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button variant="outline" size="icon" onClick={() => handleEditProduct(product.id)} title="Edit Product">
                            <Edit2 className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => handleDeleteProduct(product.id, product.name)} title="Delete Product">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">No products found in the database. Start by adding a new product.</p>
            </div>
          )}
        </div>
      )}
       <p className="text-xs text-muted-foreground mt-8 text-center">
          Note: Product and category data is now managed via Firebase Realtime Database.
        </p>
    </MainAppLayout>
  );
}
