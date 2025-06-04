
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MainAppLayout } from '@/components/layout/MainAppLayout';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, ArrowLeft, Loader2, ShieldCheck, UserCog, UserX, AlertTriangle } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = 'dineshvairav@gmail.com';

interface ManagedUser {
  id: string;
  uid: string;
  email: string | null;
  displayName: string | null;
  isDealer: boolean; // This would typically come from Custom Claims
  creationTime: string | null;
  lastSignInTime: string | null;
  disabled: boolean; // This would be from Firebase Auth user record
}

const dummyUsers: ManagedUser[] = [
  { id: '1', uid: 'user1FirebaseUID', email: 'alice@example.com', displayName: 'Alice Wonderland', isDealer: false, creationTime: '2023-01-15', lastSignInTime: '2024-07-20', disabled: false },
  { id: '2', uid: 'user2FirebaseUID', email: 'bob@example.com', displayName: 'Bob The Builder', isDealer: true, creationTime: '2023-03-22', lastSignInTime: '2024-07-18', disabled: false },
  { id: '3', uid: 'user3FirebaseUID', email: 'charlie@example.com', displayName: 'Charlie Brown', isDealer: false, creationTime: '2023-05-10', lastSignInTime: '2024-06-01', disabled: true },
  { id: '4', uid: 'user4FirebaseUID', email: 'diana@example.com', displayName: 'Diana Prince', isDealer: true, creationTime: '2022-11-05', lastSignInTime: '2024-07-21', disabled: false },
];

export default function UserManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true); // For future real data fetching

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user && user.email === ADMIN_EMAIL) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
        router.replace(user ? '/' : '/onboarding');
      }
      setIsAdminLoading(false);
    });
    return () => unsubscribeAuth();
  }, [router]);

  useEffect(() => {
    if (!isAuthorized || isAdminLoading) return;

    // Simulate fetching users
    setIsLoadingUsers(true);
    setTimeout(() => {
      setManagedUsers(dummyUsers);
      setIsLoadingUsers(false);
    }, 1000); // Simulate network delay
  }, [isAuthorized, isAdminLoading]);

  const handleToggleDealerStatus = (userId: string, currentStatus: boolean) => {
    toast({
      title: "Backend Action Required",
      description: `To change dealer status for user ${userId}, Firebase Admin SDK implementation is needed to set/unset custom claims.`,
      variant: "default",
      duration: 5000,
    });
    // In a real app, you'd call a backend endpoint here.
    // For demo, we can toggle local state if you want to see UI change
    // setManagedUsers(prev => prev.map(u => u.id === userId ? {...u, isDealer: !currentStatus} : u));
  };

  const handleToggleUserDisabledStatus = (userId: string, currentStatus: boolean) => {
     toast({
      title: "Backend Action Required",
      description: `To ${currentStatus ? "enable" : "disable"} user ${userId}, Firebase Admin SDK implementation is needed to update the user's auth record.`,
      variant: "default",
      duration: 5000,
    });
    // setManagedUsers(prev => prev.map(u => u.id === userId ? {...u, disabled: !currentStatus} : u));
  };

  if (isAdminLoading) {
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
            View and manage user accounts. (UI Prototype - Dummy Data)
          </p>
        </div>
      </div>

      <Card className="mb-8 border-amber-500/50 bg-amber-50/10">
        <CardHeader className="flex flex-row items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-amber-500 mt-1" />
          <div>
            <CardTitle className="text-amber-600">Important Implementation Notes</CardTitle>
            <CardDescription className="text-amber-700/90">
              This page demonstrates the UI for user management. Full functionality requires backend implementation.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-amber-700/90 space-y-1 pl-12">
            <p><strong>Listing All Users:</strong> Requires using the Firebase Admin SDK on a secure backend (e.g., Firebase Functions) to fetch all user records. Client-side SDK cannot list all users.</p>
            <p><strong>Role Management (e.g., "Is Dealer"):</strong> Requires using Firebase Custom Claims, set via the Firebase Admin SDK on a backend.</p>
            <p><strong>Disabling/Enabling Users:</strong> Requires using the Firebase Admin SDK on a backend to update user authentication records.</p>
            <p>The data displayed below is DUMMY data for demonstration.</p>
        </CardContent>
      </Card>
      

      {isLoadingUsers && (
        <div className="flex flex-col items-center justify-center min-h-[30vh] bg-card border border-border rounded-xl shadow-lg p-6">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
          <p className="text-muted-foreground">Loading user data...</p>
        </div>
      )}

      {!isLoadingUsers && (
        <Card className="border-border shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-primary">User List</CardTitle>
             <CardDescription>Displaying {managedUsers.length} users (dummy data).</CardDescription>
          </CardHeader>
          <CardContent>
            {managedUsers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Dealer</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>UID</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {managedUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/10">
                      <TableCell className="font-medium text-foreground">{user.displayName || 'N/A'}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email || 'N/A'}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={user.isDealer ? "default" : "outline"} className={user.isDealer ? "bg-green-600 hover:bg-green-700" : ""}>
                          {user.isDealer ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                       <TableCell className="text-center">
                        <Badge variant={user.disabled ? "destructive" : "secondary"} className={!user.disabled ? "bg-muted text-muted-foreground" : ""}>
                          {user.disabled ? 'Disabled' : 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate max-w-[100px]" title={user.uid}>{user.uid}</TableCell>
                      <TableCell className="text-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleDealerStatus(user.uid, user.isDealer)}
                          title={user.isDealer ? "Remove Dealer Status" : "Make Dealer"}
                        >
                          <ShieldCheck className={`mr-1 h-4 w-4 ${user.isDealer ? 'text-green-500' : 'text-muted-foreground'}`} />
                          Dealer
                        </Button>
                         <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleUserDisabledStatus(user.uid, user.disabled)}
                           title={user.disabled ? "Enable User" : "Disable User"}
                        >
                           {user.disabled ? <UserCog className="mr-1 h-4 w-4 text-green-500"/> : <UserX className="mr-1 h-4 w-4 text-destructive"/>}
                           {user.disabled ? "Enable" : "Disable"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-6">No users to display (or dummy data not loaded).</p>
            )}
          </CardContent>
        </Card>
      )}
    </MainAppLayout>
  );
}

    