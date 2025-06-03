
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
import { rtdb } from '@/lib/firebase'; // Import Realtime Database
import { ref, update } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';

interface EditProductClientPageProps {
  productId: string;
  initialProduct: Product | undefined;
}

export default function EditProductClientPage({ productId, initialProduct }: EditProductClientPageProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoadingState, setIsLoadingState] = useState(true); // For initial loading
  const [isSaving, setIsSaving] = useState(false); // For form submission

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState(''); // Changed from stock to qty
  const [mop, setMop] = useState(''); // New state for MOP
  const [dp, setDp] = useState('');   // New state for DP
  const [category, setCategory] = useState('');
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    if (initialProduct) {
      setProduct(initialProduct);
      setName(initialProduct.name);
      setDescription(initialProduct.description);
      setPrice(initialProduct.price.toString());
      setQty(initialProduct.qty?.toString() || '');
      setMop(initialProduct.mop?.toString() || '');
      setDp(initialProduct.dp?.toString() || '');
      setCategory(initialProduct.category);
      setImagePreviews(initialProduct.images.map(img => img.src));
      setIsLoadingState(false);
    } else {
      setProduct(null);
      setIsLoadingState(false);
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!product) return;
    setIsSaving(true);

    const productPath = `products/${productId}`;
    const updatedProductData: Partial<Product> = { // Use Partial for updates
      name,
      description,
      price: parseFloat(price) || 0,
      qty: qty ? parseInt(qty) : undefined,
      mop: mop ? parseFloat(mop) : undefined,
      dp: dp ? parseFloat(dp) : undefined,
      category,
      images: imagePreviews.map(src => ({ src, hint: 'updated product' })),
      // details: product.details, // Keep existing details or provide UI to edit
    };

    try {
      await update(ref(rtdb, productPath), updatedProductData);
      toast({
        title: "Product Updated",
        description: `${name} has been successfully updated in the database.`,
      });
      router.push('/admin/products');
    } catch (error) {
      console.error("Error updating product in RTDB:", error);
      toast({
        variant: "destructive",
        title: "Database Error",
        description: "Could not save product changes. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const currentBlobPreviews = imagePreviews.filter(src => src.startsWith('blob:'));
    return () => {
      currentBlobPreviews.forEach(URL.revokeObjectURL);
    };
  }, [imagePreviews]);

  if (isLoadingState) {
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
            <CardTitle className="text-2xl md:text-3xl text-primary">Edit Product: {initialProduct?.name}</CardTitle>
            <CardDescription>Update the details for this product. Product ID: {productId}. Data will be saved to Firebase Realtime Database.</CardDescription>
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
                disabled={isSaving}
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
                disabled={isSaving}
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
                  disabled={isSaving}
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
                  disabled={isSaving}
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
                  disabled={isSaving}
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
                  disabled={isSaving}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-category" className="text-foreground">Category</Label>
              <Select value={category} onValueChange={setCategory} required disabled={isSaving}>
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
                      disabled={isSaving}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {imagePreviews.length < 5 && (
                  <Label
                    htmlFor="product-images-upload"
                    className={`aspect-square flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground rounded-md p-2 text-center ${isSaving ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-primary hover:bg-muted/20 transition-colors'}`}
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
                disabled={isSaving}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Max 5 images. Image URLs will be saved to RTDB. For permanent file storage, Firebase Storage integration is needed.
              </p>
            </div>

          </CardContent>
          <CardFooter>
            <Button type="submit" size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </form>
    </MainAppLayout>
  );
}
