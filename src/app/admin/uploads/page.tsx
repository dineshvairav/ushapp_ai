
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
import { ArrowLeft, UploadCloud, FileIcon, Trash2, Loader2, AlertTriangle, Download, Copy } from 'lucide-react'; // Added Copy icon
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

export default function FileUploadPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

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

    const storage = getStorage(firebaseApp, TARGET_STORAGE_BUCKET);
    const filePath = `adminUploads/${new Date().getTime()}-${selectedFile.name}`;
    const fileStorageRef = storageRefStandard(storage, filePath);

    console.log('Attempting to upload file:', selectedFile.name, 'Type:', selectedFile.type, 'Size:', selectedFile.size);
    console.log('Target Storage Path:', fileStorageRef.toString());

    const metadata = {
      contentType: selectedFile.type || 'application/octet-stream'
    };

    const uploadTask = uploadBytesResumable(fileStorageRef, selectedFile, metadata);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Upload error:", error);
        let detailedErrorMessage = `Upload failed: ${error.code} - ${error.message}.`;
        if (error.code === 'storage/unauthorized') {
          detailedErrorMessage += " Please check Firebase Storage security rules for write access to this path.";
        } else if (error.code === 'storage/object-not-found' || error.code === 'storage/bucket-not-found') {
          detailedErrorMessage += " Please ensure the storage bucket is correctly configured and accessible.";
        }
        toast({ variant: "destructive", title: "Upload Failed", description: detailedErrorMessage, duration: 7000 });
        setIsUploading(false);
        setUploadProgress(0);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
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

          toast({ title: "Upload Successful", description: `${selectedFile.name} has been uploaded.` });
          setSelectedFile(null);
        } catch (dbError) {
            console.error("Error saving file metadata to RTDB:", dbError);
            toast({ variant: "destructive", title: "Database Error", description: "Could not save file metadata after upload." });
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            const fileInput = document.getElementById('file-upload-input') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
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
      let storagePath = '';
      try {
        const url = new URL(file.downloadURL);
        const pathSegments = url.pathname.split('/o/');
        if (pathSegments.length > 1) {
          storagePath = decodeURIComponent(pathSegments[1].split('?')[0]); // Also remove query params like ?alt=media&token=...
        } else {
          throw new Error("Cannot determine storage path from download URL for deletion.");
        }
      } catch(urlParseError) {
         console.error("Could not parse download URL to derive storage path:", file.downloadURL, urlParseError);
         throw new Error("Could not determine file path in storage for deletion. URL format might be unexpected.");
      }

      if (!storagePath) {
        throw new Error("Storage path for deletion is empty.");
      }
      
      const fileToDeleteStorageRef = storageRefStandard(storage, storagePath);
      await deleteObject(fileToDeleteStorageRef);
      await remove(databaseRef(rtdb, `adminUploadedFiles/${file.id}`));
      toast({ title: "File Deleted", description: `${file.fileName} has been deleted.` });
    } catch (error: any) {
      console.error("Error deleting file:", error);
      let detailedErrorMessage = `Could not delete ${file.fileName}.`;
      if (error.code === 'storage/object-not-found') {
          detailedErrorMessage += " The file was not found in storage (it might have been already deleted). Proceeding to remove from list.";
          try {
            await remove(databaseRef(rtdb, `adminUploadedFiles/${file.id}`));
            toast({ title: "File Removed from List", description: `${file.fileName} was not found in storage but removed from database list.` });
            return;
          } catch (rtdbDeleteError) {
            console.error("Error removing file from RTDB after storage/object-not-found:", rtdbDeleteError);
            detailedErrorMessage += " Also failed to remove from database list.";
          }
      } else if (error.message) {
        detailedErrorMessage = error.message;
      }
      toast({ variant: "destructive", title: "Deletion Failed", description: detailedErrorMessage, duration: 7000 });
    }
  };

  const handleCopyLink = (downloadURL: string) => {
    navigator.clipboard.writeText(downloadURL)
      .then(() => {
        toast({ title: "Link Copied", description: "Download link copied to clipboard." });
      })
      .catch(err => {
        console.error("Failed to copy link: ", err);
        toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy link to clipboard." });
      });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        <UploadCloud className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            File Upload Management
          </h1>
          <p className="text-lg text-muted-foreground">
            Upload images or PDF documents. (e.g., invoices, guides).
          </p>
        </div>
      </div>
      
      <Card className="mb-8 border-destructive/30 bg-destructive/5">
        <CardHeader className="flex flex-row items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive mt-1" />
          <div>
            <CardTitle className="text-destructive/90 text-lg">Security & Storage Note</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-destructive/80 space-y-1 pl-12">
            <p>Uploaded files are stored in Firebase Storage (Bucket: <strong>{TARGET_STORAGE_BUCKET}</strong>) and metadata in Realtime Database. Ensure your Firebase Security Rules are configured appropriately:</p>
            <ul className="list-disc list-inside pl-4">
                <li><strong>Storage Rules:</strong> Restrict write access to the `adminUploads/` path to authenticated admins. Configure read access as needed (currently public).</li>
                <li><strong>RTDB Rules:</strong> Restrict write access to `adminUploadedFiles` path to admins. Configure read access for users (currently public).</li>
            </ul>
            <p className="mt-2">This page uses client-side admin checks. For production, robust server-side validation and custom claims are recommended for admin access.</p>
        </CardContent>
      </Card>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 border-border shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-primary flex items-center gap-2">
              <UploadCloud className="h-6 w-6" /> Upload New File
            </CardTitle>
            <CardDescription>Select an image or PDF to upload.</CardDescription>
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
                {isUploading ? 'Uploading...' : 'Upload File'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="lg:col-span-2">
          {isLoadingFiles && (
            <div className="flex flex-col items-center justify-center min-h-[30vh] bg-card border border-border rounded-xl shadow-lg p-6">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
              <p className="text-muted-foreground">Loading uploaded files...</p>
            </div>
          )}
          {errorFiles && !isLoadingFiles && (
            <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md flex items-center gap-3">
              <AlertTriangle className="h-6 w-6" />
              <div>
                <h3 className="font-semibold">Error Loading Files</h3>
                <p>{errorFiles}</p>
              </div>
            </div>
          )}
          {!isLoadingFiles && !errorFiles && (
            <Card className="border-border shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-primary">Uploaded Files</CardTitle>
                 <CardDescription>
                  Files currently stored and available for users.
                </CardDescription>
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
                          <TableCell className="text-muted-foreground">{formatFileSize(file.size}</TableCell>
                          <TableCell className="text-muted-foreground">{new Date(file.uploadedAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-center space-x-1">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => window.open(file.downloadURL, '_blank')}
                              title="Download/View File"
                            >
                              <Download className="h-4 w-4 text-accent" />
                            </Button>
                             <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleCopyLink(file.downloadURL)}
                              title="Copy Download Link"
                            >
                              <Copy className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteFile(file)}
                              title="Delete File"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-6">No files uploaded yet.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainAppLayout>
  );
}
    

    