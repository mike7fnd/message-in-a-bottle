
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Loader2 } from 'lucide-react';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const auth = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!auth) {
        toast({
            variant: "destructive",
            title: "Authentication service not available",
            description: "Please try again later.",
        });
        setIsLoading(false);
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
        // The redirect to the dashboard will be handled by the AdminLayout's useEffect.
    } catch (error: any) {
      let errorMessage = 'An unexpected error occurred. Please try again.';
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = 'Invalid email or password.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.';
            break;
          default:
            errorMessage = `Failed to process request. Please try again.`;
            break;
        }
      }
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <Shield className="mx-auto h-12 w-12 text-primary" />
            <CardTitle className="mt-2 text-2xl font-bold">Admin Access</CardTitle>
            <CardDescription>
              Please enter your credentials to access the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLoading ? 'Processing...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 text-center">
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
        </Card>
      </div>
    </>
  );
}
