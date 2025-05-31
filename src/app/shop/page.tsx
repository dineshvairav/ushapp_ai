
import { Suspense } from 'react';
import { MainAppLayout } from '@/components/layout/MainAppLayout';
import { ShopClientContent } from './ShopClientContent';
import { Loader2 } from 'lucide-react';

export default function ShopPage() {
  return (
    <MainAppLayout>
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Loading products...</p>
        </div>
      }>
        <ShopClientContent />
      </Suspense>
    </MainAppLayout>
  );
}
