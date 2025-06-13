
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MainAppLayout } from '@/components/layout/MainAppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ArrowLeft, Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = 'dineshvairav@gmail.com';

export default function UserManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user && user.email === ADMIN_EMAIL) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
        router.replace(user ? '/' : '/onboarding');
      }
      setIsPageLoading(false);
    });
    return () => unsubscribeAuth();
  }, [router]);

  if (isPageLoading) {
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
        <Users className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            User Management
          </h1>
          <p className="text-lg text-muted-foreground">
            View and manage user accounts.
          </p>
        </div>
      </div>

      <Card className="border-border shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-primary">User List</CardTitle>
           <CardDescription>User management functionality is currently disabled.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-amber-100/10 border border-amber-500/50 text-amber-700/90 p-6 rounded-md flex flex-col items-center gap-4 text-center">
            <ShieldAlert className="h-12 w-12 text-amber-500" />
            <div>
              <h3 className="font-semibold text-xl mb-2">Functionality Disabled</h3>
              <p className="text-sm">
                The backend Firebase Functions required for user management have been removed from this project.
              </p>
              <p className="text-sm mt-1">
                To re-enable user management, Firebase Functions for listing users and managing claims would need to be re-implemented and deployed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </MainAppLayout>
  );
}
