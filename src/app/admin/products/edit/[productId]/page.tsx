
import { products as allProducts, type Product } from '@/data/products';
import EditProductClientPage from './EditProductClientPage';
import { MainAppLayout } from '@/components/layout/MainAppLayout';
import { Button } from '@/components/ui/button';
import { PackageOpen, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export async function generateStaticParams() {
  // This ensures pages are generated for existing products if using output: 'export'
  return allProducts.map((product) => ({
    productId: product.id,
  }));
}

interface EditProductServerPageProps {
  params: { productId: string };
}

export default async function EditProductServerPage({ params }: EditProductServerPageProps) {
  const { productId } = params;
  const product = allProducts.find(p => p.id === productId);

  if (!product) {
    // Server component handles the "Not Found" case directly
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

  return <EditProductClientPage productId={productId} initialProduct={product} />;
}
