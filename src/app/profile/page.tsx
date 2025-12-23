
'use client';

import { useState, useTransition, useRef, useEffect, useMemo, memo } from 'react';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { signOut, updateProfile } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, LogOut, Info, History, ChevronRight, Edit, Camera, User, Settings, FileText, Shield, MessageSquare, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from 'next-themes';


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

const NavLinks = memo(({ showHistory, onSignOut }: { showHistory: boolean, onSignOut?: () => void }) => (
    <div className="rounded-30px bg-card shadow-subtle p-2">
      {showHistory && (
        <>
          <Link href="/history" className="block p-3 transition-colors hover:bg-muted/50 rounded-lg">
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
       <Link href="/settings" className="block p-3 transition-colors hover:bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Settings</span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </Link>
      <Separator />
      <Link href="/about" className="block p-3 transition-colors hover:bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Info className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">About & Support</span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </Link>
       <Separator />
      <Link href="/privacy" className="block p-3 transition-colors hover:bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Privacy Policy</span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </Link>
       <Separator />
      <Link href="/terms" className="block p-3 transition-colors hover:bg-muted/50 rounded-lg">
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
            <button onClick={onSignOut} className="w-full text-left p-3 transition-colors hover:bg-muted/50 rounded-lg">
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

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isUpdating, startUpdateTransition] = useTransition();

  const [photoURL, setPhotoURL] = useState('');
  const [coverPhotoURL, setCoverPhotoURL] = useState('https://i.pinimg.com/736x/8b/84/41/8b8441554563a3101523f3f6fe80a1b4.jpg');
  const [isUploading, setIsUploading] = useState(false);
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);


  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  useEffect(() => {
    if (user) {
        setNewUsername(user.displayName || '');
        setPhotoURL(user.photoURL || '');
        // Fetch cover photo from Firestore
        const userDocRef = doc(firestore, 'users', user.uid);
        getDoc(userDocRef).then(docSnap => {
            if (docSnap.exists() && docSnap.data().coverPhotoURL) {
                setCoverPhotoURL(docSnap.data().coverPhotoURL);
            }
        });
    }
  }, [user, firestore]);

  const getUsernameFromEmail = (email: string | null | undefined) => {
    if (!email) return 'anonymous';
    return email.split('@')[0];
  };

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

    const originalPhotoURL = photoURL;
    setIsUploading(true);

    try {
        const {blob: resizedBlob, dataUrl: optimisticUrl} = await resizeImage(file, 256);

        setPhotoURL(optimisticUrl);

        const storage = getStorage();
        const storageRef = ref(storage, `profile-pictures/${user.uid}/${file.name}`);

        await uploadBytes(storageRef, resizedBlob);
        const downloadURL = await getDownloadURL(storageRef);

        await updateProfile(user, { photoURL: downloadURL });
        setPhotoURL(downloadURL);

        toast({ title: 'Success!', description: 'Your profile picture has been updated.' });
    } catch (error) {
        console.error('Failed to update profile picture:', error);
        setPhotoURL(originalPhotoURL);
        const errorMessage = 'Could not update your profile picture. Please try again.';
        toast({
            variant: 'destructive',
            title: 'Upload Failed',
            description: errorMessage,
        });
    } finally {
        setIsUploading(false);
    }
  };

  const handleCoverPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const originalCoverPhotoURL = coverPhotoURL;
    setIsCoverUploading(true);

    try {
        const {blob: resizedBlob, dataUrl: optimisticUrl} = await resizeImage(file, 1024);

        setCoverPhotoURL(optimisticUrl);

        const storage = getStorage();
        const storageRef = ref(storage, `cover-pictures/${user.uid}/${file.name}`);

        await uploadBytes(storageRef, resizedBlob);
        const downloadURL = await getDownloadURL(storageRef);

        const userDocRef = doc(firestore, 'users', user.uid);
        await setDoc(userDocRef, { coverPhotoURL: downloadURL }, { merge: true });

        setCoverPhotoURL(downloadURL);

        toast({ title: 'Success!', description: 'Your cover photo has been updated.' });
    } catch (error) {
        console.error('Failed to update cover photo:', error);
        setCoverPhotoURL(originalCoverPhotoURL);
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

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
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
                <NavLinks showHistory={false} />
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
            <div className="absolute inset-x-0 -bottom-12 flex justify-center">
                <button
                    className="relative group rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    aria-label="Change profile picture"
                >
                    <Avatar className="h-28 w-28 border-4 border-background transition-opacity group-hover:opacity-80">
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

        <div className="pt-5 text-center">
            <div className="flex items-center justify-center gap-1">
                <h1 className="text-2xl font-bold">{user.displayName || 'Anonymous'}</h1>
                <Dialog
                  open={isEditDialogOpen}
                  onOpenChange={setIsEditDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Edit className="h-4 w-4" />
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
            <p className="text-muted-foreground">@{getUsernameFromEmail(user.email)}</p>
        </div>

        <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground px-2">My Bottles</h2>
            <div className="rounded-30px bg-card shadow-subtle p-6">
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
            </div>
        </div>

        <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground px-2">Tools & Settings</h2>
            <NavLinks showHistory={sentMessages.length > 0} onSignOut={handleSignOut} />
        </div>
      </div>
    </>
  );
});

export default function ProfilePage() {
  return <ProfilePageContent />;
}





