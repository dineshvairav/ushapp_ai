
"use client";

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MainAppLayout } from '@/components/layout/MainAppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { FAQ } from '@/data/contentTypes';
import { ArrowLeft, PlusCircle, Trash2, Loader2, AlertTriangle, MessageSquare } from 'lucide-react';
import { rtdb, auth, firestore } from '@/lib/firebase'; // Added firestore
import { ref, onValue, push, set, remove, update } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore"; // Added firestore imports

// const ADMIN_EMAIL = 'dineshvairav@gmail.com'; // No longer primary check

export default function FaqManagementPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoadingFaqs, setIsLoadingFaqs] = useState(true);
  const [errorFaqs, setErrorFaqs] = useState<string | null>(null);

  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newIsActive, setNewIsActive] = useState(true);
  const [isAddingFaq, setIsAddingFaq] = useState(false);

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

    const faqsRef = ref(rtdb, 'content/faqs');
    const unsubscribeFaqs = onValue(faqsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const faqList: FAQ[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setFaqs(faqList);
        setErrorFaqs(null);
      } else {
        setFaqs([]);
      }
      setIsLoadingFaqs(false);
    }, (err) => {
      console.error("Firebase RTDB read error (faqs):", err);
      setErrorFaqs("Failed to load FAQs. Please try again.");
      setIsLoadingFaqs(false);
      toast({ variant: "destructive", title: "Database Error", description: "Could not fetch FAQs." });
    });

    return () => unsubscribeFaqs();
  }, [toast, isAuthorized, isAdminLoading]);

  const handleAddFaq = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Question and Answer cannot be empty." });
      return;
    }
    setIsAddingFaq(true);

    const newFaqRef = push(ref(rtdb, 'content/faqs'));
    const newFaqId = newFaqRef.key;

    if (!newFaqId) {
      toast({ variant: "destructive", title: "Error", description: "Could not generate FAQ ID." });
      setIsAddingFaq(false);
      return;
    }

    const newFaqData: Omit<FAQ, 'id'> = {
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
      isActive: newIsActive,
    };

    try {
      await set(newFaqRef, newFaqData);
      toast({ title: "FAQ Added", description: "New FAQ has been successfully added." });
      setNewQuestion('');
      setNewAnswer('');
      setNewIsActive(true);
    } catch (error) {
      console.error("Error adding FAQ to RTDB:", error);
      toast({ variant: "destructive", title: "Database Error", description: "Could not save FAQ." });
    } finally {
      setIsAddingFaq(false);
    }
  };

  const handleDeleteFaq = async (faqId: string, question: string) => {
    if (window.confirm(`Are you sure you want to delete the FAQ: "${question}"?`)) {
      try {
        await remove(ref(rtdb, `content/faqs/${faqId}`));
        toast({ title: "FAQ Deleted", description: "FAQ has been successfully deleted." });
      } catch (err) {
        console.error("Error deleting FAQ:", err);
        toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete FAQ." });
      }
    }
  };

  const handleToggleActive = async (faqId: string, currentStatus: boolean) => {
    try {
      await update(ref(rtdb, `content/faqs/${faqId}`), { isActive: !currentStatus });
      toast({ title: "Status Updated", description: `FAQ status changed to ${!currentStatus ? 'active' : 'inactive'}.` });
    } catch (error) {
      console.error("Error updating FAQ status:", error);
      toast({ variant: "destructive", title: "Update Failed", description: "Could not update FAQ status." });
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
          <Link href="/admin/content">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Content Management
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            FAQ Management
          </h1>
          <p className="text-lg text-muted-foreground">
            Add, view, or remove Frequently Asked Questions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 border-border shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-primary flex items-center gap-2">
              <PlusCircle className="h-6 w-6" /> Add New FAQ
            </CardTitle>
            <CardDescription>Create a new question and answer.</CardDescription>
          </CardHeader>
          <form onSubmit={handleAddFaq}>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="faq-question" className="text-foreground">Question</Label>
                <Textarea
                  id="faq-question"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="e.g., How do I reset my password?"
                  required
                  rows={3}
                  className="bg-input border-input focus:border-primary"
                  disabled={isAddingFaq}
                />
              </div>
              <div>
                <Label htmlFor="faq-answer" className="text-foreground">Answer</Label>
                <Textarea
                  id="faq-answer"
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="Provide a clear and concise answer."
                  required
                  rows={5}
                  className="bg-input border-input focus:border-primary"
                  disabled={isAddingFaq}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                    id="faq-is-active"
                    checked={newIsActive}
                    onCheckedChange={setNewIsActive}
                    disabled={isAddingFaq}
                />
                <Label htmlFor="faq-is-active" className="text-foreground">Active (Visible on public FAQ page)</Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isAddingFaq}>
                {isAddingFaq && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add FAQ
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="lg:col-span-2">
          {isLoadingFaqs && (
            <div className="flex flex-col items-center justify-center min-h-[30vh] bg-card border border-border rounded-xl shadow-lg p-6">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
              <p className="text-muted-foreground">Loading FAQs...</p>
            </div>
          )}
          {errorFaqs && !isLoadingFaqs && (
            <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md flex items-center gap-3">
              <AlertTriangle className="h-6 w-6" />
              <div><h3 className="font-semibold">Error Loading FAQs</h3><p>{errorFaqs}</p></div>
            </div>
          )}
          {!isLoadingFaqs && !errorFaqs && (
            <Card className="border-border shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-primary">Existing FAQs</CardTitle>
                <CardDescription>FAQs currently stored in the database.</CardDescription>
              </CardHeader>
              <CardContent>
                {faqs.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Question</TableHead>
                        <TableHead className="text-center">Active</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {faqs.map((faq) => (
                        <TableRow key={faq.id} className="hover:bg-muted/10">
                          <TableCell className="font-medium text-foreground max-w-md truncate">{faq.question}</TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={faq.isActive}
                              onCheckedChange={() => handleToggleActive(faq.id, faq.isActive)}
                              aria-label={faq.isActive ? "Deactivate FAQ" : "Activate FAQ"}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteFaq(faq.id, faq.question)}
                              title="Delete FAQ"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-6">No FAQs found. Add one using the form.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainAppLayout>
  );
}
    
