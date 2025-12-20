
'use client';

import { useState, useTransition, useRef, useEffect, useMemo } from 'react';
import { useUser, useAuth } from '@/firebase';
import { signOut, updateProfile } from 'firebase/auth';
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
import { Loader2, LogOut, Info, History, ChevronRight, Edit, Camera, User, Pencil, Save, BookUser, MessageSquare, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { getMessagesForUser, getUserProfile, updateUserBio, type Message, type UserProfile } from '@/lib/data';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';

function ProfilePageContent() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Auth state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isUpdating, startUpdateTransition] = useTransition();
  const [isUploading, startUploadTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Firestore profile state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioContent, setBioContent] = useState('');
  const [isBioLoading, startBioTransition] = useTransition();

  // Message history state
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMessagesLoading, setIsLoadingMessages] = useState(true);

  useEffect(() => {
    if (user) {
        // Set username for editing dialog
        setNewUsername(user.displayName || '');
        if (!user.isAnonymous) {
          // Fetch Firestore profile data
          getUserProfile(user.uid).then(profile => {
              setUserProfile(profile);
              setBioContent(profile?.bio || '');
          });
          // Fetch message history for stats
          setIsLoadingMessages(true);
          getMessagesForUser(user.uid).then(setMessages).finally(() => setIsLoadingMessages(false));
        } else {
            setIsLoadingMessages(false);
        }
    } else {
        setIsLoadingMessages(false);
    }
  }, [user]);

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/auth');
    }
  };

  const handleUsernameUpdate = async () => {
    if (!user || user.isAnonymous) {
        toast({
            variant: 'destructive',
            title: 'Create an Account',
            description: 'You must create an account to set a permanent username.',
        });
        router.push('/auth');
        return;
    }

    if (!newUsername.trim()) {
      toast({
        variant: 'destructive',
        title: 'Username cannot be empty.',
      });
      return;
    }

    startUpdateTransition(async () => {
      try {
        await updateProfile(user, { displayName: newUsername.trim() });
        toast({
          title: 'Success!',
          description: 'Your username has been updated.',
        });
        setIsEditDialogOpen(false);
      } catch (error) {
        console.error('Failed to update username:', error);
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: 'Could not update your username. Please try again.',
        });
      }
    });
  };

  const handleBioUpdate = async () => {
    if (!user) return;
    startBioTransition(async () => {
        try {
            await updateUserBio(user.uid, bioContent);
            setUserProfile(prev => prev ? {...prev, bio: bioContent} : {bio: bioContent});
            setIsEditingBio(false);
            toast({
                title: 'Bio updated!',
                description: 'Your new bio has been saved.',
            });
        } catch (error) {
            console.error('Failed to update bio', error);
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: 'Could not update your bio. Please try again.',
            });
        }
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (user.isAnonymous) {
        toast({
            variant: 'destructive',
            title: 'Create an Account',
            description: 'You must create an account to set a profile picture.',
        });
        router.push('/auth');
        return;
    }

    if (!file.type.startsWith('image/')) {
        toast({ variant: 'destructive', title: 'Invalid file type', description: 'Please select an image file.' });
        return;
    }
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ variant: 'destructive', title: 'File too large', description: 'Please select an image smaller than 2MB.' });
        return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const dataUrl = reader.result as string;
        startUploadTransition(async () => {
            try {
                await updateProfile(user, { photoURL: dataUrl });
                toast({ title: 'Success!', description: 'Your profile picture has been updated.' });
            } catch (error) {
                console.error('Failed to update profile picture:', error);
                toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not update your profile picture. Firebase has a limit on URL length for profile photos. Try a smaller image or one with a shorter filename.' });
            }
        });
    };
  };

  const getInitials = (name?: string | null) => {
    if (!name || (user && user.isAnonymous)) return '';
    return name.charAt(0).toUpperCase();
  };

  const firstMessageDate = useMemo(() => {
    if (messages.length === 0) return null;
    // Messages are sorted descending, so last element is the first message sent
    const firstMessage = messages[messages.length - 1];
    return firstMessage.timestamp ? new Date(firstMessage.timestamp) : null;
  }, [messages]);

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    // This case should ideally not happen due to anonymous auth, but as a fallback
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
        <Card className="overflow-hidden">
          <CardHeader className="items-center text-center bg-muted/50 pb-6">
            <div className="relative group">
                <Avatar className="h-24 w-24 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <AvatarImage
                        src={user.photoURL || ''}
                        alt={user.displayName || ''}
                        className={cn(isUploading && "opacity-50")}
                    />
                    <AvatarFallback className={cn("text-3xl", isUploading && "opacity-50")}>
                        {user.isAnonymous ? <User className="h-12 w-12" /> : getInitials(user.displayName)}
                    </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                   {isUploading ? <Loader2 className="h-8 w-8 animate-spin text-white" /> : <Camera className="h-8 w-8 text-white" />}
                </div>
            </div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                className="hidden"
                accept="image/*"
                disabled={isUploading}
            />

            <div className="flex items-center gap-2 pt-4">
              <CardTitle>{user.isAnonymous ? 'Anonymous User' : `@${user.displayName}`}</CardTitle>
              {!user.isAnonymous && (
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
                      <DialogTitle>Edit Username</DialogTitle>
                      <DialogDescription>
                        Make changes to your display name here. Click save when
                        you're done.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="username" className="text-right">
                          Username
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
              )}
            </div>
            <CardDescription>{user.isAnonymous ? 'Sign up to set a display name and save your data.' : user.email}</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">

            {!user.isAnonymous && (
              <>
                {/* Bio Section */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="bio-content" className="text-sm font-medium">Bio</Label>
                        {!isEditingBio && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditingBio(true)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                     {isEditingBio ? (
                        <div className="space-y-2">
                            <Textarea
                                id="bio-content"
                                value={bioContent}
                                onChange={(e) => setBioContent(e.target.value)}
                                placeholder="Tell us a little about yourself..."
                                className="min-h-[80px]"
                                disabled={isBioLoading}
                            />
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" onClick={() => setIsEditingBio(false)} disabled={isBioLoading}>Cancel</Button>
                                <Button onClick={handleBioUpdate} disabled={isBioLoading}>
                                    {isBioLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Bio
                                </Button>
                            </div>
                        </div>
                     ) : (
                        <p className="text-sm text-muted-foreground h-auto p-2 rounded-md">
                            {userProfile?.bio || 'No bio yet. Click the pencil to add one!'}
                        </p>
                     )}
                </div>

                <Separator />

                {/* Stats Section */}
                <div className="space-y-4">
                     <Label className="text-sm font-medium">Statistics</Label>
                     <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-muted/50 p-4 rounded-lg">
                            <MessageSquare className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
                            <p className="text-2xl font-bold">{isMessagesLoading ? '-' : messages.length}</p>
                            <p className="text-xs text-muted-foreground">Bottles Sent</p>
                        </div>
                        <div className="bg-muted/50 p-4 rounded-lg">
                            <Calendar className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
                             <p className="text-2xl font-bold">
                                {isMessagesLoading ? '-' : firstMessageDate ? format(firstMessageDate, 'd') : 'N/A'}
                                <span className='text-lg font-medium'>{isMessagesLoading ? '' : firstMessageDate ? format(firstMessageDate, ' MMM') : ''}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">First Voyage</p>
                        </div>
                     </div>
                </div>

                <Separator />
              </>
            )}

            {/* Links Section */}
            <div className="space-y-1">
                 <Link
                    href="/history"
                    className="flex items-center justify-between p-3 rounded-md transition-colors hover:bg-muted/50"
                    >
                    <div className="flex items-center gap-4">
                        <History className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium">History</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
                <Link
                    href="/about"
                    className="flex items-center justify-between p-3 rounded-md transition-colors hover:bg-muted/50"
                    >
                    <div className="flex items-center gap-4">
                        <Info className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium">About</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
                {user.isAnonymous ? (
                    <Button asChild className="w-full mt-4">
                      <Link href="/auth">
                          Sign In
                      </Link>
                    </Button>
                ) : (
                    <div
                        className="flex items-center justify-between p-3 rounded-md transition-colors hover:bg-muted/50 cursor-pointer"
                        onClick={handleSignOut}
                    >
                        <div className="flex items-center gap-4">
                            <LogOut className="h-5 w-5 text-destructive" />
                            <span className="text-sm font-medium text-destructive">Sign Out</span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                 )}
            </div>

          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function ProfilePage() {
  return <ProfilePageContent />;
}

    