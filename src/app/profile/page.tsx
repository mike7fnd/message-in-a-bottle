
'use client';

import { useState, useTransition, useRef } from 'react';
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
import { Loader2, LogOut, Info, History, ChevronRight, Edit, Camera } from 'lucide-react';
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

function ProfilePageContent() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.displayName || '');
  const [isUpdating, startUpdateTransition] = useTransition();
  const [isUploading, startUploadTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Simple client-side validation for file type and size
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
                toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not update your profile picture.' });
            }
        });
    };
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

  if (!user || user.isAnonymous) {
    return (
      <>
        <Header />
        <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center p-4 text-center">
          <Card className="w-full max-w-sm">
            <CardHeader className="items-center">
              <Image
                src="https://i.ibb.co/GvX9XMwm/bottle-default.png"
                alt="Bottle"
                width={120}
                height={120}
                className="mb-4"
                unoptimized
              />
              <CardTitle>Join the Community</CardTitle>
              <CardDescription>
                Sign in or create an account to view your profile, manage and edit your history, and more.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/auth">Sign In / Sign Up</Link>
              </Button>
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
        <Card>
          <CardHeader className="items-center text-center">
            <div className="relative group">
                <Avatar className="h-24 w-24 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <AvatarImage
                        src={user.photoURL || ''}
                        alt={user.displayName || ''}
                        className={cn(isUploading && "opacity-50")}
                    />
                    <AvatarFallback className={cn(isUploading && "opacity-50")}>
                        {getInitials(user.displayName)}
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
              <CardTitle>@{user.displayName || 'Anonymous'}</CardTitle>
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
            </div>
            <CardDescription>{user.email}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Separator />
            <Link
              href="/history"
              className="block p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <History className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">History</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
            <Separator />
            <Link
              href="/about"
              className="block p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Info className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">About</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
          </CardContent>
          <CardFooter className="mt-2 p-4">
            <Button
              onClick={handleSignOut}
              variant="default"
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}

export default function ProfilePage() {
  return <ProfilePageContent />;
}

    