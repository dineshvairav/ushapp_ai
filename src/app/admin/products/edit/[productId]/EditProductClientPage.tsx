
"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MainAppLayout } from '@/components/layout/MainAppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { type Product } from '@/data/products'; 
import { ArrowLeft, Loader2, UploadCloud, Trash2 } from 'lucide-react';
import { categories } from '@/data/categories';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EditProductClientPageProps {
  productId: string;
  initialProduct: Product | undefined; 
}

export default function EditProductClientPage({ productId, initialProduct }: EditProductClientPageProps) {
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    if (initialProduct) {
      setProduct(initialProduct);
      setName(initialProduct.name);
      setDescription(initialProduct.description);
      setPrice(initialProduct.price.toString());
      setStock(initialProduct.stock?.toString() || '');
      setCategory(initialProduct.category);
      setImagePreviews(initialProduct.images.map(img => img.src));
      setIsLoading(false);
    } else {
      // This case implies the product was not found by the server component.
      // The server component's page.tsx should have already rendered a "Not Found" UI.
      // Setting isLoading to false here will prevent the client loader from showing indefinitely.
      setProduct(null); 
      setIsLoading(false); 
    }
  }, [initialProduct]);

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const currentImageCount = imagePreviews.length;
      const filesToAdd = Array.from(files).slice(0, 5 - currentImageCount);
      
      const newPreviews: string[] = [];
      filesToAdd.forEach(file => {
        const objectUrl = URL.createObjectURL(file);
        newPreviews.push(objectUrl);
      });

      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImagePreviews(prev => {
      const imageToRemove = prev[indexToRemove];
      if (imageToRemove?.startsWith('blob:')) {
        URL.revokeObjectURL(imageToRemove);
      }
      return prev.filter((_, index) => index !== indexToRemove);
    });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!product) return;

    console.log('Submitting updated product:', {
      id: product.id,
      name,
      description,
      price: parseFloat(price) || 0,
      stock: stock ? parseInt(stock) : undefined,
      category,
      images: imagePreviews.map(src => ({ src, hint: 'updated product' })), 
      details: product.details,
    });
    alert('Product updated (simulated)! Check console for data.');
    router.push('/admin/products');
  };

  useEffect(() => {
    // Cleanup blob URLs on component unmount or when imagePreviews change
    // This needs to be careful not to revoke URLs that are still in use from initialProduct.
    const currentBlobPreviews = imagePreviews.filter(src => src.startsWith('blob:'));
    return () => {
      currentBlobPreviews.forEach(URL.revokeObjectURL);
    };
  }, [imagePreviews]);

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

  // If !initialProduct, the server component should have rendered the "Not Found" page.
  // This check is a fallback for the client, but ideally not hit if server handles "not found".
  if (!product) { 
    return (
        <MainAppLayout>
             <div className="text-center py-10">
                 <p className="text-lg text-muted-foreground">Product data is not available or product was not found.</p>
                 <Button asChild variant="outline" className="mt-4">
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
                  <div key={src + index} className="relative group aspect-square border border-border rounded-md overflow-hidden">
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
                Max 5 images. For this demo, images are only shown as previews and not permanently saved.
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
