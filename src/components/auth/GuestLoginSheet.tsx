
"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Smartphone, Loader2 } from 'lucide-react'; // Added Loader2
import { useToast } from '@/hooks/use-toast'; // Added useToast

interface GuestLoginSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function GuestLoginSheet({ isOpen, onOpenChange }: GuestLoginSheetProps) {
  const router = useRouter();
  const { toast } = useToast(); // Initialize toast
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false); // Added loading state

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsProcessing(true);

    // Basic validation
    const sanitizedPhoneNumber = phoneNumber.replace(/\D/g, '');
    if (sanitizedPhoneNumber.length < 10) {
      toast({
        variant: "destructive",
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number (at least 10 digits).",
      });
      setIsProcessing(false);
      return;
    }

    // In a real app, you would validate the phone number and send an OTP or similar.
    // For this demo, we'll simulate a short delay and store the number.
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 750)); 
      
      localStorage.setItem('guestPhoneNumber', sanitizedPhoneNumber);
      console.log('Guest "logged in" with phone:', sanitizedPhoneNumber);
      
      toast({
        title: "Guest Access Activated",
        description: "You can now view documents shared with this phone number on your profile.",
      });
      
      router.push('/profile'); // Redirect to profile to see shared docs
      onOpenChange(false); // Close the sheet
    } catch (error) {
      console.error("Guest login simulation error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not activate guest access. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => {
      if (!open) setPhoneNumber(''); // Clear phone number when sheet closes
      onOpenChange(open);
    }}>
      <SheetContent 
        side="bottom" 
        className="h-auto sm:max-w-md mx-auto rounded-t-xl p-6 bg-card border-border"
        onOpenAutoFocus={(e) => e.preventDefault()} 
      >
        <SheetHeader className="mb-6 text-center">
          <SheetTitle className="text-xl font-semibold text-primary">Guest Access</SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Enter your phone number to view specially shared documents. No account needed.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="phone-guest" className="text-muted-foreground">Phone Number</Label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone-guest"
                type="tel"
                placeholder="Your phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="pl-10 bg-background border-input focus:border-primary"
                disabled={isProcessing}
              />
            </div>
          </div>
          <SheetFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-2">
             <SheetClose asChild>
                <Button type="button" variant="outline" className="w-full sm:w-auto" disabled={isProcessing}>
                  Cancel
                </Button>
              </SheetClose>
            <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isProcessing ? "Processing..." : "Continue as Guest"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
