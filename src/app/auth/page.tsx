
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Header } from '@/components/Header';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

function generateUsername(email: string) {
    const namePart = email.split('@')[0];
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `${namePart}${randomSuffix}`;
}

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path
        d="M12.48 10.92v3.28h7.84c-.24 1.84-.854 3.18-1.734 4.02-1.087 1.087-2.356 1.95-4.56 1.95-5.48 0-9.92-4.44-9.92-9.92s4.44-9.92 9.92-9.92c2.955 0 5.12 1.255 6.55 2.6L21.5 4.3C19.333 2.2 16.355 1 12.48 1 5.825 1 1.05 5.825 1.05 12.48s4.775 11.48 11.43 11.48c3.48 0 6.3-1.24 8.24-3.18 2.087-2.086 2.87-5.02 2.87-7.75v-.02H12.48z"
        fill="currentColor"
        />
    </svg>
);


function AuthPageContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const auth = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Authentication service not available.',
      });
      setIsLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/profile');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description:
          error.code === 'auth/invalid-credential'
            ? 'Invalid email or password.'
            : 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!username.trim()) {
        toast({
            variant: 'destructive',
            title: 'Username is required.',
        });
        setIsLoading(false);
        return;
    }

    if (password.length < 8) {
      toast({
          variant: 'destructive',
          title: 'Password Too Short',
          description: 'Your password must be at least 8 characters long.',
      });
      setIsLoading(false);
      return;
    }
    
    if (password !== confirmPassword) {
        toast({
            variant: 'destructive',
            title: 'Passwords do not match.',
        });
        setIsLoading(false);
        return;
    }

    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Authentication service not available.',
      });
      setIsLoading(false);
      return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: username.trim() });
        
        toast({
            title: 'Account Created!',
            description: `Welcome, ${username.trim()}! You are now signed in.`,
        });
        router.push('/profile');
    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: error.code === 'auth/email-already-in-use' ? 'This email is already associated with an account.' : 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    if (!auth) {
        toast({ variant: 'destructive', title: 'Authentication service not available.' });
        setIsGoogleLoading(false);
        return;
    }
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);

        // If the user is new and doesn't have a display name set, use their Google name
        if (result.user && !result.user.displayName) {
             const googleName = result.user.providerData?.[0]?.displayName;
             if (googleName) {
                await updateProfile(result.user, { displayName: googleName });
             }
        }

        router.push('/profile');
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Google Sign-In Failed',
            description: 'Could not sign in with Google. Please try again.',
        });
        console.error("Google sign-in error:", error);
    } finally {
        setIsGoogleLoading(false);
    }
  }


  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast({
        variant: 'destructive',
        title: 'Email is required',
        description: 'Please enter your email address to reset your password.',
      });
      return;
    }
    setIsResetLoading(true);

    if (!auth) {
      toast({ variant: 'destructive', title: 'Authentication service not available.' });
      setIsResetLoading(false);
      return;
    }
    
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast({
        title: 'Reset Link Sent',
        description: 'Please check your email for a password reset link.',
      });
      setIsResetDialogOpen(false);
      setResetEmail('');
    } catch (error: any) {
      let errorMessage = 'An error occurred. Please try again.';
      if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No user found with this email address.';
      }
      toast({
        variant: 'destructive',
        title: 'Password Reset Failed',
        description: errorMessage,
      });
    } finally {
      setIsResetLoading(false);
    }
  };

  const AuthFormSeparator = () => (
    <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">OR</span>
        </div>
    </div>
   );

  return (
    <>
    <Header />
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center bg-background px-4">
      <Tabs defaultValue="signin" className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="signin">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Welcome Back</CardTitle>
              <CardDescription>
                Sign in to your account to continue.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSignIn}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-signin">Email</Label>
                  <Input
                    id="email-signin"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading || isGoogleLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signin">Password</Label>
                  <Input
                    id="password-signin"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading || isGoogleLoading}
                  />
                </div>
                 <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </CardContent>
              <CardFooter className="flex-col gap-4">
                <AuthFormSeparator />
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
                    {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-4 w-4" />}
                    Continue with Google
                </Button>

                <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="link" className="p-0 h-auto text-sm">
                        Forgot Password?
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[90vw] sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>
                            Enter your email address and we'll send you a link to reset your password.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="reset-email" className="text-right">
                            Email
                            </Label>
                            <Input
                            id="reset-email"
                            type="email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            className="col-span-3"
                            disabled={isResetLoading}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            onClick={handlePasswordReset}
                            disabled={isResetLoading}
                        >
                            {isResetLoading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Send Reset Link
                        </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Create an Account</CardTitle>
              <CardDescription>
                Enter your details below to get started.
              </CardDescription>
            </CardHeader>
             <form onSubmit={handleSignUp}>
              <CardContent className="space-y-4">
                 <div className="space-y-2">
                  <Label htmlFor="username-signup">Username</Label>
                  <Input
                    id="username-signup"
                    type="text"
                    placeholder="kio"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading || isGoogleLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-signup">Email</Label>
                  <Input
                    id="email-signup"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading || isGoogleLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">Password</Label>
                  <Input
                    id="password-signup"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading || isGoogleLoading}
                  />
                   <p className="text-xs text-muted-foreground">
                    Password must be at least 8 characters long.
                  </p>
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="confirm-password-signup">Confirm Password</Label>
                  <Input
                    id="confirm-password-signup"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading || isGoogleLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign Up
                </Button>
              </CardContent>
              <CardFooter className="flex-col">
                <AuthFormSeparator />
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
                    {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-4 w-4" />}
                    Continue with Google
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
}

export default function AuthPage() {
    return <AuthPageContent />;
}

    