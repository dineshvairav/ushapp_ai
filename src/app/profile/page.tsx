
"use client";

import { useState, useRef, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { MainAppLayout } from '@/components/layout/MainAppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User as UserIconLucide, Mail, Edit3, LogOut, FileText, ImageIcon, Download, Camera, Phone, Loader2, ShieldAlert, FileWarning, UploadCloud, Trash2 } from 'lucide-react';
import { EditProfileModal } from '@/components/profile/EditProfileModal';
import Link from 'next/link';
import { onAuthStateChanged, type User, signOut, updateProfile } from "firebase/auth";
import { auth, rtdb, app as firebaseApp } from '@/lib/firebase';
import { ref as databaseRefRtdb, set as setRtdb, get as getRtdb, onValue, push, remove as removeRtdb } from 'firebase/database';
import { getStorage, ref as storageRefStandard, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { AdminUploadedFile } from '@/app/admin/uploads/page';
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

export interface UserUploadedFile {
  id: string;
  fileName: string;
  downloadURL: string;
  contentType: string;
  size: number;
  uploadedAt: string; // ISO string
  uploaderUid: string;
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

  const [adminUploadedFiles, setAdminUploadedFiles] = useState<AdminUploadedFile[]>([]);
  const [isLoadingAdminFiles, setIsLoadingAdminFiles] = useState(true);

  const [userSpecificFiles, setUserSpecificFiles] = useState<UserUploadedFile[]>([]);
  const [isLoadingUserFiles, setIsLoadingUserFiles] = useState(true);
  const [selectedUserFile, setSelectedUserFile] = useState<File | null>(null);
  const [userUploadProgress, setUserUploadProgress] = useState(0);
  const [isUserUploading, setIsUserUploading] = useState(false);


  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const newAvatarUrl = user.photoURL || DEFAULT_AVATAR_URL;
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

        // Fetch user-specific files
        const userFilesDbRef = databaseRefRtdb(rtdb, `userFiles/${user.uid}`);
        const unsubscribeUserFiles = onValue(userFilesDbRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const fileList: UserUploadedFile[] = Object.keys(data).map(key => ({
              id: key,
              ...data[key]
            })).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
            setUserSpecificFiles(fileList);
          } else {
            setUserSpecificFiles([]);
          }
          setIsLoadingUserFiles(false);
        }, (err) => {
          console.error("Firebase RTDB read error (userFiles):", err);
          toast({ variant: "destructive", title: "Error", description: "Could not load your personal files." });
          setIsLoadingUserFiles(false);
        });
        // Store unsubscribe function to call it in cleanup
        (unsubscribeAuth as any)._unsubscribeUserFiles = unsubscribeUserFiles;

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
        setUserSpecificFiles([]);
        setIsLoadingUserFiles(false);
      }
      setIsLoading(false);
    });

    const filesDbRef = databaseRefRtdb(rtdb, 'adminUploadedFiles');
    const unsubscribeAdminFiles = onValue(filesDbRef, (snapshot) => {
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
      // toast({ variant: "destructive", title: "Error", description: "Could not load shared files." }); // Be less noisy if it's a secondary feature
      setIsLoadingAdminFiles(false);
    });


    return () => {
      if ((unsubscribeAuth as any)._unsubscribeUserFiles) {
        (unsubscribeAuth as any)._unsubscribeUserFiles();
      }
      unsubscribeAuth();
      unsubscribeAdminFiles();
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
      toast({ variant: "destructive", title: "Error", description: "Please select a file and ensure you are logged in." });
      return;
    }

    setIsUserUploading(true);
    setUserUploadProgress(0);

    const storage = getStorage(firebaseApp); // Default bucket, rules will direct
    const filePath = `userUploads/${currentUser.uid}/${new Date().getTime()}-${selectedUserFile.name}`;
    const fileStorageRef = storageRefStandard(storage, filePath);

    const metadata = { contentType: selectedUserFile.type || 'application/octet-stream' };
    const uploadTask = uploadBytesResumable(fileStorageRef, selectedUserFile, metadata);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUserUploadProgress(progress);
      },
      (error) => {
        console.error("User file upload error:", error);
        toast({ variant: "destructive", title: "Upload Failed", description: `Could not upload file: ${error.message}. Check Storage rules.` });
        setIsUserUploading(false);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const newFileRef = push(databaseRefRtdb(rtdb, `userFiles/${currentUser.uid}`));
          
          const fileData: Omit<UserUploadedFile, 'id'> = {
            fileName: selectedUserFile.name,
            downloadURL,
            contentType: selectedUserFile.type,
            size: selectedUserFile.size,
            uploadedAt: new Date().toISOString(),
            uploaderUid: currentUser.uid,
          };
          await setRtdb(newFileRef, fileData);
          toast({ title: "File Uploaded", description: `${selectedUserFile.name} saved.` });
          setSelectedUserFile(null);
          if (userFileInputRef.current) userFileInputRef.current.value = '';
        } catch (dbError) {
            console.error("Error saving user file metadata to RTDB:", dbError);
            toast({ variant: "destructive", title: "Database Error", description: "File uploaded, but failed to save metadata." });
        } finally {
            setIsUserUploading(false);
            setUserUploadProgress(0);
        }
      }
    );
  };

  const handleDeleteUserFile = async (file: UserUploadedFile) => {
     if (!currentUser || currentUser.uid !== file.uploaderUid) {
      toast({ variant: "destructive", title: "Unauthorized", description: "You can only delete your own files." });
      return;
    }
    if (!window.confirm(`Are you sure you want to delete "${file.fileName}"?`)) return;

    try {
      const storage = getStorage(firebaseApp);
      // Derive path from download URL (simplified, assumes default Firebase Storage URL structure)
      const url = new URL(file.downloadURL);
      const storagePath = decodeURIComponent(url.pathname.split('/o/')[1].split('?')[0]);
      
      const fileToDeleteStorageRef = storageRefStandard(storage, storagePath);
      await deleteObject(fileToDeleteStorageRef);
      await removeRtdb(databaseRefRtdb(rtdb, `userFiles/${currentUser.uid}/${file.id}`));
      toast({ title: "File Deleted", description: `${file.fileName} has been removed.` });
    } catch (error: any) {
      console.error("Error deleting user file:", error);
      toast({ variant: "destructive", title: "Deletion Failed", description: `Could not delete file: ${error.message}` });
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
    if (contentType === 'application/pdf') return <FileText className="h-6 w-6 text-primary" />;
    return <FileWarning className="h-6 w-6 text-muted-foreground" />;
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
              {currentUser ? "My Profile" : "Shared Resources"}
            </h1>
            <p className="text-lg text-muted-foreground">
              {currentUser ? "Manage your account details and personal files." : "Access files shared by the admin."}
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
          
          <div className="lg:col-span-2 space-y-8">
            {/* User's Personal File Upload Section */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2"><UploadCloud className="text-primary"/>My Files</CardTitle>
                <CardDescription>Upload and manage your personal documents (PDFs, images).</CardDescription>
              </CardHeader>
              <form onSubmit={handleUserFileUpload}>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="user-file-upload-input" className="text-foreground">Choose File to Upload</Label>
                    <Input
                      id="user-file-upload-input"
                      ref={userFileInputRef}
                      type="file"
                      onChange={handleUserFileSelect}
                      accept={USER_ACCEPTED_FILE_TYPES}
                      className="bg-input border-input focus:border-primary"
                      disabled={isUserUploading}
                    />
                    {selectedUserFile && <p className="text-xs text-muted-foreground mt-1">Selected: {selectedUserFile.name} ({formatFileSize(selectedUserFile.size)})</p>}
                  </div>
                  {isUserUploading && (
                    <div className="space-y-1">
                      <Progress value={userUploadProgress} className="w-full" />
                      <p className="text-xs text-muted-foreground text-center">{Math.round(userUploadProgress)}%</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isUserUploading || !selectedUserFile}>
                    {isUserUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isUserUploading ? 'Uploading...' : 'Upload My File'}
                  </Button>
                </CardFooter>
              </form>
              {isLoadingUserFiles ? (
                <div className="flex justify-center items-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : userSpecificFiles.length > 0 ? (
                <div className="p-6 pt-2 space-y-3 max-h-96 overflow-y-auto">
                  {userSpecificFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-background/50 rounded-md border border-border hover:border-primary/50 transition-colors">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.contentType)}
                        <div>
                          <p className="font-medium text-foreground truncate max-w-[200px] sm:max-w-xs" title={file.fileName}>{file.fileName}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)} - {new Date(file.uploadedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="space-x-1">
                        <Button asChild variant="ghost" size="icon" aria-label={`Download ${file.fileName}`}>
                          <a href={file.downloadURL} target="_blank" rel="noopener noreferrer" download={file.fileName}>
                            <Download className="h-4 w-4 text-accent hover:text-accent/80" />
                          </a>
                        </Button>
                         <Button variant="ghost" size="icon" aria-label={`Delete ${file.fileName}`} onClick={() => handleDeleteUserFile(file)}>
                            <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/80" />
                         </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-6 px-6">You haven't uploaded any files yet.</p>
              )}
            </Card>

            {/* Admin shared files shown below user files if logged in */}
            <Card className="bg-card border-border">
              <CardHeader>
                  <CardTitle className="text-xl">Shared Documents from Admin</CardTitle>
                  <CardDescription>Files uploaded by the admin team.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAdminFiles ? (
                  <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : adminUploadedFiles.length > 0 ? (
                  <ul className="space-y-4  max-h-96 overflow-y-auto">
                    {adminUploadedFiles.map((file) => (
                      <li key={file.id} className="flex items-center justify-between p-3 bg-background/50 rounded-md border border-border hover:border-primary/50 transition-colors">
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.contentType)}
                          <div>
                            <p className="font-medium text-foreground truncate max-w-xs sm:max-w-sm md:max-w-md" title={file.fileName}>{file.fileName}</p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)} - Uploaded: {new Date(file.uploadedAt).toLocaleDateString()}</p>
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
                  <p className="text-muted-foreground text-center py-6">No files have been shared by the admin yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        )}

        {!currentUser && ( 
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-xl">Shared Documents from Admin</CardTitle>
                    <CardDescription>Files uploaded by the admin team. Login to upload your own files.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingAdminFiles ? (
                    <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                  ) : adminUploadedFiles.length > 0 ? (
                    <ul className="space-y-4">
                      {adminUploadedFiles.map((file) => (
                        <li key={file.id} className="flex items-center justify-between p-3 bg-background/50 rounded-md border border-border hover:border-primary/50 transition-colors">
                          <div className="flex items-center gap-3">
                            {getFileIcon(file.contentType)}
                            <div>
                              <p className="font-medium text-foreground truncate max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl" title={file.fileName}>{file.fileName}</p>
                              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)} - Uploaded: {new Date(file.uploadedAt).toLocaleDateString()}</p>
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
                    <p className="text-muted-foreground text-center py-6">No files have been shared by the admin yet.</p>
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


    