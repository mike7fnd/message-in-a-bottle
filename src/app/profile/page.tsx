
'use client';

import { useState, useTransition, useRef, useEffect, useMemo } from 'react';
import { useUser, useAuth } from '@/firebase';
import { signOut, updateProfile } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
import { Loader2, LogOut, Info, History, ChevronRight, Edit, Camera, User, Settings, FileText, Shield, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/Header';
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

function SentMessageCard({ message }: SentMessageCardProps) {
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
}


function ProfilePageContent() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isUpdating, startUpdateTransition] = useTransition();

  const [photoURL, setPhotoURL] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [activeTab, setActiveTab] = useState('bottles');

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

  const NavLinks = ({ showHistory }: { showHistory: boolean }) => (
    <div className="px-4">
      {showHistory && (
        <>
          <Link href="/history" className="block p-4 transition-colors hover:bg-muted/50 rounded-lg">
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
       <Link href="/settings" className="block p-4 transition-colors hover:bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Settings</span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </Link>
      <Separator />
      <Link href="/about" className="block p-4 transition-colors hover:bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Info className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">About</span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </Link>
       <Separator />
      <Link href="/privacy" className="block p-4 transition-colors hover:bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Privacy Policy</span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </Link>
       <Separator />
      <Link href="/terms" className="block p-4 transition-colors hover:bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Terms of Service</span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </Link>
    </div>
  );


  if (user.isAnonymous) {
    return (
      <>
        <Header />
        <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
          <Card className="overflow-hidden">
             <div className="relative">
                <Image
                    src="https://i.pinimg.com/736x/8b/84/41/8b8441554563a3101523f3f6fe80a1b4.jpg"
                    alt="Cover photo"
                    width={500}
                    height={200}
                    className="w-full h-32 object-cover"
                    unoptimized
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 w-full">
                     <div className="relative">
                        <Avatar className="h-28 w-28 border-4 border-background">
                            <AvatarFallback><User className="h-12 w-12" /></AvatarFallback>
                        </Avatar>
                    </div>
                </div>
            </div>
            <CardHeader className="items-center text-center pt-16">
               <CardTitle>Anonymous User</CardTitle>
               <CardDescription>
                   Sign in to set a profile and save your history.
               </CardDescription>
            </CardHeader>
            <CardContent className="px-0 py-0">
               <Tabs defaultValue="bottles" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="px-4 pb-4">
                  <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="bottles">My Bottles</TabsTrigger>
                      <TabsTrigger value="tools">Tools</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="bottles" className="p-0">
                    <div className="text-center py-16 px-6 h-96">
                        <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">No Saved Messages</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Sign in to track the messages you've sent.</p>
                        <Button asChild size="sm" className="mt-4">
                            <Link href="/auth">Sign In</Link>
                        </Button>
                    </div>
                </TabsContent>
                <TabsContent value="tools" className="py-2">
                    <NavLinks showHistory={false} />
                     <div className="p-4 mt-2">
                        <Button
                            asChild
                            variant="outline"
                            className="w-full"
                        >
                            <Link href="/auth">
                                <LogOut className="mr-2 h-4 w-4" /> Sign In / Sign Up
                            </Link>
                        </Button>
                    </div>
                </TabsContent>
               </Tabs>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
          <Card className="overflow-hidden">
            <div className="relative">
                <Image
                    src="https://i.pinimg.com/736x/8b/84/41/8b8441554563a3101523f3f6fe80a1b4.jpg"
                    alt="Cover photo"
                    width={500}
                    height={200}
                    className="w-full h-32 object-cover"
                    unoptimized
                />
                 <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleProfilePictureChange}
                    accept="image/*"
                    className="hidden"
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 w-full">
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
                                <Loader2 className="h-6 w-6 animate-spin text-white" />
                            ) : (
                                <Camera className="h-6 w-6 text-white" />
                            )}
                        </div>
                    </button>
                </div>
            </div>

            <CardHeader className="items-center text-center pt-16">
              <div className="flex items-center gap-2">
                <CardTitle>{user.displayName || 'Anonymous'}</CardTitle>
                <Dialog
                  open={isEditDialogOpen}
                  onOpenChange={setIsEditDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
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
              <CardDescription>@{getUsernameFromEmail(user.email)}</CardDescription>
            </CardHeader>

            <CardContent className="px-0 py-0">
               <Tabs defaultValue="bottles" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="px-4 pb-4">
                  <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="bottles">My Bottles</TabsTrigger>
                      <TabsTrigger value="tools">Tools</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="bottles" className="p-0">
                    <ScrollArea className="h-96">
                        <div className="p-6">
                            {isLoadingMessages ? (
                                <div className="grid grid-cols-2 gap-x-8 gap-y-12">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="flex flex-col items-center gap-2">
                                            <Skeleton className="h-32 w-32 rounded-full" />
                                            <Skeleton className="h-6 w-24" />
                                        </div>
                                    ))}
                                </div>
                            ) : sentMessages.length > 0 ? (
                                <div className="grid grid-cols-2 gap-x-8 gap-y-12">
                                    {sentMessages.slice(0, 4).map(message => (
                                        <SentMessageCard key={message.id} message={message} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 px-6">
                                    <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <h3 className="mt-4 text-lg font-semibold">No Sent Messages</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">You haven't sent any messages yet.</p>
                                    <Button asChild size="sm" className="mt-4">
                                        <Link href="/send">Send your first message</Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </TabsContent>
                <TabsContent value="tools" className="py-2">
                    <NavLinks showHistory={true} />
                     <div className="p-4 mt-2">
                        <Button
                            onClick={handleSignOut}
                            variant="outline"
                            className="w-full"
                        >
                            <LogOut className="mr-2 h-4 w-4" /> Sign Out
                        </Button>
                    </div>
                </TabsContent>
               </Tabs>
            </CardContent>
            {activeTab === 'bottles' && sentMessages.length > 0 && (
              <CardFooter className="justify-center pt-4">
                  <Button asChild variant="outline">
                      <Link href="/history">
                          <History className="mr-2 h-4 w-4" />
                          View all my bottles
                      </Link>
                  </Button>
              </CardFooter>
            )}
          </Card>
      </div>
    </>
  );
}

export default function ProfilePage() {
  return <ProfilePageContent />;
}
