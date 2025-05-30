
"use client";

import { MainAppLayout } from '@/components/layout/MainAppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Edit3, LogOut, FileText, ImageIcon, Download } from 'lucide-react';

// Mock data for admin uploaded files
const adminFiles = [
  { id: 'file1', name: 'Product Catalog Q3 2024.pdf', type: 'pdf', size: '2.5MB', date: '2024-07-15' },
  { id: 'file2', name: 'Summer Collection Lookbook.jpg', type: 'image', size: '5.1MB', date: '2024-07-10' },
  { id: 'file3', name: 'Return Policy.pdf', type: 'pdf', size: '300KB', date: '2024-06-01' },
];

export default function ProfilePage() {
  // Placeholder user data
  const user = {
    name: 'Alex Doe',
    email: 'alex.doe@example.com',
    avatarUrl: 'https://placehold.co/200x200.png', // Placeholder avatar
    joinDate: 'January 15, 2023',
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === 'pdf') return <FileText className="h-6 w-6 text-primary" />;
    if (fileType === 'image') return <ImageIcon className="h-6 w-6 text-accent" />;
    return <FileText className="h-6 w-6 text-muted-foreground" />;
  };

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
          <Button variant="outline" className="shrink-0">
            <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Information Card */}
          <Card className="lg:col-span-1 bg-card border-border">
            <CardHeader className="items-center text-center">
              <Avatar className="h-24 w-24 mb-4 ring-2 ring-primary ring-offset-2 ring-offset-card">
                <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="profile avatar" />
                <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl">{user.name}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Joined on {user.joinDate}</span>
              </div>
              <Separator />
              <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive/80 hover:bg-destructive/10">
                <LogOut className="mr-2 h-4 w-4" /> Log Out
              </Button>
            </CardContent>
          </Card>

          {/* Admin Uploaded Files Card */}
          <Card className="lg:col-span-2 bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl">Admin Uploaded Files</CardTitle>
              <CardDescription>
                Important documents and images shared by the StaticShop team.
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

        {/* Placeholder for other sections like Order History or My Activity */}
        <Card className="bg-card border-border">
            <CardHeader>
                <CardTitle className="text-xl">Order History</CardTitle>
                <CardDescription>View your past orders and their status.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-center py-6">No orders placed yet.</p>
                {/* In a real app, this would be a list of orders */}
            </CardContent>
        </Card>

      </div>
    </MainAppLayout>
  );
}
