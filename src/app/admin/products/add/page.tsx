
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MainAppLayout } from '@/components/layout/MainAppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, UploadCloud, Trash2, PackagePlus, Loader2 } from 'lucide-react';
import type { Category } from '@/data/categories'; // Import Category type
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { rtdb } from '@/lib/firebase';
import { ref, set, push, onValue } from 'firebase/database'; // Added onValue
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/data/products';

export default function AddProductPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('');
  const [mop, setMop] = useState('');
  const [dp, setDp] = useState('');
  const [category, setCategory] = useState('');
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  useEffect(() => {
    const categoriesRef = ref(rtdb, 'categories');
    const unsubscribe = onValue(categoriesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const categoryList: Category[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setDbCategories(categoryList);
      } else {
        setDbCategories([]);
      }
      setIsLoadingCategories(false);
    }, (error) => {
      console.error("Error fetching categories:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load categories." });
      setIsLoadingCategories(false);
    });
    return () => unsubscribe();
  }, [toast]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newPreviews: string[] = [];
      Array.from(files).forEach(file => {
        newPreviews.push(URL.createObjectURL(file));
      });
      setImagePreviews(prev => [...prev, ...newPreviews].slice(0, 5));
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImagePreviews(prev => {
      const newPreviews = prev.filter((_, index) => index !== indexToRemove);
      if (prev[indexToRemove]?.startsWith('blob:')) {
        URL.revokeObjectURL(prev[indexToRemove] as string);
      }
      return newPreviews;
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!category) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please select a category." });
      return;
    }
    setIsLoading(true);

    const newProductRef = push(ref(rtdb, 'products'));
    const newProductId = newProductRef.key;

    if (!newProductId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not generate product ID. Please try again.",
      });
      setIsLoading(false);
      return;
    }

    const newProductData: Product = {
      id: newProductId,
      name,
      description,
      price: parseFloat(price) || 0,
      qty: qty ? parseInt(qty) : undefined,
      mop: mop ? parseFloat(mop) : undefined,
      dp: dp ? parseFloat(dp) : undefined,
      category,
      images: imagePreviews.map(src => ({ src, hint: 'new product' })),
      details: {},
    };

    try {
      await set(newProductRef, newProductData);
      toast({
        title: "Product Added",
        description: `${name} has been successfully added to the database.`,
      });
      router.push('/admin/products');
    } catch (error) {
      console.error("Error adding product to RTDB:", error);
      toast({
        variant: "destructive",
        title: "Database Error",
        description: "Could not save the product. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainAppLayout>
      <div className="mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Product List
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="max-w-4xl mx-auto border-border shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <PackagePlus className="h-8 w-8 text-primary" />
              <CardTitle className="text-2xl md:text-3xl text-primary">Add New Product</CardTitle>
            </div>
            <CardDescription>Fill in the details for the new product. Data will be saved to Firebase Realtime Database.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="product-name" className="text-foreground">Product Name</Label>
              <Input
                id="product-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-input border-input focus:border-primary"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-description" className="text-foreground">Description</Label>
              <Textarea
                id="product-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="bg-input border-input focus:border-primary"
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="product-price" className="text-foreground">MRP</Label>
                <Input
                  id="product-price"
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="bg-input border-input focus:border-primary"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-qty" className="text-foreground">Quantity (Qty)</Label>
                <Input
                  id="product-qty"
                  type="number"
                  step="1"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="bg-input border-input focus:border-primary"
                  placeholder="Product quantity"
                  disabled={isLoading}
                />
              </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="product-mop" className="text-foreground">MOP (₹)</Label>
                <Input
                  id="product-mop"
                  type="number"
                  step="0.01"
                  value={mop}
                  onChange={(e) => setMop(e.target.value)}
                  className="bg-input border-input focus:border-primary"
                  placeholder="Maximum Offer Price"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-dp" className="text-foreground">DP (₹)</Label>
                <Input
                  id="product-dp"
                  type="number"
                  step="0.01"
                  value={dp}
                  onChange={(e) => setDp(e.target.value)}
                  className="bg-input border-input focus:border-primary"
                  placeholder="Dealer Price"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-category" className="text-foreground">Category</Label>
              <Select value={category} onValueChange={setCategory} required disabled={isLoading || isLoadingCategories}>
                <SelectTrigger id="product-category" className="w-full bg-input border-input focus:border-primary text-foreground">
                  <SelectValue placeholder={isLoadingCategories ? "Loading categories..." : "Select a category"} />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingCategories ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : dbCategories.length > 0 ? (
                    dbCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-categories" disabled>No categories available. Add one in Admin Panel.</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Product Images</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {imagePreviews.map((src, index) => (
                  <div key={index} className="relative group aspect-square border border-border rounded-md overflow-hidden">
                    <Image src={src} alt={`Preview ${index + 1}`} fill className="object-cover" data-ai-hint="product image preview"/>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveImage(index)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {imagePreviews.length < 5 && (
                  <Label
                    htmlFor="product-images-upload"
                    className={`aspect-square flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground rounded-md p-2 text-center ${isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-primary hover:bg-muted/20 transition-colors'}`}
                  >
                    <UploadCloud className="h-8 w-8 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Add Image(s)</span>
                    <span className="text-xs text-muted-foreground">(Max 5)</span>
                  </Label>
                )}
              </div>
              <Input
                id="product-images-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Max 5 images. Image URLs will be saved to RTDB. For permanent file storage, Firebase Storage integration is needed.
              </p>
            </div>

          </CardContent>
          <CardFooter>
            <Button type="submit" size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save New Product
            </Button>
          </CardFooter>
        </Card>
      </form>
    </MainAppLayout>
  );
}
