
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MainAppLayout } from '@/components/layout/MainAppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { products as allProducts, type Product } from '@/data/products'; // Using local data for now
import { ArrowLeft, PackageOpen, Loader2, UploadCloud, Trash2 } from 'lucide-react';
import { categories } from '@/data/categories';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// In a real app, product would be fetched from a database (e.g., Firestore)
// and updates would be saved back.

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.productId as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  // In a real app, you'd manage file objects for upload:
  // const [imageFiles, setImageFiles] = useState<File[]>([]); 

  useEffect(() => {
    if (productId) {
      const foundProduct = allProducts.find(p => p.id === productId);
      if (foundProduct) {
        setProduct(foundProduct);
        setName(foundProduct.name);
        setDescription(foundProduct.description);
        setPrice(foundProduct.price.toString());
        setStock(foundProduct.stock?.toString() || '');
        setCategory(foundProduct.category);
        setImagePreviews(foundProduct.images.map(img => img.src));
      }
      setIsLoading(false);
    }
  }, [productId]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newPreviews: string[] = [];
      // const newImageFiles: File[] = []; // For actual upload
      Array.from(files).forEach(file => {
        newPreviews.push(URL.createObjectURL(file));
        // newImageFiles.push(file);
      });
      setImagePreviews(prev => [...prev, ...newPreviews].slice(0, 5)); // Limit to 5 images for preview
      // setImageFiles(prev => [...prev, ...newImageFiles]);
      // In a real app, you'd upload these files to storage (e.g. Firebase Storage)
      // and get back URLs to save with the product.
      // For this demo, we're just creating object URLs for preview.
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
    // Also remove from imageFiles if managing actual files
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!product) return;

    // In a real app, here you would:
    // 1. Upload new imageFiles if any.
    // 2. Get the URLs of uploaded images.
    // 3. Construct the updated product object with new image URLs.
    // 4. Save the updated product to your database (e.g., Firestore).
    console.log('Submitting updated product:', {
      id: product.id,
      name,
      description,
      price: parseFloat(price),
      stock: stock ? parseInt(stock) : undefined,
      category,
      images: imagePreviews.map(src => ({ src, hint: 'updated product' })), // Simplification for demo
      details: product.details, // Keep original details or provide UI to edit them
    });
    // For demo purposes, we'll navigate back.
    alert('Product updated (simulated)! Check console for data.');
    router.push('/admin/products');
  };

  if (isLoading) {
    return (
      <MainAppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Loading product details...</p>
        </div>
      </MainAppLayout>
    );
  }

  if (!product) {
    return (
      <MainAppLayout>
        <div className="text-center py-10">
          <PackageOpen className="mx-auto h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-semibold text-foreground mb-2">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">The product with ID "{productId}" could not be found.</p>
          <Button asChild variant="outline">
            <Link href="/admin/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Product List
            </Link>
          </Button>
        </div>
      </MainAppLayout>
    );
  }

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
            <CardTitle className="text-2xl md:text-3xl text-primary">Edit Product: {product.name}</CardTitle>
            <CardDescription>Update the details for this product. Product ID: {product.id}</CardDescription>
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
                <Label htmlFor="product-price" className="text-foreground">Price ($)</Label>
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
              <Select value={category} onValueChange={setCategory}>
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
                    <Image src={src} alt={`Preview ${index + 1}`} fill className="object-cover" data-ai-hint="product image preview" />
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
                Click on an image to remove it. Max 5 images. For this demo, new images are only shown as previews and not saved.
              </p>
            </div>

          </CardContent>
          <CardFooter>
            <Button type="submit" size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </form>
    </MainAppLayout>
  );
}
