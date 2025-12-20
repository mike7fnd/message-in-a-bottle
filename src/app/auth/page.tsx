
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
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2, KeyRound } from 'lucide-react';
import { Header } from '@/components/Header';

function generateUsername(email: string) {
    const namePart = email.split('@')[0];
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `${namePart}${randomSuffix}`;
}

function AuthPageContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
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
        const username = generateUsername(email);
        await updateProfile(userCredential.user, { displayName: username });
        
        toast({
            title: 'Account Created!',
            description: `Welcome, ${username}! You are now signed in.`,
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
                <KeyRound className="mx-auto h-10 w-10 text-primary" />
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
                    disabled={isLoading}
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
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card>
            <CardHeader className="text-center">
              <KeyRound className="mx-auto h-10 w-10 text-primary" />
              <CardTitle>Create an Account</CardTitle>
              <CardDescription>
                Enter your email and password to get started.
              </CardDescription>
            </CardHeader>
             <form onSubmit={handleSignUp}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-signup">Email</Label>
                  <Input
                    id="email-signup"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
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
                    disabled={isLoading}
                  />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="confirm-password-signup">Confirm Password</Label>
                  <Input
                    id="confirm-password-signup"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign Up
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
