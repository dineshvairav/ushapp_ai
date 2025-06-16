
"use client";

import { useState, useRef, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { MainAppLayout } from '@/components/layout/MainAppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User as UserIconLucide, Mail, Edit3, LogOut, FileText, ImageIcon, Download, Camera, Phone, Loader2, ShieldAlert, FileWarning, UploadCloud, Trash2, Users, BadgeInfo, UserCheck } from 'lucide-react';
import { EditProfileModal } from '@/components/profile/EditProfileModal';
import Link from 'next/link';
import { onAuthStateChanged, type User, signOut, updateProfile } from "firebase/auth";
import { auth, rtdb, firestore, app as firebaseApp } from '@/lib/firebase'; // Added firestore
import { ref as databaseRefRtdb, set as setRtdb, get as getRtdb, onValue, push, remove as removeRtdb, query, orderByChild, equalTo } from 'firebase/database';
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"; // Added firestore doc functions
import { getStorage, ref as storageRefStandard, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { AdminUploadedFile } from '@/app/admin/uploads/page'; // GuestSharedFile removed as it's too specific
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

export interface UserProfileData {
  uid: string; 
  name: string;
  email: string;
  avatarUrl: string;
  joinDate: string;
  phone: string;
  isAdmin?: boolean;
  isDealer?: boolean;
}

export interface UserUploadedFile {
  id: string;
  fileName: string;
  downloadURL: string;
  contentType: string;
  size: number;
  uploadedAt: string; 
  uploaderUid: string;
}

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
const TARGET_STORAGE_BUCKET = "gs://ushapp-af453.firebasestorage.app"; // Assuming this is your bucket


export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData>({
    uid: '', name: 'Guest User', email: 'Not logged in', avatarUrl: DEFAULT_AVATAR_URL, joinDate: '', phone: '', isAdmin: false, isDealer: false,
  });

  const [avatarSrc, setAvatarSrc] = useState(userProfile.avatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userFileInputRef = useRef<HTMLInputElement>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [adminUploadedFiles, setAdminUploadedFiles] = useState<AdminUploadedFile[]>([]);
  const [isLoadingAdminFiles, setIsLoadingAdminFiles] = useState(true);

  const [userSpecificFiles, setUserSpecificFiles] = useState<UserUploadedFile[]>([]);
  const [isLoadingUserFiles, setIsLoadingUserFiles] = useState(true);
  const [selectedUserFile, setSelectedUserFile] = useState<File | null>(null);
  const [userUploadProgress, setUserUploadProgress] = useState(0);
  const [isUserUploading, setIsUserUploading] = useState(false);

  const [guestAccessedPhoneNumber, setGuestAccessedPhoneNumber] = useState<string | null>(null);
  const [guestSpecificSharedFiles, setGuestSpecificSharedFiles] = useState<GuestSpecificSharedFile[]>([]);
  const [isLoadingGuestSharedFiles, setIsLoadingGuestSharedFiles] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        localStorage.removeItem('guestPhoneNumber'); 
        setGuestAccessedPhoneNumber(null);
        setGuestSpecificSharedFiles([]);

        try {
          const userProfileRef = doc(firestore, "userProfiles", user.uid);
          const docSnap = await getDoc(userProfileRef);

          if (docSnap.exists()) {
            const profileData = docSnap.data();
            setUserProfile({
              uid: user.uid,
              name: profileData.displayName || user.displayName || 'User',
              email: profileData.email || user.email || 'No email',
              avatarUrl: profileData.photoURL || user.photoURL || DEFAULT_AVATAR_URL,
              joinDate: profileData.joinDate || (user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'),
              phone: profileData.phone || user.phoneNumber || '', // Prefer Firestore, then Auth phone
              isAdmin: profileData.isAdmin === true,
              isDealer: profileData.isDealer === true,
            });
            setAvatarSrc(profileData.photoURL || user.photoURL || DEFAULT_AVATAR_URL);
          } else {
            // Firestore profile doesn't exist, create one (Auth trigger should ideally handle this)
            const creationTime = user.metadata.creationTime ? new Date(user.metadata.creationTime).toISOString() : new Date().toISOString();
            const defaultProfileData = {
              uid: user.uid,
              email: user.email || "",
              displayName: user.displayName || "User",
              photoURL: user.photoURL || DEFAULT_AVATAR_URL,
              isAdmin: false,
              isDealer: false,
              phone: user.phoneNumber || "",
              joinDate: creationTime,
              disabled: user.disabled,
            };
            await setDoc(doc(firestore, "userProfiles", user.uid), defaultProfileData);
            setUserProfile({
                uid: user.uid,
                name: defaultProfileData.displayName,
                email: defaultProfileData.email,
                avatarUrl: defaultProfileData.photoURL,
                joinDate: new Date(defaultProfileData.joinDate).toLocaleDateString(),
                phone: defaultProfileData.phone,
                isAdmin: defaultProfileData.isAdmin,
                isDealer: defaultProfileData.isDealer,
            });
            setAvatarSrc(defaultProfileData.photoURL);
            console.warn(`Created Firestore profile for UID ${user.uid} from client-side.`);
          }
        } catch (error) {
          console.error("Error fetching/creating user profile from Firestore:", error);
          toast({variant: "destructive", title: "Profile Error", description: "Could not load your profile data."});
           setUserProfile({ uid: user.uid, name: user.displayName || 'User', email: user.email || 'No email', avatarUrl: user.photoURL || DEFAULT_AVATAR_URL, joinDate: 'N/A', phone: '', isAdmin: false, isDealer: false });
           setAvatarSrc(user.photoURL || DEFAULT_AVATAR_URL);
        }

        setIsLoadingUserFiles(true);
        const userFilesDbRef = databaseRefRtdb(rtdb, `userUploadedFiles/${user.uid}`); // Corrected path
        const unsubscribeUserFiles = onValue(userFilesDbRef, (snapshot) => {
          const data = snapshot.val();
          setUserSpecificFiles(data ? Object.keys(data).map(key => ({ id: key, ...data[key] })).sort((a,b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()) : []);
          setIsLoadingUserFiles(false);
        }, (err) => {
          toast({ variant: "destructive", title: "Error", description: "Could not load your files." });
          setIsLoadingUserFiles(false);
        });
        (unsubscribeAuth as any)._unsubscribeUserFiles = unsubscribeUserFiles;

      } else {
        setCurrentUser(null);
        const storedGuestPhone = localStorage.getItem('guestPhoneNumber');
        setGuestAccessedPhoneNumber(storedGuestPhone);
        setUserProfile({ uid: '', name: 'Guest User', email: `Guest (${storedGuestPhone || 'No number'})`, avatarUrl: DEFAULT_AVATAR_URL, joinDate: '', phone: storedGuestPhone || '', isAdmin: false, isDealer: false });
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

    const adminFilesDbRef = databaseRefRtdb(rtdb, 'adminUploadedFiles');
    const unsubscribeAdminFiles = onValue(adminFilesDbRef, (snapshot) => {
      const data = snapshot.val();
      setAdminUploadedFiles(data ? Object.keys(data).map(key => ({ id: key, ...data[key] })).sort((a,b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()) : []);
      setIsLoadingAdminFiles(false);
    }, (err) => {
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

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && currentUser) {
      if (avatarSrc && avatarSrc.startsWith('blob:')) URL.revokeObjectURL(avatarSrc);
      const newPreviewSrc = URL.createObjectURL(file);
      setAvatarSrc(newPreviewSrc); 

      const storage = getStorage(firebaseApp, TARGET_STORAGE_BUCKET);
      const avatarPath = `userAvatars/${currentUser.uid}/${Date.now()}-${file.name}`;
      const avatarStorageRef = storageRefStandard(storage, avatarPath);
      
      try {
        toast({ title: "Uploading Avatar...", description: "Please wait." });
        const uploadTask = uploadBytesResumable(avatarStorageRef, file, { contentType: file.type });
        await uploadTask;
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

        await updateProfile(currentUser, { photoURL: downloadURL });
        await updateDoc(doc(firestore, "userProfiles", currentUser.uid), { photoURL: downloadURL });
        
        setUserProfile(prev => ({ ...prev, avatarUrl: downloadURL }));
        setAvatarSrc(downloadURL); 
        toast({ title: "Avatar Updated", description: "Your new avatar has been saved." });
      } catch (error) {
        console.error("Error updating avatar:", error);
        toast({ variant: "destructive", title: "Avatar Update Failed", description: "Could not save your new avatar." });
        setAvatarSrc(userProfile.avatarUrl); 
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = ''; 
      }
    }
  };

  const handleAvatarClick = () => {
    if (!currentUser) { toast({title: "Login Required", description: "Please log in to change your avatar."}); return; }
    fileInputRef.current?.click();
  };

  const handleProfileSave = async (updatedData: UserProfileData) => {
    if (!currentUser) { toast({ variant: "destructive", title: "Error", description: "You must be logged in." }); return; }
    try {
      
      if (currentUser.displayName !== updatedData.name || currentUser.email !== updatedData.email) {
         // Note: Email change requires re-authentication or separate verification flow.
         // For simplicity, we only update displayName via updateProfile if it changed.
         // Email in auth profile should be updated via specific Firebase methods like verifyBeforeUpdateEmail.
        if (currentUser.displayName !== updatedData.name) {
            await updateProfile(currentUser, { displayName: updatedData.name });
        }
      }
      
      const userProfileRef = doc(firestore, "userProfiles", currentUser.uid);
      const dataToUpdate: Partial<UserProfileData> = {
        displayName: updatedData.name,
        phone: updatedData.phone,
      };
      // Only update email in Firestore if it's different and if you intend to manage it there.
      // Be mindful that this doesn't change the actual auth email used for login.
      if (userProfile.email !== updatedData.email) {
        dataToUpdate.email = updatedData.email;
      }

      await updateDoc(userProfileRef, dataToUpdate);
      
      setUserProfile(prev => ({
        ...prev,
        name: updatedData.name,
        phone: updatedData.phone,
        email: updatedData.email, 
      }));
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
      // Resetting state and local storage, then redirecting
      setCurrentUser(null);
      setUserProfile({ uid: '', name: 'Guest User', email: 'Not logged in', avatarUrl: DEFAULT_AVATAR_URL, joinDate: '', phone: '', isAdmin: false, isDealer: false });
      setAvatarSrc(DEFAULT_AVATAR_URL);
      localStorage.removeItem('guestPhoneNumber');
      setGuestAccessedPhoneNumber(null);
      setGuestSpecificSharedFiles([]);
      router.push('/onboarding'); // Redirect to onboarding after logout
    } catch (error) {
      console.error("Error logging out: ", error);
      toast({ variant: "destructive", title: "Logout Failed", description: "Could not log you out. Please try again." });
    }
  };

  const handleUserFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedUserFile(e.target.files[0]);
      setUserUploadProgress(0);
    } else {
      setSelectedUserFile(null);
    }
  };

  const handleUserFileUpload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUserFile || !currentUser) {
      toast({ variant: "destructive", title: "Error", description: "No file selected or not logged in." });
      return;
    }

    setIsUserUploading(true);
    setUserUploadProgress(0);
    const storage = getStorage(firebaseApp, TARGET_STORAGE_BUCKET);
    const filePath = `userUploadedFiles/${currentUser.uid}/${Date.now()}-${selectedUserFile.name}`;
    const fileStorageRef = storageRefStandard(storage, filePath);
    const metadata = { contentType: selectedUserFile.type || 'application/octet-stream' };
    const uploadTask = uploadBytesResumable(fileStorageRef, selectedUserFile, metadata);

    uploadTask.on('state_changed',
      (snapshot) => setUserUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
      (error) => {
        toast({ variant: "destructive", title: "Upload Failed", description: error.message });
        setIsUserUploading(false);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const newFileRef = push(databaseRefRtdb(rtdb, `userUploadedFiles/${currentUser.uid}`));
          const fileData: Omit<UserUploadedFile, 'id'> = {
            fileName: selectedUserFile.name,
            downloadURL,
            contentType: selectedUserFile.type,
            size: selectedUserFile.size,
            uploadedAt: new Date().toISOString(),
            uploaderUid: currentUser.uid,
          };
          await setRtdb(newFileRef, fileData);
          toast({ title: "Upload Successful", description: `${selectedUserFile.name} uploaded.` });
          setSelectedUserFile(null);
          if (userFileInputRef.current) userFileInputRef.current.value = '';
        } catch (dbError: any) {
          toast({ variant: "destructive", title: "Database Error", description: dbError.message });
        } finally {
          setIsUserUploading(false);
          setUserUploadProgress(0);
        }
      }
    );
  };
  
  const handleDeleteUserFile = async (file: UserUploadedFile) => {
    if (!currentUser || !window.confirm(`Delete "${file.fileName}"?`)) return;
    try {
      const storage = getStorage(firebaseApp, TARGET_STORAGE_BUCKET);
      // Construct storage path carefully. Assume path is 'userUploadedFiles/UID/timestamp-filename'
      // This requires knowing the exact path. A safer way would be to store the full storage path in RTDB.
      // For now, we'll assume the downloadURL can be parsed.
      const url = new URL(file.downloadURL);
      const pathSegments = url.pathname.split('/o/');
      if (pathSegments.length <= 1) throw new Error("Cannot determine storage path from download URL.");
      const encodedPath = pathSegments[1].split('?')[0];
      if (!encodedPath) throw new Error("Storage path for deletion is empty or malformed.");
      const storagePath = decodeURIComponent(encodedPath);

      const fileToDeleteStorageRef = storageRefStandard(storage, storagePath);
      await deleteObject(fileToDeleteStorageRef);
      await removeRtdb(databaseRefRtdb(rtdb, `userUploadedFiles/${currentUser.uid}/${file.id}`));
      toast({ title: "File Deleted", description: `${file.fileName} deleted.` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Deletion Failed", description: error.message });
    }
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) return <ImageIcon className="h-6 w-6 text-blue-500" />;
    if (contentType === 'application/pdf') return <FileText className="h-6 w-6 text-red-500" />;
    return <FileWarning className="h-6 w-6 text-yellow-500" />;
  };
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  useEffect(() => { const currentSrc = avatarSrc; return () => { if (currentSrc?.startsWith('blob:')) URL.revokeObjectURL(currentSrc); }; }, [avatarSrc]);

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
              <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden"/>
              <CardTitle className="text-2xl">{userProfile.name}</CardTitle>
              <CardDescription>{userProfile.email}</CardDescription>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {userProfile.isAdmin && <Badge variant="destructive" className="bg-red-600 text-white"><ShieldAlert className="mr-1.5 h-4 w-4" /> Admin</Badge>}
                {userProfile.isDealer && <Badge variant="secondary" className="bg-accent text-accent-foreground"><UserCheck className="mr-1.5 h-4 w-4" /> Dealer</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm"><UserIconLucide className="mr-2 h-4 w-4 text-muted-foreground" /><span>Joined on {userProfile.joinDate}</span></div>
              <div className="flex items-center text-sm"><Phone className="mr-2 h-4 w-4 text-muted-foreground" /><span>{userProfile.phone || 'No phone number'}</span></div>
              <Separator />
              <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive/80 hover:bg-destructive/10" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" /> Log Out</Button>
            </CardContent>
          </Card>
          
          <div className="lg:col-span-2 space-y-8">
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

        {currentUser && (
        <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-xl">Order History</CardTitle><CardDescription>View your past orders and their status.</CardDescription></CardHeader>
            <CardContent><p className="text-muted-foreground text-center py-6">No orders placed yet.</p></CardContent>
        </Card>
        )}
        
        <div className="mt-6 p-4 bg-card border border-border/50 rounded-md text-sm">
            <div className="flex items-start gap-3">
            <BadgeInfo className="h-5 w-5 mt-0.5 text-primary" />
            <div>
                <h4 className="font-semibold text-primary">Profile & Role Information:</h4>
                <ul className="list-disc list-inside pl-1 mt-1 space-y-0.5 text-xs text-muted-foreground">
                <li>Your profile information (name, phone) is stored in Firestore.</li>
                <li>Roles like 'Admin' or 'Dealer' are managed by administrators and grant specific access.</li>
                <li>If you believe your roles are incorrect, please contact support.</li>
                </ul>
            </div>
            </div>
        </div>

      </div>
      {currentUser && (
        <EditProfileModal isOpen={isEditModalOpen} onOpenChange={setIsEditModalOpen} currentUser={userProfile} onSave={handleProfileSave}/>
      )}
    </MainAppLayout>
  );
}

