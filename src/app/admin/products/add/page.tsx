
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MainAppLayout } from '@/components/layout/MainAppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, UploadCloud, Trash2, PackagePlus } from 'lucide-react';
import { categories } from '@/data/categories';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// In a real app, you would save the new product to a database (e.g., Firestore)

export default function AddProductPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  // In a real app, you'd manage file objects for upload:
  // const [imageFiles, setImageFiles] = useState<File[]>([]); 

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newPreviews: string[] = [];
      Array.from(files).forEach(file => {
        newPreviews.push(URL.createObjectURL(file));
      });
      setImagePreviews(prev => [...prev, ...newPreviews].slice(0, 5)); // Limit to 5 images
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImagePreviews(prev => {
      const newPreviews = prev.filter((_, index) => index !== indexToRemove);
      // Clean up object URL for the removed image
      if (prev[indexToRemove]?.startsWith('blob:')) {
        URL.revokeObjectURL(prev[indexToRemove] as string);
      }
      return newPreviews;
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const newProductId = `prod_new_${Date.now()}`; // Simple unique ID for demo
    const newProduct = {
      id: newProductId,
      name,
      description,
      price: parseFloat(price) || 0,
      stock: stock ? parseInt(stock) : undefined,
      category,
      images: imagePreviews.map(src => ({ src, hint: 'new product' })), // Simplification for demo
      details: {}, // Add UI for details if needed
    };

    // In a real app, here you would:
    // 1. Upload new imageFiles if any to a storage service.
    // 2. Get the URLs of uploaded images.
    // 3. Construct the new product object with these permanent image URLs.
    // 4. Save the new product to your database (e.g., Firestore).
    console.log('Submitting new product:', newProduct);
    
    // For demo purposes, we'll navigate back.
    alert('New product added (simulated)! Check console for data.');
    router.push('/admin/products');
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
            <CardDescription>Fill in the details for the new product.</CardDescription>
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
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="product-price" className="text-foreground">Price (₹)</Label>
                <Input 
                  id="product-price" 
                  type="number" 
                  step="0.01" 
                  value={price} 
                  onChange={(e) => setPrice(e.target.value)} 
                  required 
                  className="bg-input border-input focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-stock" className="text-foreground">Stock Quantity</Label>
                <Input 
                  id="product-stock" 
                  type="number" 
                  step="1" 
                  value={stock} 
                  onChange={(e) => setStock(e.target.value)} 
                  className="bg-input border-input focus:border-primary"
                  placeholder="Leave blank if not tracking"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-category" className="text-foreground">Category</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger id="product-category" className="w-full bg-input border-input focus:border-primary text-foreground">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(cat => cat.id !== 'all').map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
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
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {imagePreviews.length < 5 && (
                  <Label 
                    htmlFor="product-images-upload"
                    className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground rounded-md cursor-pointer hover:border-primary hover:bg-muted/20 transition-colors p-2 text-center"
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
              />
              <p className="text-xs text-muted-foreground mt-1">
                Max 5 images. For this demo, images are only shown as previews and not permanently saved.
              </p>
            </div>

          </CardContent>
          <CardFooter>
            <Button type="submit" size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
              Save New Product
            </Button>
          </CardFooter>
        </Card>
      </form>
    </MainAppLayout>
  );
}
