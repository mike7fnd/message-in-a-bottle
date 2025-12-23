
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
import { Loader2, LogOut, Info, History, ChevronRight, Edit, Camera, User, Settings, FileText, Shield, MessageSquare, Link as LinkIcon, Grid3x3 } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Separator } from '@/components/ui/separator';
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
  const hoverLightImage = "https://i.ibb.co/3mRwMGRq/bottle-glow.png";
  const hoverDarkImage = "https://i.ibb.co/pkBNQZv/bottle-glow-dark-mode.png";

  const defaultImage = resolvedTheme === 'dark' ? darkImage : lightImage;
  const hoverImage = resolvedTheme === 'dark' ? hoverDarkImage : hoverLightImage;


  return (
    <Link
      href={`/message/${message.id}`}
      className="group"
    >
        <div className="flex flex-col items-center gap-1 text-center">
             <div className="relative h-24 w-24 transform transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6">
                <Image
                src={defaultImage}
                alt={`Bottle for ${message.recipient}`}
                fill
                className="object-contain"
                unoptimized
                />
                <Image
                src={hoverImage}
                alt={`Glowing bottle for ${message.recipient}`}
                fill
                className="absolute inset-0 object-contain opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                unoptimized
                />
            </div>
            <p className="text-center font-semibold text-sm capitalize mt-1 w-24 truncate">{message.recipient}</p>
        </div>
    </Link>
  );
});
SentMessageCard.displayName = 'SentMessageCard';

