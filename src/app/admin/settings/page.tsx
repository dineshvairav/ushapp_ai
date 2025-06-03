
"use client";

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MainAppLayout } from '@/components/layout/MainAppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Settings, Save, Loader2, AlertTriangle } from 'lucide-react';
import { rtdb, auth } from '@/lib/firebase';
import { ref, onValue, set } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";

const ADMIN_EMAIL = 'dineshvairav@gmail.com';

export interface AppSettings {
  currencySymbol: string;
  maintenanceMode: boolean;
  promoBannerEnabled: boolean;
  promoBannerText: string;
  promoBannerLink: string;
}

const defaultAppSettings: AppSettings = {
  currencySymbol: '₹',
  maintenanceMode: false,
  promoBannerEnabled: false,
  promoBannerText: '',
  promoBannerLink: '',
};

export default function AppSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [settings, setSettings] = useState<AppSettings>(defaultAppSettings);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [errorSettings, setErrorSettings] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
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

    const settingsRef = ref(rtdb, 'appSettings');
    const unsubscribeSettings = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSettings({ ...defaultAppSettings, ...data });
      } else {
        setSettings(defaultAppSettings);
      }
      setErrorSettings(null);
      setIsLoadingSettings(false);
    }, (err) => {
      console.error("Firebase RTDB read error (appSettings):", err);
      setErrorSettings("Failed to load app settings. Please try again.");
      setIsLoadingSettings(false);
      toast({
        variant: "destructive",
        title: "Database Error",
        description: "Could not fetch app settings.",
      });
    });

    return () => unsubscribeSettings();
  }, [toast, isAuthorized, isAdminLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: keyof AppSettings, checked: boolean) => {
    setSettings(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await set(ref(rtdb, 'appSettings'), settings);
      toast({
        title: "Settings Saved",
        description: "Application settings have been successfully updated.",
      });
    } catch (error) {
      console.error("Error saving app settings to RTDB:", error);
      toast({ variant: "destructive", title: "Save Error", description: "Could not save app settings." });
    } finally {
      setIsSavingSettings(false);
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
        <Settings className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Application Settings
          </h1>
          <p className="text-lg text-muted-foreground">
            Configure global settings for your application.
          </p>
        </div>
      </div>

      {isLoadingSettings && (
        <div className="flex flex-col items-center justify-center min-h-[30vh] bg-card border border-border rounded-xl shadow-lg p-6">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      )}

      {errorSettings && !isLoadingSettings && (
        <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md flex items-center gap-3 mb-6">
          <AlertTriangle className="h-6 w-6" />
          <div>
            <h3 className="font-semibold">Error Loading Settings</h3>
            <p>{errorSettings}</p>
          </div>
        </div>
      )}

      {!isLoadingSettings && !errorSettings && (
        <form onSubmit={handleSubmit}>
          <Card className="border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-primary">General Settings</CardTitle>
              <CardDescription>Manage core application configurations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currencySymbol" className="text-foreground">Currency Symbol</Label>
                <Input
                  id="currencySymbol"
                  name="currencySymbol"
                  value={settings.currencySymbol}
                  onChange={handleInputChange}
                  placeholder="e.g., $, €, ₹"
                  className="bg-input border-input focus:border-primary max-w-xs"
                  disabled={isSavingSettings}
                />
                <p className="text-xs text-muted-foreground">Symbol used for displaying prices (e.g., ₹, $, €).</p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="maintenanceMode" className="text-foreground">Maintenance Mode</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="maintenanceMode"
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => handleSwitchChange('maintenanceMode', checked)}
                    disabled={isSavingSettings}
                  />
                  <span className="text-sm text-muted-foreground">
                    {settings.maintenanceMode ? "Shop is currently in maintenance mode" : "Shop is live"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">If enabled, users will see a maintenance page instead of the shop.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-8 border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-primary">Promotional Banner</CardTitle>
              <CardDescription>Manage the site-wide promotional banner.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="space-y-3">
                <Label htmlFor="promoBannerEnabled" className="text-foreground">Enable Promotion Banner</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="promoBannerEnabled"
                    checked={settings.promoBannerEnabled}
                    onCheckedChange={(checked) => handleSwitchChange('promoBannerEnabled', checked)}
                    disabled={isSavingSettings}
                  />
                  <span className="text-sm text-muted-foreground">
                    {settings.promoBannerEnabled ? "Banner is active" : "Banner is inactive"}
                  </span>
                </div>
              </div>

              {settings.promoBannerEnabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="promoBannerText" className="text-foreground">Banner Text</Label>
                    <Input
                      id="promoBannerText"
                      name="promoBannerText"
                      value={settings.promoBannerText}
                      onChange={handleInputChange}
                      placeholder="e.g., Free shipping on orders over $50!"
                      className="bg-input border-input focus:border-primary"
                      disabled={isSavingSettings}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="promoBannerLink" className="text-foreground">Banner Link (Optional)</Label>
                    <Input
                      id="promoBannerLink"
                      name="promoBannerLink"
                      type="url"
                      value={settings.promoBannerLink}
                      onChange={handleInputChange}
                      placeholder="e.g., /deals or https://example.com/sale"
                      className="bg-input border-input focus:border-primary"
                      disabled={isSavingSettings}
                    />
                  </div>
                </>
              )}
            </CardContent>
             <CardFooter>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSavingSettings || isLoadingSettings}>
                {isSavingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" /> Save All Settings
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}
    </MainAppLayout>
  );
}

