
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainAppLayout } from '@/components/layout/MainAppLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Users, Package, LineChart, ShieldCheck, Settings, FileText, Percent, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
// In a real app, you would import Firebase and its auth methods
// import { getAuth, onAuthStateChanged } from "firebase/auth";
// import firebaseApp from '@/lib/firebase'; // Assuming you have a firebase.ts setup

export default function AdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // SIMULATE Firebase Auth Check
    // In a real app, you would use onAuthStateChanged to get the current user
    // and check their custom claims or email for admin privileges.
    
    // const auth = getAuth(firebaseApp);
    // const unsubscribe = onAuthStateChanged(auth, (user) => {
    //   if (user) {
    //     // Example: Check if user's email is the admin email
    //     // This is NOT secure for production. Use custom claims or a backend check.
    //     const isAdmin = user.email === 'admin@example.com'; 
    //     setIsAuthorized(isAdmin);
    //     if (!isAdmin) {
    //       router.replace('/'); // Redirect non-admins
    //     }
    //   } else {
    //     // No user logged in, redirect to login/onboarding
    //     router.replace('/onboarding'); 
    //   }
    //   setIsLoading(false);
    // });
    // return () => unsubscribe(); // Cleanup subscription

    // --- Start of SIMULATED check for prototype ---
    const MOCK_ADMIN_EMAIL = 'admin@example.com'; // Change this to test
    const MOCK_CURRENT_USER_EMAIL = 'user@example.com'; // Simulate a logged-in user

    const timeoutId = setTimeout(() => {
      // Simulate checking if the current user is an admin
      // To test the admin view, change MOCK_CURRENT_USER_EMAIL to MOCK_ADMIN_EMAIL
      // or set mockIsAdmin directly to true.
      const mockIsAdmin = MOCK_CURRENT_USER_EMAIL === MOCK_ADMIN_EMAIL;

      if (mockIsAdmin) {
        setIsAuthorized(true);
      } else {
        // If not authorized, redirect to the home page
        router.replace('/'); 
      }
      setIsLoading(false);
    }, 1500); // Simulate network delay for auth check

    return () => clearTimeout(timeoutId);
    // --- End of SIMULATED check ---

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
    // This should ideally not be seen as the redirect would have happened.
    // It's a fallback or for the brief moment before redirect completes.
    return (
      <MainAppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <p className="text-lg text-muted-foreground">Access Denied. Redirecting...</p>
        </div>
      </MainAppLayout>
    );
  }

  // If authorized, render the admin dashboard
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
          Manage your StaticShop application from here. (Access is currently SIMULATED)
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
            <Button variant="outline" size="sm">Manage Users</Button>
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
            <Button variant="outline" size="sm">Manage Products</Button>
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
            <Button variant="outline" size="sm">Configure Settings</Button>
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
            <Button variant="outline" size="sm">Edit Content</Button>
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
          This admin dashboard demonstrates a <strong className="text-foreground">simulated client-side authorization check</strong> for prototyping.
          In a real-world application, access to this page and its functionalities
          <strong className="text-foreground"> must be strictly controlled with server-side checks</strong>. This involves:
        </p>
        <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1 pl-2">
          <li><strong className="text-foreground">Firebase Authentication:</strong> Ensuring only logged-in users can attempt to access this page.</li>
          <li><strong className="text-foreground">Firebase Custom Claims / Backend Role Verification:</strong> Verifying that the logged-in user has administrative privileges (e.g., an "admin" custom claim or role stored securely). This check should happen on the backend.</li>
          <li><strong className="text-foreground">Secure Endpoints:</strong> Any actions performed from this dashboard (like updating products or user roles) must also be secured on the backend, verifying admin privileges for each request.</li>
        </ul>
        <p className="text-sm text-muted-foreground mt-3">
          The current client-side check can be easily bypassed and is <strong className="text-destructive">not suitable for production security</strong>.
          Use Next.js middleware, API route protection, or Server Action validation with Firebase Admin SDK for robust security.
        </p>
      </div>
    </MainAppLayout>
  );
}
