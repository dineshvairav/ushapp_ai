
"use client";

import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { MainAppLayout } from '@/components/layout/MainAppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User as UserIconLucide, Mail, Edit3, LogOut, FileText, ImageIcon, Download, Camera, Phone, Loader2, ShieldAlert, FileWarning } from 'lucide-react'; // Renamed User, Added FileWarning
import { EditProfileModal } from '@/components/profile/EditProfileModal';
import Link from 'next/link';
import { onAuthStateChanged, type User, signOut, updateProfile } from "firebase/auth";
import { auth, rtdb } from '@/lib/firebase'; // auth and rtdb
import { ref as databaseRefRtdb, set as setRtdb, get as getRtdb, onValue } from 'firebase/database'; // Aliased RTDB functions
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { AdminUploadedFile } from '@/app/admin/uploads/page'; // Import the type

export interface UserProfileData {
  name: string;
  email: string;
  avatarUrl: string;
  joinDate: string;
  phone: string;
  firebaseUid?: string;
  isDealer?: boolean;
}

const DEFAULT_AVATAR_URL = 'https://placehold.co/200x200.png';

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData>({
    name: 'Guest User',
    email: 'Not logged in',
    avatarUrl: DEFAULT_AVATAR_URL,
    joinDate: '',
    phone: '',
    isDealer: false,
  });

  const [avatarSrc, setAvatarSrc] = useState(userProfile.avatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [adminUploadedFiles, setAdminUploadedFiles] = useState<AdminUploadedFile[]>([]);
  const [isLoadingAdminFiles, setIsLoadingAdminFiles] = useState(true);


  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const newAvatarUrl = user.photoURL || DEFAULT_AVAT_AR_URL;
        let isDealerAccount = false;
        let userPhone = '';

        try {
          const idTokenResult = await user.getIdTokenResult(true);
          isDealerAccount = idTokenResult.claims.isDealer === true;
          const phoneRef = databaseRefRtdb(rtdb, `userProfileData/${user.uid}/phone`);
          const phoneSnapshot = await getRtdb(phoneRef);
          if (phoneSnapshot.exists()) {
            userPhone = phoneSnapshot.val();
          }
        } catch (error) {
          console.error("Error fetching custom claims or phone for profile:", error);
        }

        setUserProfile(prevProfile => ({
          ...prevProfile,
          name: user.displayName || 'User',
          email: user.email || 'No email provided',
          avatarUrl: newAvatarUrl,
          joinDate: user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A',
          firebaseUid: user.uid,
          isDealer: isDealerAccount,
          phone: userPhone,
        }));
        setAvatarSrc(newAvatarUrl);
      } else {
        setCurrentUser(null);
        setUserProfile({
            name: 'Guest User',
            email: 'Not logged in',
            avatarUrl: DEFAULT_AVATAR_URL,
            joinDate: '',
            phone: '',
            isDealer: false,
        });
        setAvatarSrc(DEFAULT_AVATAR_URL);
        // No redirect here, allow anonymous users to see shared files
      }
      setIsLoading(false);
    });

    // Fetch admin uploaded files
    const filesDbRef = databaseRefRtdb(rtdb, 'adminUploadedFiles');
    const unsubscribeFiles = onValue(filesDbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const fileList: AdminUploadedFile[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
        setAdminUploadedFiles(fileList);
      } else {
        setAdminUploadedFiles([]);
      }
      setIsLoadingAdminFiles(false);
    }, (err) => {
      console.error("Firebase RTDB read error (adminUploadedFiles for profile):", err);
      toast({ variant: "destructive", title: "Error", description: "Could not load shared files." });
      setIsLoadingAdminFiles(false);
    });


    return () => {
      unsubscribeAuth();
      unsubscribeFiles();
    };
  }, [router, toast]);

  const handleAvatarClick = () => {
    if (!currentUser) {
        toast({title: "Login Required", description: "Please log in to change your avatar."});
        return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && currentUser) {
      if (avatarSrc && avatarSrc.startsWith('blob:')) {
        URL.revokeObjectURL(avatarSrc);
      }
      const newSrc = URL.createObjectURL(file);
      setAvatarSrc(newSrc);
      toast({
        title: "Avatar Preview Updated",
        description: "To save this avatar permanently, integration with Firebase Storage and updating your authentication profile is required. This feature is not fully implemented yet.",
        duration: 7000,
      });
    }
  };

  const handleProfileSave = async (updatedUser: UserProfileData) => {
    if (!currentUser || !auth.currentUser) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to save profile changes." });
      return;
    }

    try {
      if (auth.currentUser.displayName !== updatedUser.name) {
        await updateProfile(auth.currentUser, { displayName: updatedUser.name });
      }
      if (userProfile.phone !== updatedUser.phone && updatedUser.firebaseUid) {
         const phoneRef = databaseRefRtdb(rtdb, `userProfileData/${updatedUser.firebaseUid}/phone`);
         await setRtdb(phoneRef, updatedUser.phone || "");
      }
      setUserProfile(updatedUser);
      toast({ title: "Profile Updated", description: "Your profile information has been saved." });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({ variant: "destructive", title: "Update Failed", description: "Could not save profile changes." });
    }
  };
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/onboarding');
    } catch (error) {
      console.error("Logout error:", error);
      toast({ variant: "destructive", title: "Logout Failed", description: "Could not log out. Please try again." });
    }
  };

  useEffect(() => {
    const currentSrc = avatarSrc;
    return () => {
      if (currentSrc && currentSrc.startsWith('blob:')) {
        URL.revokeObjectURL(currentSrc);
      }
    };
  }, [avatarSrc]);

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) return <ImageIcon className="h-6 w-6 text-accent" />;
    if (contentType === 'application/pdf') return <FileText className="h-6 w-6 text-primary" />; // PDF icon
    return <FileWarning className="h-6 w-6 text-muted-foreground" />; // Generic file icon
  };
  
  let avatarHint = "profile avatar";
  if (!avatarSrc || avatarSrc === DEFAULT_AVATAR_URL) {
      avatarHint = "avatar placeholder";
  }

  if (isLoading) {
    return (
      <MainAppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Loading profile...</p>
        </div>
      </MainAppLayout>
    );
  }

  return (
    <MainAppLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              {currentUser ? "My Profile" : "Shared Files"}
            </h1>
            <p className="text-lg text-muted-foreground">
              {currentUser ? "Manage your account details and view your activity." : "Access files shared by the admin."}
            </p>
          </div>
          {currentUser && (
            <Button variant="outline" className="shrink-0" onClick={() => setIsEditModalOpen(true)}>
              <Edit3 className="mr-2 h-4 w-4" /> Profile Settings
            </Button>
          )}
        </div>

        {currentUser && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1 bg-card border-border">
            <CardHeader className="items-center text-center">
                <div className="relative group cursor-pointer" onClick={handleAvatarClick} role="button" tabIndex={0}
                    aria-label="Change profile picture">
                  <Avatar className="h-24 w-24 mb-4 ring-2 ring-primary ring-offset-2 ring-offset-card">
                    <AvatarImage src={avatarSrc} alt={userProfile.name} data-ai-hint={avatarHint}/>
                    <AvatarFallback>{userProfile.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <CardTitle className="text-2xl">{userProfile.name}</CardTitle>
              <CardDescription>{userProfile.email}</CardDescription>
              {userProfile.isDealer && (
                <Badge variant="secondary" className="mt-2 bg-accent text-accent-foreground">
                  <ShieldAlert className="mr-1.5 h-4 w-4" /> Dealer Account
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
                  <div className="flex items-center text-sm">
                    <UserIconLucide className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Joined on {userProfile.joinDate}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{userProfile.phone || 'No phone number'}</span>
                  </div>
                  <Separator />
                  <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive/80 hover:bg-destructive/10" onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" /> Log Out
                  </Button>
            </CardContent>
          </Card>
           {/* Admin uploaded files shown in the second column if user is logged in */}
           <Card className="lg:col-span-2 bg-card border-border">
             <CardHeader>
                <CardTitle className="text-xl">Shared Documents</CardTitle>
                <CardDescription>
                    Files uploaded by the admin team.
                </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAdminFiles ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : adminUploadedFiles.length > 0 ? (
                <ul className="space-y-4">
                  {adminUploadedFiles.map((file) => (
                    <li key={file.id} className="flex items-center justify-between p-3 bg-background/50 rounded-md border border-border hover:border-primary/50 transition-colors">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.contentType)}
                        <div>
                          <p className="font-medium text-foreground truncate max-w-xs sm:max-w-sm md:max-w-md" title={file.fileName}>{file.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            { (file.size / (1024 * 1024)).toFixed(2) } MB - Uploaded: {new Date(file.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button asChild variant="ghost" size="icon" aria-label={`Download ${file.fileName}`}>
                        <a href={file.downloadURL} target="_blank" rel="noopener noreferrer" download={file.fileName}>
                            <Download className="h-5 w-5 text-accent hover:text-accent/80" />
                        </a>
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center py-6">
                  No files have been shared by the admin yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        )}

        {!currentUser && ( // Display shared files full-width for anonymous users
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-xl">Shared Documents</CardTitle>
                    <CardDescription>
                        Files uploaded by the admin team.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingAdminFiles ? (
                    <div className="flex justify-center items-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : adminUploadedFiles.length > 0 ? (
                    <ul className="space-y-4">
                      {adminUploadedFiles.map((file) => (
                        <li key={file.id} className="flex items-center justify-between p-3 bg-background/50 rounded-md border border-border hover:border-primary/50 transition-colors">
                          <div className="flex items-center gap-3">
                            {getFileIcon(file.contentType)}
                            <div>
                              <p className="font-medium text-foreground truncate max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl" title={file.fileName}>{file.fileName}</p>
                              <p className="text-xs text-muted-foreground">
                                { (file.size / (1024 * 1024)).toFixed(2) } MB - Uploaded: {new Date(file.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Button asChild variant="ghost" size="icon" aria-label={`Download ${file.fileName}`}>
                            <a href={file.downloadURL} target="_blank" rel="noopener noreferrer" download={file.fileName}>
                                <Download className="h-5 w-5 text-accent hover:text-accent/80" />
                            </a>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground text-center py-6">
                      No files have been shared by the admin yet.
                    </p>
                  )}
                </CardContent>
            </Card>
        )}


        {currentUser && (
        <Card className="bg-card border-border">
            <CardHeader>
                <CardTitle className="text-xl">Order History</CardTitle>
                <CardDescription>View your past orders and their status.</CardDescription>
            </CardHeader>
            <CardContent>
                 <p className="text-muted-foreground text-center py-6">No orders placed yet.</p>
            </CardContent>
        </Card>
        )}
      </div>
      {currentUser && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          currentUser={userProfile}
          onSave={handleProfileSave}
        />
      )}
    </MainAppLayout>
  );
}
