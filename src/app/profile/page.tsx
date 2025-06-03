
"use client";

import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { MainAppLayout } from '@/components/layout/MainAppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User as UserIcon, Mail, Edit3, LogOut, FileText, ImageIcon, Download, Camera, Phone, Loader2 } from 'lucide-react';
import { EditProfileModal } from '@/components/profile/EditProfileModal';
import Link from 'next/link';
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from '@/lib/firebase'; // Firebase auth instance
import { useRouter } from 'next/navigation';

// Mock data for admin uploaded files
const adminFiles = [
  { id: 'file1', name: 'Product Catalog Q3 2024.pdf', type: 'pdf', size: '2.5MB', date: '2024-07-15' },
  { id: 'file2', name: 'Summer Collection Lookbook.jpg', type: 'image', size: '5.1MB', date: '2024-07-10' },
  { id: 'file3', name: 'Return Policy.pdf', type: 'pdf', size: '300KB', date: '2024-06-01' },
];

export interface UserProfileData {
  name: string;
  email: string;
  avatarUrl: string;
  joinDate: string;
  phone: string;
  firebaseUid?: string;
}

const DEFAULT_AVATAR_URL = 'https://placehold.co/200x200.png';

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData>({
    name: 'Guest User',
    email: 'Not logged in',
    avatarUrl: DEFAULT_AVATAR_URL,
    joinDate: '',
    phone: '',
  });

  const [avatarSrc, setAvatarSrc] = useState(userProfile.avatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        const newAvatarUrl = user.photoURL || DEFAULT_AVATAR_URL;
        setUserProfile(prevProfile => ({
          ...prevProfile,
          name: user.displayName || 'User',
          email: user.email || 'No email provided',
          avatarUrl: newAvatarUrl,
          joinDate: user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A',
          firebaseUid: user.uid,
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
        });
        setAvatarSrc(DEFAULT_AVATAR_URL);
        router.replace('/onboarding');
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (avatarSrc.startsWith('blob:')) {
        URL.revokeObjectURL(avatarSrc);
      }
      const newSrc = URL.createObjectURL(file);
      setAvatarSrc(newSrc);
      // In a real app, you'd upload 'file' to Firebase Storage
      // and update user.photoURL via updateProfile(auth.currentUser, { photoURL: newUrl })
      // For now, this also means the data-ai-hint will reflect "profile avatar"
      // as newSrc is not the default placeholder.
    }
  };

  const handleProfileSave = (updatedUser: UserProfileData) => {
    setUserProfile(updatedUser);
    // If updatedUser.avatarUrl was changed (e.g. by removing a custom avatar back to default), reflect it.
    // However, EditProfileModal doesn't currently handle avatar URL changes, only name/email/phone.
    // If it did, we'd update avatarSrc here too.
    // setAvatarSrc(updatedUser.avatarUrl);
  };

  useEffect(() => {
    const currentSrc = avatarSrc;
    return () => {
      if (currentSrc.startsWith('blob:')) {
        URL.revokeObjectURL(currentSrc);
      }
    };
  }, [avatarSrc]);

  const getFileIcon = (fileType: string) => {
    if (fileType === 'pdf') return <FileText className="h-6 w-6 text-primary" />;
    if (fileType === 'image') return <ImageIcon className="h-6 w-6 text-accent" />;
    return <FileText className="h-6 w-6 text-muted-foreground" />;
  };
  
  const avatarHint = avatarSrc === DEFAULT_AVATAR_URL || !avatarSrc ? 'avatar placeholder' : 'profile avatar';


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
              My Profile
            </h1>
            <p className="text-lg text-muted-foreground">
              Manage your account details and view your activity.
            </p>
          </div>
          <Button variant="outline" className="shrink-0" onClick={() => setIsEditModalOpen(true)}>
            <Edit3 className="mr-2 h-4 w-4" /> Profile Settings
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1 bg-card border-border">
            <CardHeader className="items-center text-center">
              <div className="relative group cursor-pointer" onClick={handleAvatarClick} role="button" tabIndex={0}
                   aria-label="Change profile picture">
                <Avatar className="h-24 w-24 mb-4 ring-2 ring-primary ring-offset-2 ring-offset-card">
                  <AvatarImage src={avatarSrc || DEFAULT_AVATAR_URL} alt={userProfile.name} data-ai-hint={avatarHint} />
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
            </CardHeader>
            <CardContent className="space-y-3">
              {currentUser && (
                <>
                  <div className="flex items-center text-sm">
                    <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Joined on {userProfile.joinDate}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{userProfile.phone || 'No phone number'}</span>
                  </div>
                  <Separator />
                </>
              )}
              <Button asChild variant="ghost" className="w-full justify-start text-destructive hover:text-destructive/80 hover:bg-destructive/10">
                <Link href="/">
                  <LogOut className="mr-2 h-4 w-4" /> Log Out
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl">Admin Uploaded Files</CardTitle>
              <CardDescription>
                Important documents and images shared by the ushªOªppteam.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {adminFiles.length > 0 ? (
                <ul className="space-y-4">
                  {adminFiles.map((file) => (
                    <li key={file.id} className="flex items-center justify-between p-3 bg-background/50 rounded-md border border-border hover:border-primary/50 transition-colors">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.type)}
                        <div>
                          <p className="font-medium text-foreground">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {file.size} - Uploaded: {file.date}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" aria-label={`Download ${file.name}`}>
                        <Download className="h-5 w-5 text-accent hover:text-accent/80" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center py-6">
                  No files have been uploaded by the admin yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
            <CardHeader>
                <CardTitle className="text-xl">Order History</CardTitle>
                <CardDescription>View your past orders and their status.</CardDescription>
            </CardHeader>
            <CardContent>
                {currentUser ? (
                     <p className="text-muted-foreground text-center py-6">No orders placed yet.</p>
                ) : (
                    <p className="text-muted-foreground text-center py-6">Please log in to see your order history.</p>
                )}
            </CardContent>
        </Card>
      </div>
      <EditProfileModal
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        currentUser={userProfile}
        onSave={handleProfileSave}
      />
    </MainAppLayout>
  );
}
