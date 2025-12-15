
'use client';
import { useEffect, useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  getMessagesPaginated,
  deleteMessage,
  type Message,
} from '@/lib/data';
import { Document } from 'firebase/firestore';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
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
import Image from 'next/image';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDebounce } from '@/hooks/use-debounce';

const MESSAGES_PER_PAGE = 10;

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastVisible, setLastVisible] = useState<Document | null>(null);
  const [firstVisible, setFirstVisible] = useState<Document | null>(null);
  const [page, setPage] = useState(1);
  const [pageHistory, setPageHistory] = useState<(Document | null)[]>([null]);


  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchMessages = async (direction: 'next' | 'prev' | 'new' = 'new') => {
      if (direction !== 'new') {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      
      let lastDoc = lastVisible;
      if (direction === 'prev') {
          // To go previous, we need the document that STARTS the page before the current one
          lastDoc = page > 2 ? pageHistory[page - 2] : null;
      } else if (direction === 'new') {
          lastDoc = null;
      }

      try {
          const { messages: fetchedMessages, lastVisible: newLastVisible } = await getMessagesPaginated(
              MESSAGES_PER_PAGE,
              direction === 'new' ? undefined : lastDoc,
              debouncedSearchTerm || undefined
          );

          setMessages(fetchedMessages);
          
          if (direction === 'next') {
              const newPageHistory = [...pageHistory, newLastVisible];
              setPageHistory(newPageHistory);
              setPage(page + 1);
          } else if (direction === 'prev') {
              setPage(page - 1);
          } else { // new search
              setPage(1);
              setPageHistory([null, newLastVisible]);
          }
          
          setLastVisible(newLastVisible);

      } catch (error) {
          console.error('Failed to fetch messages:', error);
          toast({
              variant: 'destructive',
              title: 'Error Fetching Messages',
              description: 'Could not load messages. Please try again.',
          });
      } finally {
          setIsLoading(false);
          setIsLoadingMore(false);
      }
  };

  // Effect for initial load and search term changes
  useEffect(() => {
    fetchMessages('new');
  }, [debouncedSearchTerm]);


  const handleRowClick = (message: Message) => {
    setSelectedMessage(message);
    setIsViewDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedMessage) {
      try {
        await deleteMessage(selectedMessage.id);
        toast({
          title: 'Message Deleted',
          description: 'The message has been successfully deleted.',
        });
        // Refresh messages list
        fetchMessages('new');
      } catch (error) {
        console.error('Failed to delete message:', error);
        toast({
          variant: 'destructive',
          title: 'Error Deleting Message',
          description: 'Could not delete the message. Please try again.',
        });
      } finally {
        setIsDeleteDialogOpen(false);
        setIsViewDialogOpen(false);
        setSelectedMessage(null);
      }
    }
  };

  const handlePrevious = () => {
    if (page > 1) {
        fetchMessages('prev');
    }
  };

  const handleNext = () => {
      if (lastVisible) {
          fetchMessages('next');
      }
  };

  const SkeletonRow = () => (
    <TableRow>
      <TableCell>
        <Skeleton className="h-5 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-full" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="ml-auto h-5 w-20" />
      </TableCell>
    </TableRow>
  );

  const SkeletonCard = () => (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </CardContent>
    </Card>
  )

  const DesktopView = () => (
     <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Recipient</TableHead>
          <TableHead>Message</TableHead>
          <TableHead className="text-right">Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {messages.map((msg) => (
          <TableRow
            key={msg.id}
            onClick={() => handleRowClick(msg)}
            className="cursor-pointer"
          >
            <TableCell className="font-medium capitalize">
              {msg.recipient}
            </TableCell>
            <TableCell className="max-w-[250px] truncate md:max-w-[400px]">
              {msg.content}
            </TableCell>
            <TableCell className="text-right">
              {msg.timestamp
                ? format(msg.timestamp, 'MMM d, yyyy')
                : 'N/A'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const MobileView = () => (
    <div className="space-y-4">
      {messages.map((msg) => (
        <Card key={msg.id} onClick={() => handleRowClick(msg)} className="cursor-pointer active:bg-muted/50">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <p className="font-medium capitalize text-primary">{msg.recipient}</p>
                <p className="text-muted-foreground">{msg.timestamp ? format(msg.timestamp, 'MMM d') : 'N/A'}</p>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{msg.content}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <>
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Messages</h1>
        </div>
        <Card className="flex flex-1 flex-col">
          <CardHeader>
            <CardTitle>All Sent Messages</CardTitle>
            <CardDescription>
              Browse and search through all public messages.
            </CardDescription>
            <Input
              placeholder="Search by content or recipient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {isLoading ? (
              isMobile ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (<SkeletonCard key={i} />))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: MESSAGES_PER_PAGE }).map((_, i) => (
                      <SkeletonRow key={i} />
                    ))}
                  </TableBody>
                </Table>
              )
            ) : (
              isMobile ? <MobileView /> : <DesktopView />
            )}
            {messages.length === 0 && !isLoading && (
              <div className="p-8 text-center text-muted-foreground">
                No messages found.
              </div>
            )}
          </CardContent>
          <div className="flex items-center justify-end space-x-2 border-t p-4">
            {isLoading || isLoadingMore ? (
              <div className="flex w-full items-center justify-end space-x-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={!lastVisible && messages.length < MESSAGES_PER_PAGE}
                >
                  Next
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* View Message Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="w-[90vw] max-w-md md:max-w-lg lg:max-w-xl">
          <DialogHeader>
            <DialogTitle>Message Details</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <ScrollArea className="max-h-[70vh] w-full">
              <div className="grid gap-4 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Recipient</p>
                  <p className="capitalize text-muted-foreground">{selectedMessage.recipient}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Date Sent</p>
                  <p className="text-muted-foreground">
                    {selectedMessage.timestamp ? format(selectedMessage.timestamp, "MMM d, yyyy 'at' h:mm a") : 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Message</p>
                  <p className="text-muted-foreground break-words">{selectedMessage.content}</p>
                </div>
                {selectedMessage.photo && (
                   <div className="space-y-2">
                      <p className="text-sm font-medium">Attachment</p>
                      <Image src={selectedMessage.photo} alt="Attached photo" width={500} height={500} className="w-full rounded-md border object-contain"/>
                   </div>
                )}
              </div>
            </ScrollArea>
          )}
          <DialogFooter className="border-t pt-4">
             <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
            </Button>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the message from the servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    