const NavLinks = memo(({ showHistory, onSignOutTrigger }: { showHistory: boolean, onSignOutTrigger?: React.ReactNode }) => (
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
            <span className="text-sm font-medium">About &amp; Support</span>
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
       {onSignOutTrigger && (
        <>
            <Separator />
            {onSignOutTrigger}
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

  const [newUsername, setNewUsername] = useState('');
  const [isUpdating, startUpdateTransition] = useTransition();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [photoURL, setPhotoURL] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  useEffect(() => {
    if (user) {
        setNewUsername(user.displayName || '');
        setPhotoURL(user.photoURL || '');
    }
  }, [user]);

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

  const matchedBottlesCount = useMemo(() => {
    if (!user || !user.displayName || !sentMessages) return 0;
    return sentMessages.filter(
      (msg) => msg.recipient.toLowerCase() === user.displayName!.toLowerCase()
    ).length;
  }, [user, sentMessages]);


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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleAvatarUpload = async () => {
    if (!selectedFile || !user) return;

    startUpdateTransition(async () => {
        const storage = getStorage();
        const storageRef = ref(storage, `profile-pictures/${user.uid}/${selectedFile.name}`);
        try {
            // Resize image before uploading
            const resizedBlob = await new Promise<Blob>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(selectedFile);
                reader.onload = (event) => {
                    const img = document.createElement('img');
                    img.src = event.target?.result as string;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const MAX_WIDTH = 300;
                        const scaleSize = MAX_WIDTH / img.width;
                        canvas.width = MAX_WIDTH;
                        canvas.height = img.height * scaleSize;
                        const ctx = canvas.getContext('2d');
                        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                        canvas.toBlob(resolve, 'image/jpeg', 0.8);
                    };
                    img.onerror = reject;
                };
                reader.onerror = reject;
            });

            const snapshot = await uploadBytes(storageRef, resizedBlob);
            const downloadURL = await getDownloadURL(snapshot.ref);

            await updateProfile(user, { photoURL: downloadURL });
            setPhotoURL(downloadURL);
            setSelectedFile(null);
            setIsEditDialogOpen(false);

            toast({
                title: 'Avatar Updated!',
                description: 'Your new profile picture is now live.',
            });
        } catch (error) {
            console.error('Failed to upload avatar:', error);
            toast({
                variant: 'destructive',
                title: 'Upload Failed',
                description: 'Could not update your profile picture. Please try again.',
            });
        }
    });
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'a';
    return name.charAt(0).toLowerCase();
  };

  if (isUserLoading) {
    return (
      <>
        <Header />
        <div className="container mx-auto max-w-5xl px-0 sm:px-4 py-8 md:py-16">
            <div className="hidden md:block">
                <div className="flex flex-row items-center gap-8 px-4">
                    <Skeleton className="h-36 w-36 rounded-full" />
                    <div className="space-y-3">
                        <Skeleton className="h-8 w-48" />
                        <div className="flex gap-6">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-5 w-24" />
                        </div>
                        <Skeleton className="h-5 w-32" />
                    </div>
                </div>
                <Separator className="my-8" />
            </div>
            <div className="px-4">
                <Skeleton className="h-96 w-full rounded-30px" />
            </div>
        </div>
      </>
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

  // --- Mobile View ---
  if (user.isAnonymous) {
    return (
      <>
        <Header />
        <div className="container mx-auto max-w-5xl px-4 py-8 md:py-16 space-y-8">
            <div className="relative h-32 rounded-lg">
                <Image
                    src="https://i.pinimg.com/736x/8b/84/41/8b8441554563a3101523f3f6fe80a1b4.jpg"
                    alt="Cover photo"
                    fill
                    className="object-cover rounded-lg"
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
                        <p className="mt-1 text-sm text-muted-foreground">Sign up to see the history of bottles you've sent.</p>
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

  const signOutTriggerMobile = (
    <AlertDialogTrigger asChild>
      <button className="w-full text-left p-3 transition-colors hover:bg-muted/50 rounded-lg">
        <div className="flex items-center gap-4">
            <LogOut className="h-5 w-5 text-destructive" />
            <span className="text-sm font-medium text-destructive">Sign Out</span>
        </div>
      </button>
    </AlertDialogTrigger>
  );

  // --- Main Content for Logged-in Users ---
  return (
    <>
      <Header />
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[90vw] sm:max-w-[425px]">
            <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
                Make changes to your profile here. Click save when you're done.
            </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="relative group rounded-full w-24 h-24 mx-auto">
                    <Avatar className="w-full h-full border-4 border-background">
                        <AvatarImage
                            src={selectedFile ? URL.createObjectURL(selectedFile) : photoURL || ''}
                            alt={user.displayName || ''}
                        />
                        <AvatarFallback className="flex h-full w-full items-center justify-center rounded-full bg-muted text-6xl font-playfair lowercase">
                            {getInitials(user.displayName)}
                        </AvatarFallback>
                    </Avatar>
                     <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Change profile picture"
                        >
                        <Camera className="h-6 w-6 text-white"/>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                    />
                </div>
                {selectedFile && (
                    <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground">New photo selected. Click "Upload Photo" to save.</p>
                        <Button size="sm" onClick={handleAvatarUpload} disabled={isUpdating}>
                             {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Upload Photo
                        </Button>
                    </div>
                )}

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
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save changes
            </Button>
            </DialogFooter>
        </DialogContent>

        <div className="container mx-auto max-w-5xl px-0 sm:px-4 py-8 md:py-16">
            {/* --- Profile Header (Mobile) --- */}
             <div className="md:hidden space-y-8 px-4">
                <div className="relative h-32 rounded-lg">
                    <Image
                        src="https://i.pinimg.com/736x/8b/84/41/8b8441554563a3101523f3f6fe80a1b4.jpg"
                        alt="Cover photo"
                        fill
                        className="object-cover rounded-lg"
                        unoptimized
                    />
                    <div className="absolute inset-x-0 -bottom-12 flex justify-center">
                        <Avatar className="h-28 w-28 border-4 border-background">
                            <AvatarImage src={photoURL} alt={user.displayName || 'User'}/>
                            <AvatarFallback className="flex h-full w-full items-center justify-center rounded-full bg-muted text-6xl font-playfair lowercase">{getInitials(user.displayName)}</AvatarFallback>
                        </Avatar>
                    </div>
                </div>
                 <div className="pt-3 text-center">
                     <DialogTrigger asChild>
                      <div className="flex items-center justify-center gap-2">
                        <h1 className="text-2xl font-bold">{user.displayName || 'Anonymous'}</h1>
                        <button><Edit className="h-4 w-4"/></button>
                      </div>
                    </DialogTrigger>

                    <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mt-2">
                        <p><span className="font-semibold text-foreground">{sentMessages.length}</span> bottles sent</p>
                        {user.displayName && (
                            <>
                                <Separator orientation="vertical" className="h-4"/>
                                <Link href={`/browse?search=${encodeURIComponent(user.displayName)}`} className="hover:underline">
                                    <span className="font-semibold text-foreground">{matchedBottlesCount}</span> bottles for you?
                                </Link>
                            </>
                        )}
                    </div>
                     <p className="text-muted-foreground mt-1 text-sm">@{getUsernameFromEmail(user.email)}</p>
                </div>

                <div className="space-y-2">
                    <h2 className="text-sm font-semibold text-muted-foreground px-2">My Bottles</h2>
                    <div className="rounded-30px bg-card shadow-subtle p-4">
                        {isLoadingMessages ? (
                            <div className="grid grid-cols-3 gap-4">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className='space-y-2'>
                                        <Skeleton key={i} className="aspect-square w-full rounded-md" />
                                        <Skeleton className="h-4 w-2/3 mx-auto" />
                                    </div>
                                ))}
                            </div>
                        ) : sentMessages.length > 0 ? (
                            <>
                                <div className="grid grid-cols-3 gap-4">
                                    {sentMessages.slice(0, 3).map(message => (
                                        <SentMessageCard key={message.id} message={message} />
                                    ))}
                                </div>
                                {sentMessages.length > 3 && (
                                    <div className="text-center mt-6">
                                        <Button asChild variant="outline" size="sm">
                                            <Link href="/history">View all bottles</Link>
                                        </Button>
                                    </div>
                                )}
                            </>
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
                    </div>
                </div>


                <div className="space-y-2">
                    <h2 className="text-sm font-semibold text-muted-foreground px-2">Tools & Info</h2>
                    <AlertDialog>
                      <NavLinks showHistory={false} onSignOutTrigger={signOutTriggerMobile} />
                      <AlertDialogContent>
                          <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
                              <AlertDialogDescription>
                                  You will be returned to the sign-in page.
                              </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleSignOut}>Sign Out</AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            {/* --- Profile Content (Desktop) --- */}
            <div className="hidden md:block">
              <AlertDialog>
                <div className="flex flex-row items-center gap-8 px-4">
                    <DialogTrigger asChild>
                        <button className="relative group rounded-full" aria-label="Edit Profile">
                           <Avatar className="h-36 w-36 border-4 border-background transition-opacity group-hover:opacity-80">
                                <AvatarImage
                                    src={photoURL || ''}
                                    alt={user.displayName || ''}
                                />
                                <AvatarFallback className="flex h-full w-full items-center justify-center rounded-full bg-muted text-5xl font-playfair lowercase">
                                    {getInitials(user.displayName)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <Edit className="h-8 w-8 text-white" />
                            </div>
                        </button>
                    </DialogTrigger>

                    <div className="text-left space-y-3">
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl">{user.displayName || 'Anonymous'}</h1>
                             <DialogTrigger asChild>
                                <Button variant="outline" size="sm">Edit Profile</Button>
                            </DialogTrigger>
                             <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon"><LogOut className="h-5 w-5"/></Button>
                            </AlertDialogTrigger>
                        </div>
                        <p className="text-muted-foreground mt-1">@{getUsernameFromEmail(user.email)}</p>
                        <div className="flex items-center gap-6 text-muted-foreground">
                            <p><span className="font-semibold text-foreground">{sentMessages.length}</span> bottles sent</p>
                            {user.displayName && (
                                <>
                                    <Separator orientation="vertical" className="h-4"/>
                                    <Link href={`/browse?search=${encodeURIComponent(user.displayName)}`} className="hover:underline">
                                        <span className="font-semibold text-foreground">{matchedBottlesCount}</span> bottles for you?
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You will be returned to the sign-in page.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSignOut}>Sign Out</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

                <Separator className="my-8"/>

                <Tabs defaultValue="bottles" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 max-w-sm mx-auto">
                        <TabsTrigger value="bottles"><Grid3x3 className="mr-2 h-4 w-4"/> Sent Bottles</TabsTrigger>
                        <TabsTrigger value="tools"><Settings className="mr-2 h-4 w-4"/> Tools & Settings</TabsTrigger>
                    </TabsList>

                    <TabsContent value="bottles" className="mt-6 px-4 sm:px-0">
                        {isLoadingMessages ? (
                            <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 sm:gap-6">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className='space-y-2'>
                                        <Skeleton key={i} className="aspect-square w-full rounded-30px" />
                                        <Skeleton className="h-5 w-1/2 mt-2 mx-auto" />
                                    </div>
                                ))}
                            </div>
                        ) : sentMessages.length > 0 ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 sm:gap-6">
                                    {sentMessages.slice(0, 6).map(message => (
                                        <SentMessageCard key={message.id} message={message} />
                                    ))}
                                </div>
                                {sentMessages.length > 6 && (
                                    <div className="text-center mt-6">
                                        <Button asChild variant="outline">
                                            <Link href="/history">View all bottles</Link>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-20 px-6 rounded-30px bg-card shadow-subtle">
                                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-semibold">No Sent Messages</h3>
                                <p className="mt-1 text-sm text-muted-foreground">You haven't sent any messages yet.</p>
                                <Button asChild size="sm" className="mt-4">
                                    <Link href="/send">Send your first message</Link>
                                </Button>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="tools" className="mt-6 max-w-2xl mx-auto w-full px-4 sm:px-0">
                       <AlertDialog>
                          <NavLinks showHistory={false} onSignOutTrigger={
                            <AlertDialogTrigger asChild>
                              <button className="w-full text-left p-3 transition-colors hover:bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <LogOut className="h-5 w-5 text-destructive" />
                                    <span className="text-sm font-medium text-destructive">Sign Out</span>
                                </div>
                              </button>
                            </AlertDialogTrigger>
                          } />
                          <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    You will be returned to the sign-in page.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleSignOut}>Sign Out</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
      </Dialog>
    </>
  );
});

export default function ProfilePage() {
  return <ProfilePageContent />;
}
