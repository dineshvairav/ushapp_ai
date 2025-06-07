
import type { Product } from '@/data/products';
import EditProductClientPage from './EditProductClientPage';
import { MainAppLayout } from '@/components/layout/MainAppLayout';
import { Button } from '@/components/ui/button';
import { PackageOpen, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { rtdb } from '@/lib/firebase';
import { ref, get, child } from 'firebase/database';

// Fetches all product IDs from RTDB for static generation
export async function generateStaticParams() {
  try {
    const productsRef = ref(rtdb, 'products');
    const snapshot = await get(productsRef);
    if (snapshot.exists()) {
      const productIds = Object.keys(snapshot.val());
      return productIds.map((id) => ({
        productId: id,
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching product IDs for generateStaticParams:", error);
    return []; 
  }
}

// Fetches a single product from RTDB
async function getProductFromDB(productId: string): Promise<Product | undefined> {
  try {
    const productRef = child(ref(rtdb, 'products'), productId);
    const snapshot = await get(productRef);
    if (snapshot.exists()) {
      return { id: snapshot.key as string, ...snapshot.val() } as Product;
    }
    console.log(`Admin: Product with ID ${productId} not found in DB.`);
    return undefined;
  } catch (error) {
    console.error(`Admin: RTDB Error in getProductFromDB for ID ${productId}:`, error);
    return undefined;
  }
}

export default async function EditProductServerPage({
  params,
}: {
  params: Awaited<ReturnType<typeof generateStaticParams>>[number];
}) {
  const { productId } = params;
  let product: Product | undefined;
  let fetchError: string | null = null;

  try {
    product = await getProductFromDB(productId);
  } catch (error: any) {
    console.error(`Failed to fetch product ${productId} in EditProductServerPage:`, error);
    fetchError = error.message || "An unknown error occurred during product fetch.";
  }

  if (fetchError || !product) {
    return (
      <MainAppLayout>
        <div className="text-center py-10">
          <PackageOpen className="mx-auto h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-semibold text-foreground mb-2">Product Not Found or Error</h1>
          <p className="text-muted-foreground mb-6">
            {fetchError
              ? `Error fetching product: ${fetchError}`
              : `The product with ID "${productId}" could not be found.`}
          </p>
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

  return <EditProductClientPage productId={productId} initialProduct={product} />;
}
