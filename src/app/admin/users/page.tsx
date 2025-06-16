
"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MainAppLayout } from '@/components/layout/MainAppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, ArrowLeft, Loader2, AlertTriangle, ShieldCheck, UserCheck, UserX, BadgeInfo } from 'lucide-react';
import { auth, firestore } from '@/lib/firebase';
import { getFunctions, httpsCallable, type HttpsCallableResult } from 'firebase/functions';
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc } from "firebase/firestore";

interface ManagedUser {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  disabled: boolean;
  creationTime?: string;
  lastSignInTime?: string;
  isAdmin: boolean;
  isDealer: boolean;
  phone?: string | null;
}

export default function UserManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [errorLoadingUsers, setErrorLoadingUsers] = useState<string | null>(null);

  // Authorization check using Firestore
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userProfileRef = doc(firestore, "userProfiles", user.uid);
          const docSnap = await getDoc(userProfileRef);
          if (docSnap.exists() && docSnap.data().isAdmin === true) {
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
            router.replace('/');
          }
        } catch (error) {
          console.error("Auth check error:", error);
          setIsAuthorized(false);
          router.replace('/');
        }
      } else {
        setIsAuthorized(false);
        router.replace('/onboarding');
      }
      setIsPageLoading(false);
    });
    return () => unsubscribeAuth();
  }, [router]);

  const fetchUsers = useCallback(async () => {
    if (!isAuthorized) return;
    setIsLoadingUsers(true);
    setErrorLoadingUsers(null);
    try {
      const functions = getFunctions(auth.app);
      const listAllUsersFn = httpsCallable(functions, 'listAllUsers');
      const result = (await listAllUsersFn()) as HttpsCallableResult<ManagedUser[]>;
      setUsers(result.data || []);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      setErrorLoadingUsers(error.message || "Failed to load users from the backend.");
      toast({ variant: "destructive", title: "Error Loading Users", description: error.message });
    } finally {
      setIsLoadingUsers(false);
    }
  }, [toast, isAuthorized]);

  useEffect(() => {
    if (isAuthorized && !isPageLoading) {
      fetchUsers();
    }
  }, [isAuthorized, isPageLoading, fetchUsers]);

  const handleToggleRole = async (targetUid: string, roleName: 'isAdmin' | 'isDealer', currentValue: boolean) => {
    try {
      const functions = getFunctions(auth.app);
      const manageUserRoleFn = httpsCallable(functions, 'manageUserRole');
      await manageUserRoleFn({ targetUid, roleName, value: !currentValue });
      toast({ title: "Role Updated", description: `User ${roleName} status changed.` });
      setUsers(prevUsers =>
        prevUsers.map(u => u.uid === targetUid ? { ...u, [roleName]: !currentValue } : u)
      );
    } catch (error: any) {
      console.error(`Error toggling ${roleName} status:`, error);
      toast({ variant: "destructive", title: `Failed to Update ${roleName}`, description: error.message });
    }
  };

  const handleToggleDisabled = async (targetUid: string, currentValue: boolean) => {
    try {
      const functions = getFunctions(auth.app);
      const manageUserDisabledStatusFn = httpsCallable(functions, 'manageUserDisabledStatus');
      await manageUserDisabledStatusFn({ targetUid, disabled: !currentValue });
      toast({ title: "User Status Updated", description: `User ${currentValue ? "enabled" : "disabled"}.` });
      setUsers(prevUsers =>
        prevUsers.map(u => u.uid === targetUid ? { ...u, disabled: !currentValue } : u)
      );
    } catch (error: any) {
      console.error("Error toggling disabled status:", error);
      toast({ variant: "destructive", title: "Failed to Update Status", description: error.message });
    }
  };

  if (isPageLoading) {
    return (
      <MainAppLayout><div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div></MainAppLayout>
    );
  }
  if (!isAuthorized) {
    return (
      <MainAppLayout><div className="text-center py-10">Access Denied. Redirecting...</div></MainAppLayout>
    );
  }

  return (
    <MainAppLayout>
      <div className="mb-6">
        <Button asChild variant="outline" size="sm"><Link href="/admin"><ArrowLeft className="mr-2 h-4 w-4" />Back to Admin</Link></Button>
      </div>
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">User Management</h1>
          <p className="text-lg text-muted-foreground">View, manage roles, and status of users. Roles are now managed via Firestore.</p>
        </div>
      </div>

      <Card className="border-border shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-primary">Registered Users</CardTitle>
          <CardDescription>List of users from Firebase Authentication with roles from Firestore.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingUsers && (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
              <p className="text-muted-foreground">Loading user data...</p>
            </div>
          )}
          {errorLoadingUsers && !isLoadingUsers && (
            <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md flex items-center gap-3">
              <AlertTriangle className="h-6 w-6" />
              <div><h3 className="font-semibold">Error Loading Users</h3><p>{errorLoadingUsers}</p></div>
            </div>
          )}
          {!isLoadingUsers && !errorLoadingUsers && users.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Avatar</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-center">Is Admin</TableHead>
                  <TableHead className="text-center">Is Dealer</TableHead>
                  <TableHead className="text-center">Enabled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.uid} className="hover:bg-muted/10">
                    <TableCell>
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email} data-ai-hint="user avatar" />
                        <AvatarFallback>{(user.displayName || user.email || 'U').substring(0, 1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{user.displayName || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                      <div className="text-xs text-muted-foreground">UID: {user.uid}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={user.isAdmin}
                        onCheckedChange={() => handleToggleRole(user.uid, 'isAdmin', user.isAdmin)}
                        disabled={currentUser?.uid === user.uid && user.isAdmin} // Prevent admin from revoking their own admin status
                        aria-label={user.isAdmin ? "Revoke Admin" : "Grant Admin"}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={user.isDealer}
                        onCheckedChange={() => handleToggleRole(user.uid, 'isDealer', user.isDealer)}
                        aria-label={user.isDealer ? "Revoke Dealer" : "Grant Dealer"}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                       <Switch
                        checked={!user.disabled} // Switch shows "enabled" state
                        onCheckedChange={() => handleToggleDisabled(user.uid, user.disabled)}
                        disabled={currentUser?.uid === user.uid} // Prevent admin from disabling themselves
                        aria-label={user.disabled ? "Enable User" : "Disable User"}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!isLoadingUsers && !errorLoadingUsers && users.length === 0 && (
            <p className="text-muted-foreground text-center py-10">No users found.</p>
          )}
        </CardContent>
      </Card>
      <div className="mt-6 p-4 bg-accent/10 border border-accent/30 rounded-md text-sm text-accent-foreground/80">
        <div className="flex items-start gap-3">
          <BadgeInfo className="h-5 w-5 mt-0.5 text-accent" />
          <div>
            <h4 className="font-semibold text-accent">Admin & Role Management Notes:</h4>
            <ul className="list-disc list-inside pl-1 mt-1 space-y-0.5 text-xs">
              <li>User roles (`isAdmin`, `isDealer`) are now stored and managed in Firestore (`userProfiles` collection).</li>
              <li>An Auth trigger (`onCreateUserInFirestore`) automatically creates a Firestore profile for new users with default roles set to false.</li>
              <li>The first admin user must have their `isAdmin: true` flag set manually in their Firestore profile document.</li>
              <li>Admins cannot revoke their own admin status or disable their own account through this interface.</li>
            </ul>
          </div>
        </div>
      </div>
    </MainAppLayout>
  );
}
