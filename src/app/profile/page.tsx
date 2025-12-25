
'use client';

import { useState, useTransition, useRef, useEffect, memo, useLayoutEffect } from 'react';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { signOut, updateProfile } from 'firebase/auth';
import { getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, LogOut, Info, History, ChevronRight, Edit, Camera, User, Settings, FileText, Shield, MessageSquare, Link as LinkIcon, ImageIcon, Download, Star, Search } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getMessagesForUser, type Message } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from 'next-themes';
import { useFavorites } from '@/context/FavoritesContext';
import { MessageCard } from '@/components/MessageCard';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

interface SentMessageCardProps {
    message: Message;
}

const SentMessageCard = memo(({ message }: SentMessageCardProps) => {
  const { resolvedTheme } = useTheme();
  const lightImage = "https://i.ibb.co/GvX9XMwm/bottle-default.png";
  const darkImage = "https://i.ibb.co/nKmq0gc/Gemini-Generated-Image-5z3cjz5z3cjz5z3c-removebg-preview.png";
  const bottleImage = resolvedTheme === 'dark' ? darkImage : lightImage;

  return (
    <Link
      href={`/message/${message.id}`}
      className="group flex flex-col items-center gap-2 text-center"
    >
      <div className="relative h-32 w-32 transform transition-transform duration-200 group-hover:scale-110">
        <Image
          src={bottleImage}
          alt="Bottle illustration"
          width={128}
          height={128}
          className="h-32 w-32 object-contain"
          unoptimized
        />
      </div>
      <div className="transition-transform duration-200 group-hover:scale-105 w-full">
        <span className="capitalize font-semibold text-lg truncate block">{message.recipient}</span>
      </div>
    </Link>
  );
});
SentMessageCard.displayName = 'SentMessageCard';

const NavLinks = memo(({ showHistory, onSignOut, onInstall }: { showHistory: boolean, onSignOut?: () => void, onInstall: () => void }) => (
    <div className="rounded-30px bg-card shadow-subtle p-2">
       <button onClick={onInstall} className="w-full text-left p-3 transition-colors hover:bg-muted/50 rounded-30px">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Download className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Install App</span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </button>
      <Separator />
      {showHistory && (
        <>
          <Link href="/history" className="block p-3 transition-colors hover:bg-muted/50 rounded-30px">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <History className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">History</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>
          <Separator />
        </>
      )}
       <Link href="/settings" className="block p-3 transition-colors hover:bg-muted/50 rounded-30px">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Settings</span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </Link>
      <Separator />
      <Link href="/about" className="block p-3 transition-colors hover:bg-muted/50 rounded-30px">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Info className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">About & Support</span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </Link>
       <Separator />
      <Link href="/privacy" className="block p-3 transition-colors hover:bg-muted/50 rounded-30px">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Privacy Policy</span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </Link>
       <Separator />
      <Link href="/terms" className="block p-3 transition-colors hover:bg-muted/50 rounded-30px">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Terms of Service</span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </Link>
       {onSignOut && (
        <>
            <Separator />
            <button onClick={onSignOut} className="w-full text-left p-3 transition-colors hover:bg-muted/50 rounded-30px">
                <div className="flex items-center gap-4">
                    <LogOut className="h-5 w-5 text-destructive" />
                    <span className="text-sm font-medium text-destructive">Sign Out</span>
                </div>
            </button>
        </>
       )}
    </div>
));
NavLinks.displayName = 'NavLinks';

