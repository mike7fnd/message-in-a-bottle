
'use client';

import { useState, useEffect, useTransition, useMemo, memo } from 'react';
import { getMessagesForUser, editMessage, type Message, deleteMessage } from '@/lib/data';
import { useUser } from '@/firebase';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { Trash2, Edit, Loader2, History, X, MoreVertical, ChevronLeft } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useRecipientContext } from '@/context/RecipientContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const HistoryPageContent = memo(function HistoryPageContent() {
  const { user, isUserLoading } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [isEditPending, startEditTransition] = useTransition();
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [messageToEdit, setMessageToEdit] = useState<Message | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const { refreshRecipients } = useRecipientContext();
  const [activeTab, setActiveTab] = useState('today');
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      getMessagesForUser(user.uid)
        .then(setMessages)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else if (!isUserLoading) {
      setIsLoading(false);
      setMessages([]);
    }
  }, [user, isUserLoading]);

  const filteredMessages = useMemo(() => {
    if (!messages) return [];

    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    return messages.filter(message => {
        const timestamp = new Date(message.timestamp);
        if (timestamp < fiveDaysAgo) {
            return false; // Exclude messages older than 5 days
        }

        if (activeTab === 'today') {
            return isToday(timestamp);
        }
        if (activeTab === 'yesterday') {
            return isYesterday(timestamp);
        }
        if (activeTab === 'past') {
            return !isToday(timestamp) && !isYesterday(timestamp);
        }
        return false;
    });
  }, [messages, activeTab]);

  const handleDelete = () => {
    if (!messageToDelete) return;

    startDeleteTransition(async () => {
      try {
        await deleteMessage(messageToDelete.id);
        setMessages((prev) => prev.filter((m) => m.id !== messageToDelete.id));
        refreshRecipients();
      } catch (error) {
        console.error(error);
      } finally {
        setMessageToDelete(null);
      }
    });
  };

  const handleEdit = () => {
    if (!messageToEdit) return;

    setEditingMessageId(messageToEdit.id);
    startEditTransition(async () => {
      const success = await editMessage(messageToEdit.id, editedContent);
      if (success) {
        setMessages(prev => prev.map(m => m.id === messageToEdit.id ? {...m, content: editedContent} : m));
      } else {
        console.error('Failed to save the message.');
      }
      setEditingMessageId(null);
      setMessageToEdit(null);
      setEditedContent('');
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
            <div className="flex justify-between items-center">
                <div className='space-y-2'>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
  
  const renderMessageList = (list: Message[]) => {
    if (list.length > 0) {
        return list.map((message) => {
          const isBeingEdited = editingMessageId === message.id;
          const isBeingDeleted = isDeletePending && messageToDelete?.id === message.id;
          return (
            <Card key={message.id} className={cn("relative transition-opacity", (isBeingEdited || isBeingDeleted) && "opacity-50 pointer-events-none")}>
              {(isBeingEdited || isBeingDeleted) && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 rounded-lg">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}
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
          );
        });
    }
    
    if (isLoading || isUserLoading) {
      return renderSkeleton();
    }
    
    return (
        <Card className="text-center p-8">
            <History className="mx-auto h-12 w-12 text-muted-foreground" />
            <CardTitle className="mt-4">No Messages Found</CardTitle>
            <CardDescription className="mt-2">There are no messages for this time period.</CardDescription>
        </Card>
    );
  };

  if (!user && !isUserLoading) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <Header />
        <main className="flex-1">
          <div className="container mx-auto max-w-5xl px-4 py-8 md:py-16">
            <Card className="text-center p-8">
              <History className="mx-auto h-12 w-12 text-muted-foreground" />
              <CardTitle className="mt-4">Anonymous User</CardTitle>
              <CardDescription className="mt-2">Sign in to track and manage your sent messages.</CardDescription>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-dvh flex-col bg-background">
        <Header />
        <main className="flex-1">
          <div className="container mx-auto max-w-5xl px-4 py-8 md:py-16">
            <section aria-labelledby="history-heading">
               <div className="mb-4">
                <Button
                  variant="link"
                  onClick={() => router.push('/profile')}
                  className="pl-0 text-muted-foreground"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back to Profile
                </Button>
              </div>
              <div className="space-y-2 text-center">
                <h2 id="history-heading" className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">
                  Your Recent History
                </h2>
                <p className="text-muted-foreground">
                  Messages you've sent in the last 5 days.
                </p>
              </div>

             <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="today">Today</TabsTrigger>
                  <TabsTrigger value="yesterday">Yesterday</TabsTrigger>
                  <TabsTrigger value="past">Past Days</TabsTrigger>
                </TabsList>
                <TabsContent value="today" className="mt-6 space-y-4">
                  {renderMessageList(filteredMessages)}
                </TabsContent>
                <TabsContent value="yesterday" className="mt-6 space-y-4">
                  {renderMessageList(filteredMessages)}
                </TabsContent>
                <TabsContent value="past" className="mt-6 space-y-4">
                  {renderMessageList(filteredMessages)}
                </TabsContent>
              </Tabs>
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
            <AlertDialogAction onClick={handleDelete} disabled={isDeletePending}>
              {isDeletePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={!!messageToEdit} onOpenChange={(open) => !open && setMessageToEdit(null)}>
        <DialogContent className="w-[90vw] max-w-md">
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
            <Button onClick={handleEdit} disabled={isEditPending}>
              {isEditPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

export default function HistoryPage() {
    return <HistoryPageContent />;
}
