
import type { Product } from '@/data/products';
import EditProductClientPage from './EditProductClientPage';
import { MainAppLayout } from '@/components/layout/MainAppLayout';
import { Button } from '@/components/ui/button';
import { PackageOpen, ArrowLeft, Loader2 } from 'lucide-react';
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
    // Fallback to an empty array or a predefined list if RTDB access fails during build
    // This is important if 'output: export' is used and build can't reach RTDB
    return []; 
  }
}

interface EditProductServerPageProps {
  params: { productId: string };
}

// Fetches a single product from RTDB
async function getProductFromDB(productId: string): Promise<Product | undefined> {
  try {
    const productRef = child(ref(rtdb, 'products'), productId);
    const snapshot = await get(productRef);
    if (snapshot.exists()) {
      return { id: snapshot.key, ...snapshot.val() } as Product;
    }
    return undefined;
  } catch (error) {
    console.error(`Error fetching product ${productId} from RTDB:`, error);
    return undefined;
  }
}

export default async function EditProductServerPage({ params }: EditProductServerPageProps) {
  const resolvedParams = await params;
  const { productId } = resolvedParams;
  
  // Fetch product from RTDB
  const product = await getProductFromDB(productId);

  if (product === undefined && productId) { // Check if explicitly undefined (fetch error or not found)
    return (
      <MainAppLayout>
        <div className="text-center py-10">
          <Loader2 className="mx-auto h-16 w-16 text-primary animate-spin mb-4" />
          <h1 className="text-2xl font-semibold text-foreground mb-2">Loading Product...</h1>
          <p className="text-muted-foreground mb-6">Attempting to fetch product with ID "{productId}" from the database.</p>
           <p className="text-xs text-muted-foreground">If this persists, the product may not exist or there might be a connection issue.</p>
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
  
  if (!product) {
    return (
      <MainAppLayout>
        <div className="text-center py-10">
          <PackageOpen className="mx-auto h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-semibold text-foreground mb-2">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">The product with ID "{productId}" could not be found in the database.</p>
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
