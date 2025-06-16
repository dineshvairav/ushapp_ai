
"use client";

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MainAppLayout } from '@/components/layout/MainAppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Category } from '@/data/categories';
import { ArrowLeft, ListTree, PlusCircle, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { rtdb, auth, firestore } from '@/lib/firebase'; // Added firestore
import { ref, onValue, push, set, remove } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore"; // Added firestore imports

// const ADMIN_EMAIL = 'dineshvairav@gmail.com'; // No longer primary check

export default function CategoryManagementPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [errorCategories, setErrorCategories] = useState<string | null>(null);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newCategoryIconName, setNewCategoryIconName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
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
          setIsAuthorized(false);
          router.replace('/');
        }
      } else {
        setIsAuthorized(false);
        router.replace('/onboarding');
      }
      setIsAdminLoading(false);
    });
    return () => unsubscribeAuth();
  }, [router]);

  useEffect(() => {
    if (!isAuthorized || isAdminLoading) return; 

    const categoriesRef = ref(rtdb, 'categories');
    const unsubscribeCategories = onValue(categoriesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const categoryList: Category[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setCategories(categoryList);
        setErrorCategories(null);
      } else {
        setCategories([]);
      }
      setIsLoadingCategories(false);
    }, (err) => {
      console.error("Firebase RTDB read error (categories):", err);
      setErrorCategories("Failed to load categories. Please try again.");
      setIsLoadingCategories(false);
      toast({
        variant: "destructive",
        title: "Database Error",
        description: "Could not fetch categories.",
      });
    });

    return () => unsubscribeCategories();
  }, [toast, isAuthorized, isAdminLoading]);

  const handleAddCategory = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Category name cannot be empty." });
      return;
    }
    setIsAddingCategory(true);

    const newCategoryRef = push(ref(rtdb, 'categories'));
    const newCategoryId = newCategoryRef.key;

    if (!newCategoryId) {
      toast({ variant: "destructive", title: "Error", description: "Could not generate category ID." });
      setIsAddingCategory(false);
      return;
    }

    const newCategoryData: Omit<Category, 'id'> = {
      name: newCategoryName.trim(),
      description: newCategoryDescription.trim() || undefined,
      iconName: newCategoryIconName.trim() || undefined,
    };

    try {
      await set(newCategoryRef, newCategoryData);
      toast({
        title: "Category Added",
        description: `"${newCategoryName}" has been successfully added.`,
      });
      setNewCategoryName('');
      setNewCategoryDescription('');
      setNewCategoryIconName('');
    } catch (error) {
      console.error("Error adding category to RTDB:", error);
      toast({ variant: "destructive", title: "Database Error", description: "Could not save category." });
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (window.confirm(`Are you sure you want to delete category "${categoryName}"? This action cannot be undone.`)) {
      try {
        await remove(ref(rtdb, `categories/${categoryId}`));
        toast({
          title: "Category Deleted",
          description: `"${categoryName}" has been successfully deleted.`,
        });
      } catch (err) {
        console.error("Error deleting category:", err);
        toast({ variant: "destructive", title: "Deletion Failed", description: `Could not delete "${categoryName}".` });
      }
    }
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
        <ListTree className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Category Management
          </h1>
          <p className="text-lg text-muted-foreground">
            Add, view, or remove product categories from Firebase RTDB.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 border-border shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-primary flex items-center gap-2">
              <PlusCircle className="h-6 w-6" /> Add New Category
            </CardTitle>
            <CardDescription>Create a new category for your products.</CardDescription>
          </CardHeader>
          <form onSubmit={handleAddCategory}>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="category-name" className="text-foreground">Category Name</Label>
                <Input
                  id="category-name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Electronics"
                  required
                  className="bg-input border-input focus:border-primary"
                  disabled={isAddingCategory}
                />
              </div>
              <div>
                <Label htmlFor="category-description" className="text-foreground">Description (Optional)</Label>
                <Textarea
                  id="category-description"
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  placeholder="Briefly describe the category"
                  rows={3}
                  className="bg-input border-input focus:border-primary"
                  disabled={isAddingCategory}
                />
              </div>
              <div>
                <Label htmlFor="category-icon" className="text-foreground">Lucide Icon Name (Optional)</Label>
                <Input
                  id="category-icon"
                  value={newCategoryIconName}
                  onChange={(e) => setNewCategoryIconName(e.target.value)}
                  placeholder="e.g., Laptop, Shirt, Home"
                  className="bg-input border-input focus:border-primary"
                  disabled={isAddingCategory}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter a valid name from <Link href="https://lucide.dev/icons/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">lucide.dev/icons</Link>.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isAddingCategory}>
                {isAddingCategory && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Category
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="lg:col-span-2">
          {isLoadingCategories && (
            <div className="flex flex-col items-center justify-center min-h-[30vh] bg-card border border-border rounded-xl shadow-lg p-6">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
              <p className="text-muted-foreground">Loading categories...</p>
            </div>
          )}
          {errorCategories && !isLoadingCategories && (
            <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md flex items-center gap-3">
              <AlertTriangle className="h-6 w-6" />
              <div>
                <h3 className="font-semibold">Error Loading Categories</h3>
                <p>{errorCategories}</p>
              </div>
            </div>
          )}
          {!isLoadingCategories && !errorCategories && (
            <Card className="border-border shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-primary">Existing Categories</CardTitle>
                 <CardDescription>
                  Categories currently stored in the database.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categories.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Icon Name</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((category) => (
                        <TableRow key={category.id} className="hover:bg-muted/10">
                          <TableCell className="font-medium text-foreground">{category.name}</TableCell>
                          <TableCell className="text-muted-foreground truncate max-w-xs">{category.description || 'N/A'}</TableCell>
                          <TableCell className="text-muted-foreground">{category.iconName || 'N/A'}</TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteCategory(category.id, category.name)}
                              title="Delete Category"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-6">No categories found. Add one using the form.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainAppLayout>
  );
}
