
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
import { getFunctions, httpsCallable, type HttpsCallableResult } from 'firebase/functions';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = 'dineshvairav@gmail.com'; // Used for initial admin check, actual authorization happens in functions

interface ManagedUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isDealer: boolean;
  isAdmin: boolean;
  creationTime: string | null;
  lastSignInTime: string | null;
  disabled: boolean;
}

interface ListUsersResponse {
  users: ManagedUser[];
}

export default function UserManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPageLoading, setIsPageLoading] = useState(true); // For admin auth check
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [errorLoadingUsers, setErrorLoadingUsers] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user && user.email === ADMIN_EMAIL) { // Initial client-side check for UI purposes
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
        router.replace(user ? '/' : '/onboarding');
      }
      setIsPageLoading(false);
    });
    return () => unsubscribeAuth();
  }, [router]);

  useEffect(() => {
    if (!isAuthorized || isPageLoading) return;

    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      setErrorLoadingUsers(null);
      try {
        const functions = getFunctions(auth.app);
        const listAllUsersFunction = httpsCallable<void, HttpsCallableResult<ListUsersResponse>>(functions, 'listAllUsers');
        const result = await listAllUsersFunction();
        const data = result.data as ListUsersResponse;
        setManagedUsers(data.users || []);
      } catch (error: any) {
        console.error("Error fetching users:", error);
        setErrorLoadingUsers(error.message || "Failed to load users. Ensure you have admin privileges and the backend function is deployed.");
        toast({
          variant: "destructive",
          title: "Error Fetching Users",
          description: error.message || "Could not load user data from the server.",
        });
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [isAuthorized, isPageLoading, toast]);

  const callManageClaim = async (targetUid: string, claimName: string, claimValue: boolean, successMessage: string) => {
    try {
      const functions = getFunctions(auth.app);
      const manageClaimFunction = httpsCallable< { targetUid: string; claimName: string; claimValue: boolean }, { success: boolean; message: string } >(functions, 'manageAdminClaim');
      
      const result = await manageClaimFunction({ targetUid, claimName, claimValue });

      if (result.data.success) {
        toast({ title: "Success", description: successMessage });
        // Re-fetch users to reflect changes
        setManagedUsers(prevUsers => prevUsers.map(u => 
          u.uid === targetUid ? { ...u, [claimName]: claimValue } : u
        ));
         // To fully reflect custom claims, user might need to re-auth or token refresh.
         // For immediate UI update, we optimistically update state.
         // A full re-fetch might be better:
         // const fetchUsers = async () => { ... }; fetchUsers();
      } else {
        throw new Error(result.data.message || "Failed to update claim.");
      }
    } catch (error: any) {
      console.error(`Error updating ${claimName} status:`, error);
      toast({ variant: "destructive", title: "Update Failed", description: error.message || `Could not update ${claimName} status.` });
    }
  };

  const handleToggleDealerStatus = async (targetUid: string, currentIsDealer: boolean) => {
    await callManageClaim(targetUid, 'isDealer', !currentIsDealer, `User ${targetUid} dealer status set to ${!currentIsDealer}.`);
  };

  const handleToggleAdminStatus = async (targetUid: string, currentIsAdmin: boolean) => {
     if (currentUser && targetUid === currentUser.uid && currentIsAdmin) {
      toast({ variant: "destructive", title: "Action Denied", description: "Admin cannot remove their own admin status."});
      return;
    }
    await callManageClaim(targetUid, 'isAdmin', !currentIsAdmin, `User ${targetUid} admin status set to ${!currentIsAdmin}.`);
  };
  
  const handleToggleUserDisabledStatus = async (targetUid: string, currentIsDisabled: boolean) => {
     if (currentUser && targetUid === currentUser.uid && !currentIsDisabled) {
      toast({ variant: "destructive", title: "Action Denied", description: "Admin cannot disable their own account."});
      return;
    }
    try {
      const functions = getFunctions(auth.app);
      const manageUserStatusFunction = httpsCallable<{ targetUid: string; shouldBeDisabled: boolean }, { success: boolean; message: string }>(functions, 'manageUserDisabledStatus');
      const result = await manageUserStatusFunction({ targetUid, shouldBeDisabled: !currentIsDisabled });

      if (result.data.success) {
        toast({ title: "Status Updated", description: result.data.message });
        setManagedUsers(prevUsers => prevUsers.map(u => 
          u.uid === targetUid ? { ...u, disabled: !currentIsDisabled } : u
        ));
      } else {
        throw new Error(result.data.message || "Failed to update user status.");
      }
    } catch (error: any) {
      console.error("Error toggling user disabled status:", error);
      toast({ variant: "destructive", title: "Update Failed", description: error.message || "Could not update user status." });
    }
  };


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
            View and manage user accounts. Data fetched live from Firebase.
          </p>
        </div>
      </div>

      <Card className="mb-8 border-amber-500/50 bg-amber-50/10">
        <CardHeader className="flex flex-row items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-amber-500 mt-1" />
          <div>
            <CardTitle className="text-amber-600">Important Notes</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-amber-700/90 space-y-1 pl-12">
            <p><strong>Data Source:</strong> User data is fetched from Firebase Authentication via a secure Cloud Function.</p>
            <p><strong>Custom Claims:</strong> Roles like "Dealer" or "Admin" are managed using Firebase Custom Claims. Changes may require user to re-authenticate or for their ID token to refresh to take full effect on client-side checks immediately, though backend function calls will use the latest claims.</p>
            <p><strong>Security:</strong> All actions (listing users, changing claims/status) are protected by backend checks ensuring only authorized admins can perform them.</p>
        </CardContent>
      </Card>
      
      {isLoadingUsers && (
        <div className="flex flex-col items-center justify-center min-h-[30vh] bg-card border border-border rounded-xl shadow-lg p-6">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
          <p className="text-muted-foreground">Loading users from database...</p>
        </div>
      )}

      {errorLoadingUsers && !isLoadingUsers && (
         <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md flex items-center gap-3">
          <AlertTriangle className="h-6 w-6" />
          <div>
            <h3 className="font-semibold">Error Loading Users</h3>
            <p>{errorLoadingUsers}</p>
          </div>
        </div>
      )}

      {!isLoadingUsers && !errorLoadingUsers && (
        <Card className="border-border shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-primary">User List</CardTitle>
             <CardDescription>Displaying {managedUsers.length} users.</CardDescription>
          </CardHeader>
          <CardContent>
            {managedUsers.length > 0 ? (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Dealer</TableHead>
                    <TableHead className="text-center">Admin</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>UID</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {managedUsers.map((user) => (
                    <TableRow key={user.uid} className="hover:bg-muted/10">
                      <TableCell className="font-medium text-foreground whitespace-nowrap">{user.displayName || 'N/A'}</TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">{user.email || 'N/A'}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant={user.isDealer ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => handleToggleDealerStatus(user.uid, user.isDealer)}
                          className={user.isDealer ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                        >
                          <ShieldCheck className={`mr-1 h-4 w-4 ${user.isDealer ? '' : 'text-muted-foreground'}`} />
                          {user.isDealer ? 'Yes' : 'No'}
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                            variant={user.isAdmin ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => handleToggleAdminStatus(user.uid, user.isAdmin)}
                            className={user.isAdmin ? "bg-sky-600 hover:bg-sky-700 text-white" : ""}
                            disabled={currentUser?.uid === user.uid && user.isAdmin}
                            title={currentUser?.uid === user.uid && user.isAdmin ? "Cannot remove own admin status" : (user.isAdmin ? "Remove Admin" : "Make Admin")}
                          >
                          <ShieldCheck className={`mr-1 h-4 w-4 ${user.isAdmin ? '' : 'text-muted-foreground'}`} />
                          {user.isAdmin ? 'Yes' : 'No'}
                        </Button>
                      </TableCell>
                       <TableCell className="text-center">
                        <Button
                          variant={user.disabled ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => handleToggleUserDisabledStatus(user.uid, user.disabled)}
                          className={!user.disabled ? "text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700" : ""}
                          disabled={currentUser?.uid === user.uid && !user.disabled}
                          title={currentUser?.uid === user.uid && !user.disabled ? "Cannot disable own account" : (user.disabled ? "Enable User" : "Disable User")}
                        >
                           {user.disabled ? <UserX className="mr-1 h-4 w-4"/> : <UserCog className="mr-1 h-4 w-4"/>}
                           {user.disabled ? 'Disabled' : 'Active'}
                        </Button>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate max-w-[100px]" title={user.uid}>{user.uid}</TableCell>
                      <TableCell className="text-center space-x-1 whitespace-nowrap">
                         {/* Future actions like 'View Details' or 'Edit User' could go here */}
                         <Button variant="ghost" size="sm" onClick={() => toast({title: "Info", description: `Created: ${user.creationTime ? new Date(user.creationTime).toLocaleDateString() : 'N/A'}\nLast Sign In: ${user.lastSignInTime ? new Date(user.lastSignInTime).toLocaleString() : 'N/A'}`})}>
                            Info
                         </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-6">No users found in the database.</p>
            )}
          </CardContent>
        </Card>
      )}
    </MainAppLayout>
  );
}
