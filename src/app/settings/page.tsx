
'use client';

import { useState, useEffect, memo } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Moon, Sun, Trash2, Download, RefreshCw, EyeOff, Loader2, Contrast, Type, Sparkles, Languages, Share, Star } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useTheme } from 'next-themes';
import { useRecipientContext } from '@/context/RecipientContext';
import { useToast } from '@/hooks/use-toast';
import { getMessagesForUser, deleteUserAndData } from '@/lib/data';
import { useUser } from '@/firebase';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAccessibility } from '@/context/AccessibilityContext';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const SettingsPageContent = memo(function SettingsPageContent() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { clearCache } = useRecipientContext();
  const { toast } = useToast();
  const { user } = useUser();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const {
    reduceMotion,
    toggleReduceMotion,
    highContrast,
    toggleHighContrast,
    fontSizeLevel,
    setFontSizeLevel,
    dyslexiaFont,
    toggleDyslexiaFont,
    showImageDescriptions,
    toggleShowImageDescriptions,
    resetAccessibilitySettings,
  } = useAccessibility();


  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClearCache = () => {
    clearCache();
    toast({
        title: "Cache Cleared",
        description: "The local data cache has been cleared.",
    });
  }

  const handleExportData = async () => {
    if (!user) return;
    try {
        const messages = await getMessagesForUser(user.uid);
        const dataStr = JSON.stringify({ user, messages }, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'my-bottle-data.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        toast({
            title: "Export Successful",
            description: "Your data has been exported.",
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Export Failed",
            description: "Could not export your data. Please try again.",
        });
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);
    const success = await deleteUserAndData(user.uid);
    if (success) {
        toast({
            title: "Account Deleted",
            description: "Your account and all associated data have been deleted.",
        });
    } else {
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: "Could not delete your account. Please try again.",
        });
    }
    setIsDeleting(false);
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Message in a Bottle',
          text: 'Send anonymous messages into the digital ocean.',
          url: window.location.origin,
        });
        toast({ title: 'Shared successfully!' });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Share Failed',
          description: 'Could not share the app at this time.',
        });
      }
    } else {
      // Fallback for browsers that do not support the Web Share API
      navigator.clipboard.writeText(window.location.origin);
      toast({
        title: 'Link Copied',
        description: 'App link copied to your clipboard.',
      });
    }
  };

  const handleResetSettings = () => {
    resetAccessibilitySettings();
    setTheme('light');
    toast({
      title: 'Settings Reset',
      description: 'All display and accessibility settings have been reset to default.',
    });
  }

  if (!mounted) {
    return (
        <div className="flex min-h-dvh flex-col bg-background">
          <Header />
        </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-5xl px-4 py-8 md:py-16 space-y-8">
          <div className="mb-4">
            <Button
              variant="link"
              onClick={() => router.push('/profile')}
              className="pl-0 text-muted-foreground"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Profile
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Display</CardTitle>
              <CardDescription>
                Customize the look and feel of the application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')}>
                    <Sun className="mr-2"/> Light
                  </Button>
                  <Button variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')}>
                    <Moon className="mr-2"/> Dark
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Accessibility</CardTitle>
              <CardDescription>
                Make the app easier to use.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="font-size-slider" className="flex items-center gap-2 text-foreground">
                      <Type className="h-5 w-5 text-muted-foreground" />
                      Font Size
                    </Label>
                    <span className="text-sm text-muted-foreground">{fontSizeLevel}</span>
                  </div>
                  <Slider
                    id="font-size-slider"
                    min={1}
                    max={5}
                    step={1}
                    value={[fontSizeLevel]}
                    onValueChange={(value) => setFontSizeLevel(value[0])}
                  />
               </div>
               <Separator />
               <div className="flex items-center justify-between">
                <Label htmlFor="dyslexia-font-switch" className="flex items-center gap-2 text-foreground">
                  <Languages className="h-5 w-5 text-muted-foreground" />
                  Readable Font
                </Label>
                <Switch
                  id="dyslexia-font-switch"
                  checked={dyslexiaFont}
                  onCheckedChange={toggleDyslexiaFont}
                  aria-label="Toggle dyslexia-friendly font"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="high-contrast-switch" className="flex items-center gap-2 text-foreground">
                  <Contrast className="h-5 w-5 text-muted-foreground" />
                  High Contrast
                </Label>
                <Switch
                  id="high-contrast-switch"
                  checked={highContrast}
                  onCheckedChange={toggleHighContrast}
                  aria-label="Toggle high contrast mode"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="reduce-motion-switch" className="flex items-center gap-2 text-foreground">
                  <EyeOff className="h-5 w-5 text-muted-foreground" />
                  Reduce Motion
                </Label>
                <Switch
                  id="reduce-motion-switch"
                  checked={reduceMotion}
                  onCheckedChange={toggleReduceMotion}
                  aria-label="Toggle reduce motion"
                />
              </div>
               <Separator />
               <div className="flex items-center justify-between">
                <Label htmlFor="image-descriptions-switch" className="flex items-center gap-2 text-foreground">
                  <Sparkles className="h-5 w-5 text-muted-foreground" />
                  Show Image Hints
                </Label>
                <Switch
                  id="image-descriptions-switch"
                  checked={showImageDescriptions}
                  onCheckedChange={toggleShowImageDescriptions}
                  aria-label="Toggle image descriptions"
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
                <CardTitle>Tools</CardTitle>
                <CardDescription>General application tools and actions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label className="flex items-center gap-2 text-foreground"><Share className="h-5 w-5 text-muted-foreground" /> Share App</Label>
                        <p className="text-sm text-muted-foreground">Share a link to this app with others.</p>
                    </div>
                    <Button variant="outline" onClick={handleShare}>Share</Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label className="flex items-center gap-2 text-foreground"><Star className="h-5 w-5 text-muted-foreground" /> Rate the App</Label>
                        <p className="text-sm text-muted-foreground">Enjoying the app? Leave a review.</p>
                    </div>
                    <Button variant="outline" asChild>
                        <a href="/about">Review</a>
                    </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label className="flex items-center gap-2 text-foreground"><RefreshCw className="h-5 w-5 text-muted-foreground" /> Reset All Settings</Label>
                        <p className="text-sm text-muted-foreground">Reset all display and accessibility options.</p>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline">Reset</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will reset all theme and accessibility settings to their default values.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleResetSettings}>Confirm</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>Manage your application and account data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label className="flex items-center gap-2 text-foreground"><RefreshCw className="h-5 w-5 text-muted-foreground" /> Clear Browse Cache</Label>
                        <p className="text-sm text-muted-foreground">Force a refresh of all browse data from the server.</p>
                    </div>
                    <Button variant="outline" onClick={handleClearCache}>Clear</Button>
                </div>
                {user && !user.isAnonymous && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="flex items-center gap-2 text-foreground"><Download className="h-5 w-5 text-muted-foreground" /> Export My Data</Label>
                            <p className="text-sm text-muted-foreground">Download a file of all your sent messages.</p>
                        </div>
                        <Button variant="outline" onClick={handleExportData}>Export</Button>
                    </div>
                  </>
                )}
            </CardContent>
          </Card>
          
           {user && !user.isAnonymous && (
            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent>
                     <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="flex items-center text-foreground"><Trash2 className="mr-2 h-5 w-5 text-destructive" /> Delete Account</Label>
                            <p className="text-sm text-muted-foreground">Permanently delete your account and all data.</p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" disabled={isDeleting}>
                                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete your account,
                                        your messages, and remove your data from our servers.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteAccount}>Continue</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            </Card>
           )}

        </div>
      </main>
    </div>
  );
});

export default function SettingsPage() {
    return <SettingsPageContent />;
}
