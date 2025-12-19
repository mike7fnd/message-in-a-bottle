

'use client';

import { useState, useEffect, useTransition } from 'react';
import { getMessagesForUser, deleteMessage, editMessage, type Message } from '@/lib/data';
import { useUser } from '@/firebase';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, Edit, Loader2, History, X, MoreVertical } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useRecipientContext } from '@/context/RecipientContext';

export default function HistoryPage() {
  const { user, isUserLoading } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [messageToEdit, setMessageToEdit] = useState<Message | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const { toast } = useToast();
  const { refreshRecipients } = useRecipientContext();

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      getMessagesForUser(user.uid)
        .then(setMessages)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else if (!isUserLoading) {
      // Handles the case where user is null after loading
      setIsLoading(false);
      setMessages([]);
    }
  }, [user, isUserLoading]);

  const handleDelete = () => {
    if (!messageToDelete) return;

    startTransition(async () => {
      try {
        await deleteMessage(messageToDelete.id);
        setMessages((prev) => prev.filter((m) => m.id !== messageToDelete.id));
        refreshRecipients(); // Trigger a refresh of the browse page data
        toast({ title: 'Message deleted successfully.' });
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to delete the message.',
        });
      } finally {
        setMessageToDelete(null);
      }
    });
  };

  const handleEdit = () => {
    if (!messageToEdit) return;

    startTransition(async () => {
        try {
            await editMessage(messageToEdit.id, editedContent);
            setMessages(prev => prev.map(m => m.id === messageToEdit.id ? {...m, content: editedContent} : m));
            refreshRecipients(); // Trigger a refresh of the browse page data
            toast({ title: 'Message updated successfully.' });
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to update the message.',
            });
        } finally {
            setMessageToEdit(null);
            setEditedContent('');
        }
    });
  };

  const openEditDialog = (message: Message) => {
    setMessageToEdit(message);
    setEditedContent(message.content);
  }

  const renderSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-1/4 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full" />
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  return (
    <>
      <div className="flex min-h-dvh flex-col bg-background">
        <Header />
        <main className="flex-1">
          <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
            <section aria-labelledby="history-heading">
              <div className="space-y-2 text-center">
                <h2 id="history-heading" className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">
                  Your Recent History
                </h2>
                <p className="text-muted-foreground">
                  Messages you've sent in the last 5 days.
                </p>
              </div>

              <div className="mt-8 space-y-4">
                {isLoading || isUserLoading ? renderSkeleton() : (
                  messages.length > 0 ? (
                    messages.map((message) => (
                      <Card key={message.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <CardTitle className="capitalize">
                                For: {message.recipient}
                                </CardTitle>
                                <CardDescription>
                                Sent {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                                </CardDescription>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
                                        <MoreVertical className="h-4 w-4" />
                                        <span className="sr-only">Message options</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => openEditDialog(message)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        <span>Edit</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setMessageToDelete(message)} className="text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>Delete</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="line-clamp-3 italic text-muted-foreground">"{message.content}"</p>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card className="text-center p-8">
                        <History className="mx-auto h-12 w-12 text-muted-foreground" />
                        <CardTitle className="mt-4">No recent messages</CardTitle>
                        <CardDescription className="mt-2">You haven't sent any messages in the last 5 days.</CardDescription>
                    </Card>
                  )
                )}
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!messageToDelete} onOpenChange={(open) => !open && setMessageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this message.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={!!messageToEdit} onOpenChange={(open) => !open && setMessageToEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Message</DialogTitle>
            <DialogDescription>
                Make changes to your message for <span className="capitalize font-semibold">{messageToEdit?.recipient}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="edit-message">Message</Label>
            <Textarea
                id="edit-message"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={6}
                className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMessageToEdit(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
