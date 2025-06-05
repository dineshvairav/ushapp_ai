
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MainAppLayout } from '@/components/layout/MainAppLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Users, Package, LineChart, ShieldCheck, Settings, FileText, Percent, ListTree, Loader2, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from '@/lib/firebase';

const ADMIN_EMAIL = 'dineshvairav@gmail.com';

export default function AdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        const isAdmin = user.email === ADMIN_EMAIL;
        setIsAuthorized(isAdmin);
        if (!isAdmin) {
          router.replace('/');
        }
      } else {
        setCurrentUser(null);
        setIsAuthorized(false);
        router.replace('/onboarding');
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
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="h-10 w-10 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Admin Dashboard
          </h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Manage your ushªOªpp application. Current admin: {currentUser?.email}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-primary/20 transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-7 w-7 text-primary" />
              <CardTitle className="text-xl">User Management</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              View, edit, or manage user accounts and roles.
            </CardDescription>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/users">Manage Users</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="hover:shadow-primary/20 transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Package className="h-7 w-7 text-primary" />
              <CardTitle className="text-xl">Product Catalog</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Add, edit, or remove products and manage inventory.
            </CardDescription>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/products">Manage Products</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="hover:shadow-primary/20 transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <ListTree className="h-7 w-7 text-primary" />
              <CardTitle className="text-xl">Category Management</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Add, edit, or remove product categories.
            </CardDescription>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/categories">Manage Categories</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="hover:shadow-primary/20 transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <UploadCloud className="h-7 w-7 text-primary" />
              <CardTitle className="text-xl">File Uploads</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Upload and manage shared files like invoices or documents.
            </CardDescription>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/uploads">Manage Files</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="hover:shadow-primary/20 transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <LineChart className="h-7 w-7 text-primary" />
              <CardTitle className="text-xl">Site Analytics</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              View traffic, sales reports, and customer insights.
            </CardDescription>
            <Button variant="outline" size="sm">View Analytics</Button>
          </CardContent>
        </Card>
        <Card className="hover:shadow-primary/20 transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Settings className="h-7 w-7 text-primary" />
              <CardTitle className="text-xl">App Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Configure global application settings and integrations.
            </CardDescription>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/settings">Configure Settings</Link>
            </Button>
          </CardContent>
        </Card>
         <Card className="hover:shadow-primary/20 transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-7 w-7 text-primary" />
              <CardTitle className="text-xl">Content Management</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Manage promotional banners, FAQs, and site content.
            </CardDescription>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/content">Edit Content</Link>
            </Button>
          </CardContent>
        </Card>
         <Card className="hover:shadow-primary/20 transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Percent className="h-7 w-7 text-primary" />
              <CardTitle className="text-xl">Discounts & Deals</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Create and manage promotional codes and special offers.
            </CardDescription>
            <Button variant="outline" size="sm">Manage Deals</Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 p-6 bg-card border border-border rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold text-primary mb-3">Important Security Note</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This admin dashboard currently uses a <strong className="text-foreground">client-side email check</strong> for authorization.
          In a real-world application, access to this page and its functionalities
          <strong className="text-foreground"> must be strictly controlled with server-side checks and robust role management (e.g., Firebase Custom Claims)</strong>.
        </p>
        <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1 pl-2">
          <li><strong className="text-foreground">Firebase Authentication:</strong> Ensure only logged-in users can attempt to access this page. (This is now partially implemented).</li>
          <li><strong className="text-foreground">Firebase Custom Claims / Backend Role Verification:</strong> The recommended approach. Verify that the logged-in user has administrative privileges (e.g., an "admin" custom claim). This check should happen on the backend or be securely verifiable on the client.</li>
          <li><strong className="text-foreground">Secure Endpoints:</strong> Any actions performed from this dashboard (like updating products or user roles) must also be secured on the backend, verifying admin privileges for each request using the Firebase Admin SDK.</li>
        </ul>
        <p className="text-sm text-muted-foreground mt-3">
          The current client-side email check is for demonstration and is <strong className="text-destructive">not suitable for production security</strong>.
        </p>
      </div>
    </MainAppLayout>
  );
}
