
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AtSign, KeyRound, User as UserIconLucide, LogIn, UserPlus, Loader2 } from 'lucide-react'; // Renamed User to UserIconLucide to avoid conflict
import { auth } from '@/lib/firebase'; // Use the imported auth instance
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  type User // Imported User type
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

// Simple Google Icon SVG
const GoogleIcon = () => (
  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    <path d="M1 1h22v22H1z" fill="none"/>
  </svg>
);

// IMPORTANT: For a real app, use Firebase Custom Claims for robust role-based access control.
// Checking email is not secure for production admin access.
const ADMIN_EMAIL = 'dineshvairav@gmail.com'; // Ensure this matches the email in admin/page.tsx


interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onGuestLoginClick?: () => void;
}

export function AuthModal({ isOpen, onOpenChange, onGuestLoginClick }: AuthModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("signin");

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);

  const handleAuthSuccess = (loggedInUser: User | null, message: string = "Successfully authenticated!") => {
    toast({ title: "Success", description: message });
    onOpenChange(false);
    if (loggedInUser && loggedInUser.email === ADMIN_EMAIL) {
      router.push('/admin');
    } else {
      router.push('/shop');
    }
  };

  const handleAuthError = (error: any, defaultMessage: string = "An error occurred.") => {
    console.error("Firebase Auth Error:", error);
    let errorMessage = defaultMessage;
    if (error.code) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email address is already in use.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters.';
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential': // Added this case
          errorMessage = 'Invalid email or password.';
          break;
        case 'auth/popup-closed-by-user':
          errorMessage = 'Google Sign-In was closed before completion.';
          break;
        default:
          errorMessage = error.message || defaultMessage;
      }
    }
    toast({ variant: "destructive", title: "Authentication Error", description: errorMessage });
  };

  const handleEmailSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoadingEmail(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (name.trim() !== '' && userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name });
         // Re-fetch the user to ensure displayName is fresh if needed, or trust it's updated for the redirect logic
        const updatedUser = auth.currentUser; // Or userCredential.user which should be up-to-date
        handleAuthSuccess(updatedUser, "Account created successfully!");
      } else {
        handleAuthSuccess(userCredential.user, "Account created successfully!");
      }
    } catch (error) {
      handleAuthError(error, "Could not create account.");
    } finally {
      setIsLoadingEmail(false);
      setEmail('');
      setPassword('');
      setName('');
    }
  };

  const handleEmailSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoadingEmail(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      handleAuthSuccess(userCredential.user, "Signed in successfully!");
    } catch (error) {
      handleAuthError(error, "Could not sign in.");
    } finally {
      setIsLoadingEmail(false);
      setEmail('');
      setPassword('');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoadingGoogle(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      handleAuthSuccess(result.user, "Signed in with Google successfully!");
    } catch (error) {
      handleAuthError(error, "Could not sign in with Google.");
    } finally {
      setIsLoadingGoogle(false);
    }
  };


  const handleGuestLogin = () => {
    onOpenChange(false);
    if (onGuestLoginClick) {
      onGuestLoginClick();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) { // Reset fields when modal closes
        setEmail('');
        setPassword('');
        setName('');
        setIsLoadingEmail(false);
        setIsLoadingGoogle(false);
      }
    }}>
      <DialogContent className="sm:max-w-[480px] bg-card border-border p-8 rounded-xl shadow-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-semibold text-center text-primary">
            {activeTab === "signin" ? "Welcome Back!" : "Create Account"}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            {activeTab === "signin" ? "Sign in to continue your shopping journey." : "Join ushªOªpp to discover amazing products."}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="signin" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-secondary/50">
            <TabsTrigger value="signin" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <LogIn className="mr-2 h-4 w-4" /> Sign In
            </TabsTrigger>
            <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <UserPlus className="mr-2 h-4 w-4" /> Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleEmailSignIn} className="space-y-6">
              <Button
                variant="outline"
                className="w-full border-input hover:bg-accent/10"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoadingGoogle || isLoadingEmail}
              >
                {isLoadingGoogle ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                Sign in with Google
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-signin" className="text-muted-foreground">Email</Label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email-signin"
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoadingEmail || isLoadingGoogle}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-signin" className="text-muted-foreground">Password</Label>
                 <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password-signin"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoadingEmail || isLoadingGoogle}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoadingEmail || isLoadingGoogle}>
                {isLoadingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Sign In
              </Button>
              <Button
                type="button"
                variant="link"
                onClick={handleGuestLogin}
                className="w-full text-accent hover:text-accent/80"
                disabled={isLoadingEmail || isLoadingGoogle}
              >
                Login as Guest (Phone No.)
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleEmailSignUp} className="space-y-6">
               <div className="space-y-2">
                <Label htmlFor="name-signup" className="text-muted-foreground">Full Name</Label>
                <div className="relative">
                    <UserIconLucide className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name-signup"
                      placeholder="Your Name"
                      required
                      className="pl-10"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isLoadingEmail || isLoadingGoogle}
                    />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-signup" className="text-muted-foreground">Email</Label>
                 <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email-signup"
                      type="email"
                      placeholder="you@example.com"
                      required
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoadingEmail || isLoadingGoogle}
                    />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-signup" className="text-muted-foreground">Password</Label>
                <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password-signup"
                      type="password"
                      placeholder="Create a strong password"
                      required
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoadingEmail || isLoadingGoogle}
                    />
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoadingEmail || isLoadingGoogle}>
                {isLoadingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Account
              </Button>
               {/* Google Sign-In button could also be added here for sign-up if desired */}
            </form>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <p className="text-xs text-muted-foreground text-center w-full">
            By continuing, you agree to ushªOªpp's Terms of Service and Privacy Policy.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
