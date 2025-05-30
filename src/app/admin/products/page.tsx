
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { MainAppLayout } from '@/components/layout/MainAppLayout';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { products as allProducts, type Product } from '@/data/products'; // Using local data for now
import { ArrowLeft, Package, PlusCircle, Edit2, Trash2 } from 'lucide-react';
import { categories } from '@/data/categories';

// In a real app, products would be fetched from a database (e.g., Firestore)
// and state management (e.g., React Query or Zustand) would handle updates.

export default function ProductManagementPage() {
  // For now, we'll use the static product data.
  // Later, this could be fetched from Firebase Firestore.
  const products = allProducts;

  const getCategoryName = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.name || 'Unknown';
  };

  const handleEditProduct = (productId: string) => {
    // Placeholder: In a real app, navigate to an edit product page/modal
    console.log(`Edit product: ${productId}`);
    // router.push(`/admin/products/edit/${productId}`);
  };

  const handleDeleteProduct = (productId: string) => {
    // Placeholder: In a real app, show confirmation and delete from database
    if (confirm('Are you sure you want to delete this product?')) {
      console.log(`Delete product: ${productId}`);
      // Example: Call a function to delete from Firestore and update local state/refetch
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
        <Button size="sm"> {/* Placeholder for "Add New Product" */}
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Product
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <Package className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Product Catalog Management
          </h1>
          <p className="text-lg text-muted-foreground">
            View, add, edit, or remove products from your shop.
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-lg">
        {products.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id} className="hover:bg-muted/10">
                  <TableCell>
                    <Image
                      src={product.images[0]?.src || 'https://placehold.co/64x64.png'}
                      alt={product.name}
                      width={64}
                      height={64}
                      className="rounded-md object-cover aspect-square"
                      data-ai-hint={product.images[0]?.hint || 'product image'}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">{getCategoryName(product.category)}</TableCell>
                  <TableCell className="text-right text-foreground">${product.price.toFixed(2)}</TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {product.stock !== undefined ? product.stock : 'N/A'}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleEditProduct(product.id)} title="Edit Product">
                        <Edit2 className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDeleteProduct(product.id)} title="Delete Product">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No products found. Start by adding a new product.</p>
          </div>
        )}
      </div>
       <p className="text-xs text-muted-foreground mt-8 text-center">
          Note: Product data is currently static. For full CRUD operations, integrate with Firebase Firestore
          and secure backend functions for adding, editing, and deleting products.
        </p>
    </MainAppLayout>
  );
}
