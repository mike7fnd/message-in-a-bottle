'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Loader2, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { addMessage } from '@/lib/data';
import { z } from 'zod';
import { useUser } from '@/firebase';

const FormSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty.')
    .max(500, 'Message is too long.'),
  recipient: z
    .string()
    .min(1, 'Recipient cannot be empty.')
    .max(50, 'Recipient name is too long.'),
});

export default function SendMessageForm() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const [isPending, startTransition] = useTransition();
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [formState, setFormState] = useState<{
    success: boolean;
    message?: string;
    recipient?: string;
    errors?: { recipient?: string[]; message?: string[] };
  }>({ success: false });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormState({ success: false }); // Reset state on new submission

    if (!user) {
        setFormState({
            success: false,
            message: 'You must be signed in to send a message.'
        });
        return;
    }

    const validatedFields = FormSchema.safeParse({ recipient, message });
    if (!validatedFields.success) {
      setFormState({
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      });
      return;
    }

    startTransition(async () => {
      try {
        await addMessage(validatedFields.data.message, validatedFields.data.recipient, user.uid);
        
        setFormState({ success: true, recipient: validatedFields.data.recipient });
        setRecipient('');
        setMessage('');
        
        // Revalidate relevant pages
        router.refresh();

      } catch (error) {
        console.error('Error sending message:', error);
        setFormState({
          success: false,
          message:
            error instanceof Error ? error.message : 'An unknown error occurred.',
        });
      }
    });
  };

  return (
    <div className="mx-auto mt-8 max-w-xl">
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient's Name</Label>
              <Input
                id="recipient"
                name="recipient"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="e.g., Alex"
                required
                aria-describedby="recipient-error"
                disabled={isPending || isUserLoading}
              />
              {formState.errors?.recipient && (
                <p id="recipient-error" className="text-sm text-red-500">
                  {formState.errors.recipient.join(', ')}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Your Anonymous Message</Label>
              <Textarea
                id="message"
                name="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write something that will make them smile..."
                rows={5}
                required
                aria-describedby="message-error"
                disabled={isPending || isUserLoading}
              />
              {formState.errors?.message && (
                <p id="message-error" className="text-sm text-red-500">
                  {formState.errors.message.join(', ')}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" className="w-full flex-1" aria-disabled={isPending || isUserLoading} disabled={isPending || isUserLoading}>
                  {isPending || isUserLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                      <Send className="mr-2 h-4 w-4" />
                  )}
                  Send Message
              </Button>
            </div>
          </form>
          {formState.success && (
            <div
              className="mt-4 flex items-center rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700 animate-in fade-in-0"
              role="alert"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              <p>
                Success! Your message was sent to{' '}
                <span className="font-semibold">{formState.recipient}</span>.
              </p>
            </div>
          )}
          {formState.message && !formState.success && (
             <div
             className="mt-4 flex items-center rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 animate-in fade-in-0"
             role="alert"
           >
             <AlertCircle className="mr-2 h-4 w-4" />
             <p>{formState.message}</p>
           </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
