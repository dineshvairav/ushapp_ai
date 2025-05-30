
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
import { Smartphone } from 'lucide-react';

interface GuestLoginSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function GuestLoginSheet({ isOpen, onOpenChange }: GuestLoginSheetProps) {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = React.useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Basic validation (optional, enhance as needed)
    if (phoneNumber.trim() === '') {
      // Simple alert, consider using a toast for better UX
      alert('Please enter a phone number.');
      return;
    }
    // In a real app, you would validate the phone number and send an OTP or similar
    console.log('Guest login with phone:', phoneNumber);
    router.push('/shop');
    onOpenChange(false); // Close the sheet
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-auto sm:max-w-md mx-auto rounded-t-xl p-6 bg-card border-border"
        onOpenAutoFocus={(e) => e.preventDefault()} // Prevents auto-focus on first input which can be jarring
      >
        <SheetHeader className="mb-6 text-center">
          <SheetTitle className="text-xl font-semibold text-primary">Login as Guest</SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Enter your phone number to continue.
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
              />
            </div>
          </div>
          <SheetFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-2">
             <SheetClose asChild>
                <Button type="button" variant="outline" className="w-full sm:w-auto">
                  Cancel
                </Button>
              </SheetClose>
            <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
              Continue
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

    