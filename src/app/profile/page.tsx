
"use client";

import { useState, useRef, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { MainAppLayout } from '@/components/layout/MainAppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User as UserIconLucide, Mail, Edit3, LogOut, FileText, ImageIcon, Download, Camera, Phone, Loader2, ShieldAlert, FileWarning, UploadCloud, Trash2, Users } from 'lucide-react';
import { EditProfileModal } from '@/components/profile/EditProfileModal';
import Link from 'next/link';
import { onAuthStateChanged, type User, signOut, updateProfile } from "firebase/auth";
import { auth, rtdb, app as firebaseApp } from '@/lib/firebase';
import { ref as databaseRefRtdb, set as setRtdb, get as getRtdb, onValue, push, remove as removeRtdb, query, orderByChild, equalTo } from 'firebase/database';
import { getStorage, ref as storageRefStandard, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { AdminUploadedFile, GuestSharedFile as AdminGuestSharedFile } from '@/app/admin/uploads/page'; // GuestSharedFile from admin page context
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

export interface UserProfileData {
  name: string;
  email: string;
  avatarUrl: string;
  joinDate: string;
  phone: string;
  firebaseUid?: string;
  isDealer?: boolean;
}

export interface UserUploadedFile { // Files uploaded BY the logged-in user
  id: string;
  fileName: string;
  downloadURL: string;
  contentType: string;
  size: number;
  uploadedAt: string; 
  uploaderUid: string;
}

// Files shared by admin WITH a specific guest (phone number)
export interface GuestSpecificSharedFile {
    id: string;
    fileName: string;
    downloadURL: string;
    contentType: string;
    size: number;
    uploadedAt: string;
}


const DEFAULT_AVATAR_URL = 'https://placehold.co/200x200.png';
const USER_ACCEPTED_FILE_TYPES = "image/jpeg, image/png, image/gif, application/pdf, .pdf";

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
  const userFileInputRef = useRef<HTMLInputElement>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // For globally shared admin files
  const [adminUploadedFiles, setAdminUploadedFiles] = useState<AdminUploadedFile[]>([]);
  const [isLoadingAdminFiles, setIsLoadingAdminFiles] = useState(true);

  // For files uploaded BY the logged-in user
  const [userSpecificFiles, setUserSpecificFiles] = useState<UserUploadedFile[]>([]);
  const [isLoadingUserFiles, setIsLoadingUserFiles] = useState(true);
  const [selectedUserFile, setSelectedUserFile] = useState<File | null>(null);
  const [userUploadProgress, setUserUploadProgress] = useState(0);
  const [isUserUploading, setIsUserUploading] = useState(false);

  // For files shared by admin WITH a specific guest
  const [guestAccessedPhoneNumber, setGuestAccessedPhoneNumber] = useState<string | null>(null);
  const [guestSpecificSharedFiles, setGuestSpecificSharedFiles] = useState<GuestSpecificSharedFile[]>([]);
  const [isLoadingGuestSharedFiles, setIsLoadingGuestSharedFiles] = useState(false);


  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) { // Authenticated user
        setCurrentUser(user);
        localStorage.removeItem('guestPhoneNumber'); // Clear guest phone if user logs in
        setGuestAccessedPhoneNumber(null);
        setGuestSpecificSharedFiles([]);

        const newAvatarUrl = user.photoURL || DEFAULT_AVATAR_URL;
        let isDealerAccount = false;
        let userPhone = '';

        try {
          const idTokenResult = await user.getIdTokenResult(true);
          isDealerAccount = idTokenResult.claims.isDealer === true;
          const phoneRef = databaseRefRtdb(rtdb, `userProfileData/${user.uid}/phone`);
          const phoneSnapshot = await getRtdb(phoneRef);
          if (phoneSnapshot.exists()) userPhone = phoneSnapshot.val();
        } catch (error) { console.error("Error fetching claims/phone for profile:", error); }

        setUserProfile({
          name: user.displayName || 'User',
          email: user.email || 'No email',
          avatarUrl: newAvatarUrl,
          joinDate: user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A',
          firebaseUid: user.uid,
          isDealer: isDealerAccount,
          phone: userPhone,
        });
        setAvatarSrc(newAvatarUrl);

        // Fetch user's own uploaded files
        setIsLoadingUserFiles(true);
        const userFilesDbRef = databaseRefRtdb(rtdb, `userFiles/${user.uid}`);
        const unsubscribeUserFiles = onValue(userFilesDbRef, (snapshot) => {
          const data = snapshot.val();
          setUserSpecificFiles(data ? Object.keys(data).map(key => ({ id: key, ...data[key] })).sort((a,b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()) : []);
          setIsLoadingUserFiles(false);
        }, (err) => {
          toast({ variant: "destructive", title: "Error", description: "Could not load your files." });
          setIsLoadingUserFiles(false);
        });
        (unsubscribeAuth as any)._unsubscribeUserFiles = unsubscribeUserFiles;

      } else { // Guest user (not logged in via Firebase Auth)
        setCurrentUser(null);
        const storedGuestPhone = localStorage.getItem('guestPhoneNumber');
        setGuestAccessedPhoneNumber(storedGuestPhone);
        setUserProfile({ name: 'Guest User', email: `Guest (${storedGuestPhone || 'No number'})`, avatarUrl: DEFAULT_AVATAR_URL, joinDate: '', phone: storedGuestPhone || '', isDealer: false });
        setAvatarSrc(DEFAULT_AVATAR_URL);
        setUserSpecificFiles([]);
        setIsLoadingUserFiles(false);

        if (storedGuestPhone) {
          setIsLoadingGuestSharedFiles(true);
          const guestFilesDbRef = databaseRefRtdb(rtdb, `guestSharedFiles/${storedGuestPhone}`);
          const unsubscribeGuestShared = onValue(guestFilesDbRef, (snapshot) => {
            const data = snapshot.val();
            setGuestSpecificSharedFiles(data ? Object.keys(data).map(key => ({ id: key, ...data[key] })).sort((a,b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()) : []);
            setIsLoadingGuestSharedFiles(false);
          }, (err) => {
            toast({ variant: "destructive", title: "Error", description: "Could not load documents shared with you." });
            setIsLoadingGuestSharedFiles(false);
          });
          (unsubscribeAuth as any)._unsubscribeGuestShared = unsubscribeGuestShared;
        } else {
          setGuestSpecificSharedFiles([]);
          setIsLoadingGuestSharedFiles(false);
        }
      }
      setIsLoading(false);
    });

    // Fetch globally shared admin files (for all users)
    const adminFilesDbRef = databaseRefRtdb(rtdb, 'adminUploadedFiles');
    const unsubscribeAdminFiles = onValue(adminFilesDbRef, (snapshot) => {
      const data = snapshot.val();
      setAdminUploadedFiles(data ? Object.keys(data).map(key => ({ id: key, ...data[key] })).sort((a,b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()) : []);
      setIsLoadingAdminFiles(false);
    }, (err) => {
      // Minor error, don't be too noisy
      console.error("Could not load shared admin files for profile page:", err);
      setIsLoadingAdminFiles(false);
    });

    return () => {
      if ((unsubscribeAuth as any)._unsubscribeUserFiles) (unsubscribeAuth as any)._unsubscribeUserFiles();
      if ((unsubscribeAuth as any)._unsubscribeGuestShared) (unsubscribeAuth as any)._unsubscribeGuestShared();
      unsubscribeAuth();
      unsubscribeAdminFiles();
    };
  }, [router, toast]);


  const handleAvatarClick = () => {
    if (!currentUser) { toast({title: "Login Required", description: "Please log in to change your avatar."}); return; }
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && currentUser) {
      if (avatarSrc && avatarSrc.startsWith('blob:')) URL.revokeObjectURL(avatarSrc);
      const newSrc = URL.createObjectURL(file);
      setAvatarSrc(newSrc);
      toast({ title: "Avatar Preview Updated", description: "Saving avatar requires backend logic (not fully implemented).", duration: 5000 });
    }
  };

  const handleProfileSave = async (updatedUser: UserProfileData) => {
    if (!currentUser || !auth.currentUser) { toast({ variant: "destructive", title: "Error", description: "You must be logged in." }); return; }
    try {
      if (auth.currentUser.displayName !== updatedUser.name) await updateProfile(auth.currentUser, { displayName: updatedUser.name });
      if (userProfile.phone !== updatedUser.phone && updatedUser.firebaseUid) await setRtdb(databaseRefRtdb(rtdb, `userProfileData/${updatedUser.firebaseUid}/phone`), updatedUser.phone || "");
      setUserProfile(updatedUser);
      toast({ title: "Profile Updated", description: "Your profile information has been saved." });
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not save profile changes." });
    }
  };
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('guestPhoneNumber'); // Clear guest phone on logout
      setGuestAccessedPhoneNumber(null);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/onboarding');
    } catch (error) {
      toast({ variant: "destructive", title: "Logout Failed", description: "Could not log out." });
    }
  };

  const handleUserFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setSelectedUserFile(e.target.files[0]); else setSelectedUserFile(null);
    setUserUploadProgress(0);
  };

  const handleUserFileUpload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUserFile || !currentUser) { toast({ variant: "destructive", title: "Error", description: "Please select a file and ensure you are logged in." }); return; }
    setIsUserUploading(true); setUserUploadProgress(0);
    const storage = getStorage(firebaseApp);
    const filePath = `userUploads/${currentUser.uid}/${new Date().getTime()}-${selectedUserFile.name}`;
    const uploadTask = uploadBytesResumable(storageRefStandard(storage, filePath), selectedUserFile, { contentType: selectedUserFile.type || 'application/octet-stream' });
    uploadTask.on('state_changed', (s) => setUserUploadProgress((s.bytesTransferred / s.totalBytes) * 100),
      (err) => { toast({ variant: "destructive", title: "Upload Failed", description: err.message }); setIsUserUploading(false); },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const fileData: Omit<UserUploadedFile, 'id'> = { fileName: selectedUserFile.name, downloadURL, contentType: selectedUserFile.type, size: selectedUserFile.size, uploadedAt: new Date().toISOString(), uploaderUid: currentUser.uid };
          await setRtdb(push(databaseRefRtdb(rtdb, `userFiles/${currentUser.uid}`)), fileData);
          toast({ title: "File Uploaded", description: `${selectedUserFile.name} saved.` });
          setSelectedUserFile(null); if (userFileInputRef.current) userFileInputRef.current.value = '';
        } catch (dbErr) { toast({ variant: "destructive", title: "Database Error", description: "File uploaded, but failed to save metadata." });
        } finally { setIsUserUploading(false); setUserUploadProgress(0); }
      });
  };

  const handleDeleteUserFile = async (file: UserUploadedFile) => {
     if (!currentUser || currentUser.uid !== file.uploaderUid) { toast({ variant: "destructive", title: "Unauthorized" }); return; }
     if (!window.confirm(`Delete "${file.fileName}"?`)) return;
    try {
      const storage = getStorage(firebaseApp);
      const url = new URL(file.downloadURL);
      const storagePath = decodeURIComponent(url.pathname.split('/o/')[1].split('?')[0]);
      await deleteObject(storageRefStandard(storage, storagePath));
      await removeRtdb(databaseRefRtdb(rtdb, `userFiles/${currentUser.uid}/${file.id}`));
      toast({ title: "File Deleted", description: `${file.fileName} removed.` });
    } catch (error: any) { toast({ variant: "destructive", title: "Deletion Failed", description: error.message }); }
  };

  useEffect(() => { const currentSrc = avatarSrc; return () => { if (currentSrc?.startsWith('blob:')) URL.revokeObjectURL(currentSrc); }; }, [avatarSrc]);

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) return <ImageIcon className="h-6 w-6 text-accent" />;
    if (contentType === 'application/pdf') return <FileText className="h-6 w-6 text-primary" />;
    return <FileWarning className="h-6 w-6 text-muted-foreground" />;
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'; const k = 1024; const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + ['Bytes', 'KB', 'MB', 'GB', 'TB'][i];
  };

  let avatarHint = userProfile.name === 'Guest User' ? "guest avatar placeholder" : "profile avatar";
  if (!avatarSrc || avatarSrc === DEFAULT_AVATAR_URL) avatarHint = "avatar placeholder";

  if (isLoading) {
    return <MainAppLayout><div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="ml-3">Loading profile...</p></div></MainAppLayout>;
  }

  return (
    <MainAppLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              {currentUser ? "My Profile" : guestAccessedPhoneNumber ? "Guest Profile" : "Shared Resources"}
            </h1>
            <p className="text-lg text-muted-foreground">
              {currentUser ? "Manage your account details and personal files." : guestAccessedPhoneNumber ? `Viewing documents for ${guestAccessedPhoneNumber}.` : "Access files shared by the admin."}
            </p>
          </div>
          {currentUser && (
            <Button variant="outline" className="shrink-0" onClick={() => setIsEditModalOpen(true)}>
              <Edit3 className="mr-2 h-4 w-4" /> Profile Settings
            </Button>
          )}
        </div>

        {/* Authenticated User Profile Card */}
        {currentUser && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1 bg-card border-border">
            <CardHeader className="items-center text-center">
              <div className="relative group cursor-pointer" onClick={handleAvatarClick} role="button" tabIndex={0} aria-label="Change profile picture">
                <Avatar className="h-24 w-24 mb-4 ring-2 ring-primary ring-offset-2 ring-offset-card">
                  <AvatarImage src={avatarSrc} alt={userProfile.name} data-ai-hint={avatarHint}/>
                  <AvatarFallback>{userProfile.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"><Camera className="h-8 w-8 text-white" /></div>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden"/>
              <CardTitle className="text-2xl">{userProfile.name}</CardTitle>
              <CardDescription>{userProfile.email}</CardDescription>
              {userProfile.isDealer && <Badge variant="secondary" className="mt-2 bg-accent text-accent-foreground"><ShieldAlert className="mr-1.5 h-4 w-4" /> Dealer Account</Badge>}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm"><UserIconLucide className="mr-2 h-4 w-4 text-muted-foreground" /><span>Joined on {userProfile.joinDate}</span></div>
              <div className="flex items-center text-sm"><Phone className="mr-2 h-4 w-4 text-muted-foreground" /><span>{userProfile.phone || 'No phone number'}</span></div>
              <Separator />
              <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive/80 hover:bg-destructive/10" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" /> Log Out</Button>
            </CardContent>
          </Card>
          
          <div className="lg:col-span-2 space-y-8">
            {/* User's Personal File Upload Section */}
            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="text-xl flex items-center gap-2"><UploadCloud className="text-primary"/>My Files</CardTitle><CardDescription>Upload and manage your personal documents.</CardDescription></CardHeader>
              <form onSubmit={handleUserFileUpload}>
                <CardContent className="space-y-4">
                  <div><Label htmlFor="user-file-upload-input">Choose File to Upload</Label><Input id="user-file-upload-input" ref={userFileInputRef} type="file" onChange={handleUserFileSelect} accept={USER_ACCEPTED_FILE_TYPES} disabled={isUserUploading}/>
                  {selectedUserFile && <p className="text-xs mt-1">Selected: {selectedUserFile.name} ({formatFileSize(selectedUserFile.size)})</p>}</div>
                  {isUserUploading && <div className="space-y-1"><Progress value={userUploadProgress} /><p className="text-xs text-center">{Math.round(userUploadProgress)}%</p></div>}
                </CardContent>
                <CardFooter><Button type="submit" disabled={isUserUploading || !selectedUserFile}>{isUserUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isUserUploading ? 'Uploading...' : 'Upload My File'}</Button></CardFooter>
              </form>
              {isLoadingUserFiles ? <div className="p-6 text-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                : userSpecificFiles.length > 0 ? <div className="p-6 pt-2 space-y-3 max-h-96 overflow-y-auto">{userSpecificFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 rounded-md border hover:border-primary/50">
                      <div className="flex items-center gap-3">{getFileIcon(file.contentType)}<div><p className="font-medium truncate max-w-[200px] sm:max-w-xs" title={file.fileName}>{file.fileName}</p><p className="text-xs text-muted-foreground">{formatFileSize(file.size)} - {new Date(file.uploadedAt).toLocaleDateString()}</p></div></div>
                      <div className="space-x-1"><Button asChild variant="ghost" size="icon"><a href={file.downloadURL} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4 text-accent" /></a></Button><Button variant="ghost" size="icon" onClick={() => handleDeleteUserFile(file)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
                    </div>))}</div>
                : <p className="text-muted-foreground text-center p-6">You haven't uploaded any files yet.</p>}
            </Card>
          </div>
        </div>
        )}

        {/* Guest-Specific Shared Files Section */}
        {!currentUser && guestAccessedPhoneNumber && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2"><Users className="text-primary" />Documents Shared With You</CardTitle>
              <CardDescription>Files specifically shared with phone number: {guestAccessedPhoneNumber}.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingGuestSharedFiles ? <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              : guestSpecificSharedFiles.length > 0 ? (
                <ul className="space-y-4 max-h-96 overflow-y-auto">{guestSpecificSharedFiles.map((file) => (
                  <li key={file.id} className="flex items-center justify-between p-3 bg-background/50 rounded-md border hover:border-primary/50">
                    <div className="flex items-center gap-3">{getFileIcon(file.contentType)}<div><p className="font-medium truncate max-w-xs sm:max-w-md" title={file.fileName}>{file.fileName}</p><p className="text-xs text-muted-foreground">{formatFileSize(file.size)} - Shared: {new Date(file.uploadedAt).toLocaleDateString()}</p></div></div>
                    <Button asChild variant="ghost" size="icon"><a href={file.downloadURL} target="_blank" rel="noopener noreferrer"><Download className="h-5 w-5 text-accent" /></a></Button>
                  </li>))}</ul>
              ) : <p className="text-muted-foreground text-center py-6">No documents have been specifically shared with this phone number.</p>}
            </CardContent>
          </Card>
        )}

        {/* Globally Shared Admin Files Section (visible to all) */}
        <Card className="bg-card border-border">
            <CardHeader>
                <CardTitle className="text-xl">Shared Documents from Admin</CardTitle>
                <CardDescription>General files and documents uploaded by the admin team for all users.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAdminFiles ? <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              : adminUploadedFiles.length > 0 ? (
                <ul className="space-y-4 max-h-96 overflow-y-auto">{adminUploadedFiles.map((file) => (
                  <li key={file.id} className="flex items-center justify-between p-3 bg-background/50 rounded-md border hover:border-primary/50">
                    <div className="flex items-center gap-3">{getFileIcon(file.contentType)}<div><p className="font-medium truncate max-w-xs sm:max-w-md" title={file.fileName}>{file.fileName}</p><p className="text-xs text-muted-foreground">{formatFileSize(file.size)} - Uploaded: {new Date(file.uploadedAt).toLocaleDateString()}</p></div></div>
                    <Button asChild variant="ghost" size="icon"><a href={file.downloadURL} target="_blank" rel="noopener noreferrer"><Download className="h-5 w-5 text-accent" /></a></Button>
                  </li>))}</ul>
              ) : <p className="text-muted-foreground text-center py-6">No general files have been shared by the admin yet.</p>}
            </CardContent>
        </Card>

        {/* Order History (only for authenticated users) */}
        {currentUser && (
        <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-xl">Order History</CardTitle><CardDescription>View your past orders and their status.</CardDescription></CardHeader>
            <CardContent><p className="text-muted-foreground text-center py-6">No orders placed yet.</p></CardContent>
        </Card>
        )}
      </div>
      {currentUser && (
        <EditProfileModal isOpen={isEditModalOpen} onOpenChange={setIsEditModalOpen} currentUser={userProfile} onSave={handleProfileSave}/>
      )}
    </MainAppLayout>
  );
}