const ProfilePageContent = memo(function ProfilePageContent() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { favorites } = useFavorites();
  const [favoriteSearchTerm, setFavoriteSearchTerm] = useState('');


  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isUpdating, startUpdateTransition] = useTransition();

  const [photoURL, setPhotoURL] = useState('');
  const [coverPhotoURL, setCoverPhotoURL] = useState('https://i.pinimg.com/736x/8b/84/41/8b8441554563a3101523f3f6fe80a1b4.jpg');
  const [isUploading, setIsUploading] = useState(false);
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);

  const [activeTab, setActiveTab] = useState('sent');
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const [activePill, setActivePill] = useState({ width: 0, left: 0 });


   useLayoutEffect(() => {
    const calculatePillPosition = () => {
      const activeTrigger = tabsContainerRef.current?.querySelector<HTMLButtonElement>(`[data-state="active"]`);
      if (activeTrigger) {
        setActivePill({
          width: activeTrigger.offsetWidth,
          left: activeTrigger.offsetLeft,
        });
      }
    };

    calculatePillPosition();
    window.addEventListener('resize', calculatePillPosition);
    return () => window.removeEventListener('resize', calculatePillPosition);
  }, [activeTab]);


  useGSAP(() => {
    if (indicatorRef.current && activePill.width > 0) {
      gsap.to(indicatorRef.current, {
        width: activePill.width,
        left: activePill.left,
        duration: 0.8,
        ease: 'elastic.out(1, 0.75)',
      });
    }
  }, { dependencies: [activePill], scope: tabsContainerRef });


  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      deferredInstallPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === 'accepted') {
          toast({ title: 'Installation successful!' });
        }
        setDeferredInstallPrompt(null);
      });
    } else {
        toast({ title: 'App is already installed or installable.'});
    }
  };


  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  useEffect(() => {
    if (user) {
        // Load from cache first
        const cachedPhoto = localStorage.getItem(`photoURL_${user.uid}`);
        const cachedCover = localStorage.getItem(`coverPhotoURL_${user.uid}`);
        if (cachedPhoto) setPhotoURL(cachedPhoto);
        if (cachedCover) setCoverPhotoURL(cachedCover);

        // Then set from user object and fetch from DB for sync, but prefer cache for initial render
        setNewUsername(user.displayName || '');
        if (user.photoURL && !cachedPhoto) {
            setPhotoURL(user.photoURL);
            localStorage.setItem(`photoURL_${user.uid}`, user.photoURL);
        }

    }
  }, [user, firestore]);


  useEffect(() => {
    if (user && !user.isAnonymous) {
      setIsLoadingMessages(true);
      getMessagesForUser(user.uid)
        .then(setSentMessages)
        .catch(console.error)
        .finally(() => setIsLoadingMessages(false));
    }
  }, [user]);

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/auth');
    }
  };

  const handleUsernameUpdate = async () => {
    if (!user || !newUsername.trim()) {
      toast({
        variant: 'destructive',
        title: 'Display name cannot be empty.',
      });
      return;
    }

    startUpdateTransition(async () => {
      try {
        await updateProfile(user, { displayName: newUsername.trim() });
        toast({
          title: 'Success!',
          description: 'Your display name has been updated.',
        });
        setIsEditDialogOpen(false);
      } catch (error) {
        console.error('Failed to update username:', error);
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: 'Could not update your display name. Please try again.',
        });
      }
    });
  };

  const resizeImage = (file: File, maxSize: number): Promise<{blob: Blob, dataUrl: string}> => {
    return new Promise((resolve, reject) => {
        const image = new window.Image();
        image.src = URL.createObjectURL(file);
        image.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = image;

            if (width > height) {
                if (width > maxSize) {
                    height *= maxSize / width;
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width *= maxSize / height;
                    height = maxSize;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }
            ctx.drawImage(image, 0, 0, width, height);
            canvas.toBlob((blob) => {
                if (!blob) {
                    return reject(new Error('Canvas to Blob conversion failed'));
                }
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                resolve({blob, dataUrl});
            }, 'image/jpeg', 0.8);
        };
        image.onerror = (error) => reject(error);
    });
  };

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);

    try {
        const { dataUrl } = await resizeImage(file, 256);
        setPhotoURL(dataUrl);
        localStorage.setItem(`photoURL_${user.uid}`, dataUrl);
        toast({ title: 'Success!', description: 'Your profile picture has been updated locally.' });
    } catch (error) {
        console.error('Failed to update profile picture:', error);
        const errorMessage = 'Could not update your profile picture. Please try again.';
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: errorMessage,
        });
    } finally {
        setIsUploading(false);
    }
  };

  const handleCoverPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsCoverUploading(true);

    try {
        const { dataUrl } = await resizeImage(file, 1024);
        setCoverPhotoURL(dataUrl);
        localStorage.setItem(`coverPhotoURL_${user.uid}`, dataUrl);
        toast({ title: 'Success!', description: 'Your cover photo has been updated locally.' });
    } catch (error) {
        console.error('Failed to update cover photo:', error);
        const errorMessage = 'Could not update your cover photo. Please try again.';
        toast({
            variant: 'destructive',
            title: 'Upload Failed',
            description: errorMessage,
        });
    } finally {
        setIsCoverUploading(false);
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'A';
    return name.charAt(0).toUpperCase();
  };

  const getUsernameFromEmail = (email: string | null | undefined): string => {
    if (!email) return 'anonymous';
    const namePart = email.split('@')[0];
    // Simple check to avoid showing long random strings if email is unusual
    return /^[a-zA-Z0-9._-]+$/.test(namePart) ? namePart : 'user';
  };

  const filteredFavorites = favorites.filter(message =>
    message.content.toLowerCase().includes(favoriteSearchTerm.toLowerCase()) ||
    message.recipient.toLowerCase().includes(favoriteSearchTerm.toLowerCase())
  );

  if (isUserLoading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16 space-y-8">
        {/* Cover Photo Skeleton */}
        <div className="relative h-32 rounded-30px bg-muted">
            {/* Avatar Skeleton */}
            <div className="absolute inset-x-0 -bottom-16 flex justify-center">
                <Skeleton className="h-36 w-36 rounded-full border-4 border-background" />
            </div>
        </div>

        {/* User Info Skeleton */}
        <div className="pt-10 text-center space-y-2">
            <Skeleton className="h-9 w-48 mx-auto" />
            <Skeleton className="h-5 w-32 mx-auto" />
            <Skeleton className="h-9 w-24 mx-auto mt-4" />
        </div>

        {/* Tabs Skeleton */}
        <div className="space-y-4">
            <div className="p-1 bg-muted rounded-full grid grid-cols-2">
                <Skeleton className="h-9 rounded-full" />
                <Skeleton className="h-9 rounded-full bg-transparent" />
            </div>
            <Skeleton className="h-48 w-full" />
        </div>

        {/* Nav Links Skeleton */}
        <div className="space-y-2">
            <Skeleton className="h-5 w-24 px-2" />
            <div className="rounded-30px bg-card shadow-subtle p-2 space-y-1">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
        </div>
    </div>
    );
  }

  if (!user) {
    router.push('/auth');
    return (
         <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  if (user.isAnonymous) {
    return (
      <>
        <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16 space-y-8">
            <div className="relative h-32 rounded-30px">
                <Image
                    src="https://i.pinimg.com/736x/8b/84/41/8b8441554563a3101523f3f6fe80a1b4.jpg"
                    alt="Cover photo"
                    fill
                    className="object-cover rounded-30px"
                    unoptimized
                />
                 <div className="absolute inset-x-0 -bottom-12 flex justify-center">
                     <Avatar className="h-28 w-28 border-4 border-background">
                        <AvatarFallback><User className="h-12 w-12" /></AvatarFallback>
                    </Avatar>
                </div>
            </div>
            <div className="pt-10 text-center">
               <h1 className="text-2xl font-bold">Anonymous User</h1>
               <p className="text-muted-foreground mt-1">
                   Sign in to set a profile and save your history.
               </p>
            </div>

            <div className="space-y-2">
                <h2 className="text-sm font-semibold text-muted-foreground px-2">My Bottles</h2>
                <div className="rounded-30px bg-card shadow-subtle p-6">
                    <div className="text-center py-12 px-6">
                        <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">Track Your Sent Messages</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Sign up to see the history of bottles you've sent, edit and delete them.</p>
                        <Button asChild size="sm" className="mt-4">
                            <Link href="/auth">Sign Up Now</Link>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <h2 className="text-sm font-semibold text-muted-foreground px-2">Tools & Info</h2>
                <NavLinks showHistory={false} onInstall={handleInstallClick}/>
            </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16 space-y-8">
        <div className="relative h-32 rounded-30px group">
            <Image
                src={coverPhotoURL}
                alt="Cover photo"
                fill
                className="object-cover rounded-30px"
                unoptimized
            />
            <input
                type="file"
                ref={coverFileInputRef}
                onChange={handleCoverPhotoChange}
                accept="image/*"
                className="hidden"
            />
            <div className="absolute inset-0 bg-black/30 rounded-30px opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button variant="outline" size="sm" onClick={() => coverFileInputRef.current?.click()} disabled={isCoverUploading}>
                    {isCoverUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                    Edit Cover
                </Button>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleProfilePictureChange}
                accept="image/*"
                className="hidden"
            />
            <div className="absolute inset-x-0 -bottom-16 flex justify-center">
                <button
                    className="relative group rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    aria-label="Change profile picture"
                >
                    <Avatar className="h-36 w-36 border-4 border-background transition-opacity group-hover:opacity-80">
                        <AvatarImage
                            src={photoURL || ''}
                            alt={user.displayName || ''}
                        />
                        <AvatarFallback>
                            {getInitials(user.displayName)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                         {isUploading ? (
                            <Loader2 className="h-8 w-8 animate-spin text-white" />
                        ) : (
                            <Camera className="h-8 w-8 text-white" />
                        )}
                    </div>
                </button>
            </div>
        </div>

        <div className="pt-10 text-center">
            <h1 className="text-3xl font-bold">{user.displayName || 'Anonymous'}</h1>
            <p className="text-muted-foreground">@{getUsernameFromEmail(user.email)}</p>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="mt-4">
                  Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[90vw] sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit Display Name</DialogTitle>
                  <DialogDescription>
                    Make changes to your display name here. Click save when
                    you're done.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="username" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="username"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="col-span-3"
                      disabled={isUpdating}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    onClick={handleUsernameUpdate}
                    disabled={isUpdating}
                  >
                    {isUpdating && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </div>

        <div>
           <Tabs defaultValue="sent" onValueChange={setActiveTab}>
                <div ref={tabsContainerRef} className="relative">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="sent">My Bottles</TabsTrigger>
                        <TabsTrigger value="favorites">Favorites</TabsTrigger>
                    </TabsList>
                    <div ref={indicatorRef} className="absolute top-0 h-full rounded-full bg-background shadow-sm z-[-1]" />
                </div>
                <TabsContent value="sent">
                    <Card className="rounded-30px shadow-subtle p-6 mt-2">
                        {isLoadingMessages ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-8">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="flex flex-col items-center gap-2">
                                        <Skeleton className="h-32 w-32 rounded-full" />
                                        <Skeleton className="h-6 w-24" />
                                    </div>
                                ))}
                            </div>
                        ) : sentMessages.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-8">
                                {sentMessages.slice(0, 4).map(message => (
                                    <SentMessageCard key={message.id} message={message} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 px-6">
                                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-semibold">No Sent Messages</h3>
                                <p className="mt-1 text-sm text-muted-foreground">You haven't sent any messages yet.</p>
                                <Button asChild size="sm" className="mt-4">
                                    <Link href="/send">Send your first message</Link>
                                </Button>
                            </div>
                        )}
                        {sentMessages.length > 4 && (
                            <div className="text-center pt-8">
                                <Button asChild variant="outline">
                                    <Link href="/history">
                                        <History className="mr-2 h-4 w-4" />
                                        View all my bottles
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </Card>
                </TabsContent>
                <TabsContent value="favorites">
                    <div className="space-y-4 mt-2">
                        {favorites.length > 0 ? (
                            <>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search favorites..."
                                        value={favoriteSearchTerm}
                                        onChange={(e) => setFavoriteSearchTerm(e.target.value)}
                                        className="w-full pl-10 bg-background"
                                    />
                                </div>
                                {filteredFavorites.length > 0 ? (
                                    filteredFavorites.map(message => (
                                        <Link href={`/message/${message.id}`} key={message.id} className="block group">
                                            <MessageCard message={message} />
                                        </Link>
                                    ))
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">No matching favorites found.</p>
                                )}
                            </>
                        ) : (
                            <Card className="rounded-30px shadow-subtle">
                                <div className="text-center py-12 px-6">
                                    <Star className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <h3 className="mt-4 text-lg font-semibold">No Favorites Yet</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">You can favorite messages from the browse page or bottle pages.</p>
                                    <Button asChild size="sm" className="mt-4">
                                        <Link href="/browse">Browse Messages</Link>
                                    </Button>
                                </div>
                            </Card>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>

        <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground px-2">Tools & Settings</h2>
            <NavLinks showHistory={sentMessages.length > 0} onSignOut={handleSignOut} onInstall={handleInstallClick}/>
        </div>
      </div>
    </>
  );
});

export default function ProfilePage() {
  return <ProfilePageContent />;
}






