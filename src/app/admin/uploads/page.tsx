
"use client";

import { useEffect, useState, type FormEvent, type ChangeEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MainAppLayout } from '@/components/layout/MainAppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, UploadCloud, FileIcon, Trash2, Loader2, AlertTriangle, Download, Copy, UserCheck } from 'lucide-react';
import { auth, rtdb, app as firebaseApp } from '@/lib/firebase';
import { getStorage, ref as storageRefStandard, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { ref as databaseRef, onValue, push, set, remove } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";

const ADMIN_EMAIL = 'dineshvairav@gmail.com';
const ACCEPTED_FILE_TYPES = "image/jpeg, image/png, image/gif, application/pdf, .pdf";
const TARGET_STORAGE_BUCKET = "gs://ushapp-af453.firebasestorage.app";

export interface AdminUploadedFile {
  id: string;
  fileName: string;
  downloadURL: string;
  contentType: string;
  size: number;
  uploadedAt: string; // ISO string
  uploadedByEmail: string | null;
}

export interface GuestSharedFile extends Omit<AdminUploadedFile, 'uploadedByEmail'> {
  targetPhoneNumber?: string;
}


export default function FileUploadPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const [guestPhoneNumber, setGuestPhoneNumber] = useState('');
  const [selectedGuestFile, setSelectedGuestFile] = useState<File | null>(null);
  const [guestUploadProgress, setGuestUploadProgress] = useState(0);
  const [isUploadingGuestFile, setIsUploadingGuestFile] = useState(false);

  const [uploadedFiles, setUploadedFiles] = useState<AdminUploadedFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [errorFiles, setErrorFiles] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
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
    if (!isAuthorized && !isAdminLoading) return;

    const filesDbRef = databaseRef(rtdb, 'adminUploadedFiles');
    const unsubscribeFiles = onValue(filesDbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const fileList: AdminUploadedFile[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
        setUploadedFiles(fileList);
        setErrorFiles(null);
      } else {
        setUploadedFiles([]);
      }
      setIsLoadingFiles(false);
    }, (err) => {
      console.error("Firebase RTDB read error (adminUploadedFiles):", err);
      setErrorFiles("Failed to load uploaded files. Please try again.");
      setIsLoadingFiles(false);
      toast({ variant: "destructive", title: "Database Error", description: "Could not fetch uploaded files." });
    });

    return () => unsubscribeFiles();
  }, [toast, isAuthorized, isAdminLoading]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadProgress(0);
    } else {
      setSelectedFile(null);
    }
  };
  
  const handleGuestFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedGuestFile(e.target.files[0]);
      setGuestUploadProgress(0);
    } else {
      setSelectedGuestFile(null);
    }
  };

  const handleFileUpload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFile) {
      toast({ variant: "destructive", title: "No File", description: "Please select a file to upload." });
      return;
    }
    if (!currentUser?.email) {
      toast({ variant: "destructive", title: "Auth Error", description: "Uploader email not found." });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    console.log(`Starting general admin upload for file: ${selectedFile.name}, size: ${selectedFile.size}, type: ${selectedFile.type}`);

    const storage = getStorage(firebaseApp, TARGET_STORAGE_BUCKET);
    const filePath = `adminUploads/${new Date().getTime()}-${selectedFile.name}`;
    const fileStorageRef = storageRefStandard(storage, filePath);
    console.log("General Admin Upload: Attempting to upload to storage path:", fileStorageRef.toString());
    const metadata = { contentType: selectedFile.type || 'application/octet-stream' };
    const uploadTask = uploadBytesResumable(fileStorageRef, selectedFile, metadata);

    uploadTask.on('state_changed',
      (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
      (error) => {
        console.error("General Admin Upload error:", error);
        let description = `Upload failed: ${error.code} - ${error.message}.`;
        if (error.code === 'storage/unauthorized') {
            description += ' Please check Firebase Storage security rules for the adminUploads/ path.';
        }
        toast({ variant: "destructive", title: "Upload Failed", description });
        setIsUploading(false);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log("General Admin Upload: File uploaded successfully. Download URL:", downloadURL);
          const newFileRef = push(databaseRef(rtdb, 'adminUploadedFiles'));
          const fileData: Omit<AdminUploadedFile, 'id'> = {
            fileName: selectedFile.name,
            downloadURL,
            contentType: selectedFile.type,
            size: selectedFile.size,
            uploadedAt: new Date().toISOString(),
            uploadedByEmail: currentUser.email,
          };
          await set(newFileRef, fileData);
          console.log("General Admin Upload: File metadata saved to RTDB:", fileData);
          toast({ title: "Upload Successful", description: `${selectedFile.name} has been uploaded.` });
          setSelectedFile(null);
          const fileInput = document.getElementById('file-upload-input') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
        } catch (dbError) {
            console.error("General Admin Upload: Error saving file metadata to RTDB:", dbError);
            toast({ variant: "destructive", title: "Database Error", description: "Could not save file metadata after upload." });
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
      }
    );
  };

  const handleGuestFileUpload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedGuestFile) {
      toast({ variant: "destructive", title: "No File", description: "Please select a file for the guest." });
      return;
    }
    if (!guestPhoneNumber.trim()) {
      toast({ variant: "destructive", title: "No Phone Number", description: "Please enter the guest's phone number." });
      return;
    }
    if (!currentUser?.email) {
      toast({ variant: "destructive", title: "Auth Error", description: "Admin email not found." });
      return;
    }
    const sanitizedPhoneNumber = guestPhoneNumber.replace(/\D/g, '');
    if (sanitizedPhoneNumber.length < 10) {
         toast({ variant: "destructive", title: "Invalid Phone", description: "Please enter a valid phone number." });
         return;
    }

    setIsUploadingGuestFile(true);
    setGuestUploadProgress(0);
    console.log(`Starting guest file upload for phone: ${sanitizedPhoneNumber}, file: ${selectedGuestFile.name}, size: ${selectedGuestFile.size}, type: ${selectedGuestFile.type}`);

    const storage = getStorage(firebaseApp, TARGET_STORAGE_BUCKET); // Use explicit bucket
    const filePath = `guestSharedFiles/${sanitizedPhoneNumber}/${new Date().getTime()}-${selectedGuestFile.name}`;
    const fileStorageRef = storageRefStandard(storage, filePath);
    console.log("Guest File Upload: Attempting to upload to storage path:", fileStorageRef.toString());
    const metadata = { contentType: selectedGuestFile.type || 'application/octet-stream' };
    const uploadTask = uploadBytesResumable(fileStorageRef, selectedGuestFile, metadata);

    uploadTask.on('state_changed',
      (snapshot) => setGuestUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
      (error) => {
        console.error("Guest file upload error:", error);
        let description = `Upload failed: ${error.code} - ${error.message}.`;
        if (error.code === 'storage/unauthorized') {
            description += ' Please check Firebase Storage security rules for the guestSharedFiles/ path.';
        }
        toast({ variant: "destructive", title: "Upload Failed", description });
        setIsUploadingGuestFile(false);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log("Guest File Upload: File uploaded successfully. Download URL:", downloadURL);
          const newFileRef = push(databaseRef(rtdb, `guestSharedFiles/${sanitizedPhoneNumber}`));
          const fileData: Omit<GuestSharedFile, 'id'> = {
            fileName: selectedGuestFile.name,
            downloadURL,
            contentType: selectedGuestFile.type,
            size: selectedGuestFile.size,
            uploadedAt: new Date().toISOString(),
            targetPhoneNumber: sanitizedPhoneNumber,
          };
          await set(newFileRef, fileData);
          console.log("Guest File Upload: File metadata saved to RTDB:", fileData);
          toast({ title: "Guest File Uploaded", description: `${selectedGuestFile.name} uploaded for ${sanitizedPhoneNumber}.` });
          setSelectedGuestFile(null);
          setGuestPhoneNumber('');
          const guestFileInput = document.getElementById('guest-file-upload-input') as HTMLInputElement;
          if (guestFileInput) guestFileInput.value = '';
        } catch (dbError) {
            console.error("Guest File Upload: Error saving guest file metadata to RTDB:", dbError);
            toast({ variant: "destructive", title: "Database Error", description: "Could not save guest file metadata." });
        } finally {
            setIsUploadingGuestFile(false);
            setGuestUploadProgress(0);
        }
      }
    );
  };


  const handleDeleteFile = async (file: AdminUploadedFile) => {
    if (!window.confirm(`Are you sure you want to delete "${file.fileName}"? This will remove it from storage and the list.`)) {
      return;
    }
    try {
      const storage = getStorage(firebaseApp, TARGET_STORAGE_BUCKET);
      const url = new URL(file.downloadURL);
      const pathSegments = url.pathname.split('/o/');
      if (pathSegments.length <= 1) throw new Error("Cannot determine storage path from download URL.");
      
      // Ensure path starts after the bucket name part in the pathname.
      // Example pathname: /v0/b/ushapp-af453.appspot.com/o/adminUploads%2F1719999999999-example.pdf
      // We need to extract "adminUploads%2F1719999999999-example.pdf" then decode it.
      const encodedPath = pathSegments[1].split('?')[0]; // Remove query params like alt=media&token=...
      if (!encodedPath) throw new Error("Storage path for deletion is empty or malformed.");
      const storagePath = decodeURIComponent(encodedPath);
      
      console.log("Attempting to delete from storage path:", storagePath);
      const fileToDeleteStorageRef = storageRefStandard(storage, storagePath);
      await deleteObject(fileToDeleteStorageRef);
      await remove(databaseRef(rtdb, `adminUploadedFiles/${file.id}`));
      toast({ title: "File Deleted", description: `${file.fileName} has been deleted.` });
    } catch (error: any) {
      console.error("Error deleting file:", error);
      toast({ variant: "destructive", title: "Deletion Failed", description: error.message || `Could not delete ${file.fileName}.` });
    }
  };
  
  const handleCopyLink = (downloadURL: string) => {
    navigator.clipboard.writeText(downloadURL)
      .then(() => toast({ title: "Link Copied", description: "Download link copied to clipboard." }))
      .catch(err => toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy link." }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  if (isAdminLoading) {
    return <MainAppLayout><div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div></MainAppLayout>;
  }
  if (!isAuthorized) {
    return <MainAppLayout><div className="text-center py-10">Access Denied. Redirecting...</div></MainAppLayout>;
  }

  return (
    <MainAppLayout>
      <div className="mb-6">
        <Button asChild variant="outline" size="sm"><Link href="/admin"><ArrowLeft className="mr-2 h-4 w-4" />Back to Admin Dashboard</Link></Button>
      </div>
      <div className="flex items-center gap-3 mb-6">
        <UploadCloud className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">File Upload Management</h1>
          <p className="text-lg text-muted-foreground">Upload shared files or documents for specific guests.</p>
        </div>
      </div>
      
      <Card className="mb-8 border-destructive/30 bg-destructive/5">
        <CardHeader className="flex flex-row items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive mt-1" />
          <div><CardTitle className="text-destructive/90 text-lg">Security & Storage Note</CardTitle></div>
        </CardHeader>
        <CardContent className="text-sm text-destructive/80 space-y-1 pl-12">
            <p>Files are stored in Firebase Storage (Bucket: {TARGET_STORAGE_BUCKET}) and metadata in RTDB. Ensure Security Rules are configured for `adminUploads/` (general) and `guestSharedFiles/` (guest-specific) paths.</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8"> {/* Changed grid to 2 columns */}
        <Card className="lg:col-span-1 border-border shadow-lg"> {/* Upload for Guest */}
          <CardHeader>
            <CardTitle className="text-xl text-primary flex items-center gap-2"><UserCheck className="h-6 w-6" /> Upload File for Guest</CardTitle>
            <CardDescription>Upload a file (PDF, image) for a specific guest identified by phone number.</CardDescription>
          </CardHeader>
          <form onSubmit={handleGuestFileUpload}>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="guest-phone-number" className="text-foreground">Guest Phone Number</Label>
                <Input
                  id="guest-phone-number"
                  type="tel"
                  value={guestPhoneNumber}
                  onChange={(e) => setGuestPhoneNumber(e.target.value)}
                  placeholder="e.g., +14155552671 or 9988776655"
                  required
                  className="bg-input border-input focus:border-primary"
                  disabled={isUploadingGuestFile}
                />
              </div>
              <div>
                <Label htmlFor="guest-file-upload-input" className="text-foreground">Choose File for Guest</Label>
                <Input
                  id="guest-file-upload-input"
                  type="file"
                  onChange={handleGuestFileChange}
                  accept={ACCEPTED_FILE_TYPES}
                  className="bg-input border-input focus:border-primary"
                  disabled={isUploadingGuestFile}
                />
                {selectedGuestFile && <p className="text-xs text-muted-foreground mt-1">Selected: {selectedGuestFile.name} ({formatFileSize(selectedGuestFile.size)})</p>}
              </div>
              {isUploadingGuestFile && (
                <div className="space-y-1">
                  <Progress value={guestUploadProgress} className="w-full" />
                  <p className="text-xs text-muted-foreground text-center">{Math.round(guestUploadProgress)}%</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isUploadingGuestFile || !selectedGuestFile || !guestPhoneNumber.trim()}>
                {isUploadingGuestFile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isUploadingGuestFile ? 'Uploading for Guest...' : 'Upload for Guest'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card className="lg:col-span-1 border-border shadow-lg"> {/* Upload General File */}
          <CardHeader>
            <CardTitle className="text-xl text-primary flex items-center gap-2"><UploadCloud className="h-6 w-6" /> Upload General File</CardTitle>
            <CardDescription>Upload an image or PDF to be shared with all users.</CardDescription>
          </CardHeader>
          <form onSubmit={handleFileUpload}>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file-upload-input" className="text-foreground">Choose File</Label>
                <Input
                  id="file-upload-input"
                  type="file"
                  onChange={handleFileChange}
                  accept={ACCEPTED_FILE_TYPES}
                  className="bg-input border-input focus:border-primary"
                  disabled={isUploading}
                />
                {selectedFile && <p className="text-xs text-muted-foreground mt-1">Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})</p>}
              </div>
              {isUploading && (
                <div className="space-y-1">
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-xs text-muted-foreground text-center">{Math.round(uploadProgress)}%</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isUploading || !selectedFile}>
                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isUploading ? 'Uploading...' : 'Upload General File'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
      
      {/* Table for general uploaded files, taking full width below the two cards */}
      <div className="mt-8">
        {isLoadingFiles && (
          <div className="flex flex-col items-center justify-center min-h-[30vh] bg-card border border-border rounded-xl shadow-lg p-6">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
            <p className="text-muted-foreground">Loading general uploaded files...</p>
          </div>
        )}
        {errorFiles && !isLoadingFiles && (
          <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md flex items-center gap-3">
            <AlertTriangle className="h-6 w-6" />
            <div><h3 className="font-semibold">Error Loading General Files</h3><p>{errorFiles}</p></div>
          </div>
        )}
        {!isLoadingFiles && !errorFiles && (
          <Card className="border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-primary">Uploaded General Files</CardTitle>
               <CardDescription>Files shared with all users.</CardDescription>
            </CardHeader>
            <CardContent>
              {uploadedFiles.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Uploaded At</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uploadedFiles.map((file) => (
                      <TableRow key={file.id} className="hover:bg-muted/10">
                        <TableCell className="font-medium text-foreground truncate max-w-xs" title={file.fileName}>{file.fileName}</TableCell>
                        <TableCell className="text-muted-foreground">{file.contentType}</TableCell>
                        <TableCell className="text-muted-foreground">{formatFileSize(file.size)}</TableCell>
                        <TableCell className="text-muted-foreground">{new Date(file.uploadedAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-center space-x-1">
                          <Button variant="outline" size="icon" onClick={() => window.open(file.downloadURL, '_blank')} title="Download/View File"><Download className="h-4 w-4 text-accent" /></Button>
                          <Button variant="outline" size="icon" onClick={() => handleCopyLink(file.downloadURL)} title="Copy Download Link"><Copy className="h-4 w-4 text-blue-500" /></Button>
                          <Button variant="outline" size="icon" onClick={() => handleDeleteFile(file)} title="Delete File"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-6">No general files uploaded yet.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </MainAppLayout>
  );
}
    
