
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MainAppLayout } from '@/components/layout/MainAppLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FileText, MessageSquare, Image as ImageIcon, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from '@/lib/firebase';

const ADMIN_EMAIL = 'dineshvairav@gmail.com';

export default function ContentManagementPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === ADMIN_EMAIL) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
        router.replace(user ? '/' : '/onboarding');
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  if (isLoading) {
    return (
      <MainAppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Verifying access...</p>
        </div>
      </MainAppLayout>
    );
  }

  if (!isAuthorized) {
     return (
      <MainAppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <p className="text-lg text-muted-foreground">Access Denied. Redirecting...</p>
        </div>
      </MainAppLayout>
    );
  }

  return (
    <MainAppLayout>
      <div className="mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin Dashboard
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <FileText className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Content Management
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage FAQs, Banners, and other site content.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-primary/20 transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare className="h-7 w-7 text-primary" />
              <CardTitle className="text-xl">FAQ Management</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Add, edit, or remove Frequently Asked Questions.
            </CardDescription>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/content/faqs">Manage FAQs</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-primary/20 transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <ImageIcon className="h-7 w-7 text-primary" />
              <CardTitle className="text-xl">Banner Management</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Manage promotional banners for your site. (Coming Soon)
            </CardDescription>
            <Button variant="outline" size="sm" disabled>Manage Banners</Button>
          </CardContent>
        </Card>
      </div>
    </MainAppLayout>
  );
}
