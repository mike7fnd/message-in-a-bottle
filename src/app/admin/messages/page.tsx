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
  collection,
  getDocs,
  getFirestore,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { format } from 'date-fns';
import { deleteMessage, type Message } from '@/lib/data';
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

const MESSAGES_PER_PAGE = 10;

export default function AdminMessagesPage() {
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchMessages = async () => {
    setIsLoading(true);
    const db = getFirestore();
    try {
      const messagesQuery = query(
        collection(db, 'public_messages'),
        orderBy('timestamp', 'desc')
      );
      const messagesSnapshot = await getDocs(messagesQuery);

      const fetchedMessages: Message[] = messagesSnapshot.docs.map((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp as Timestamp;
        return {
          id: doc.id,
          content: data.content,
          recipient: data.recipient,
          timestamp: timestamp?.toDate(),
          senderId: data.senderId,
          photo: data.photo,
        };
      });
      setAllMessages(fetchedMessages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredData = allMessages.filter(
      (item) =>
        item.content.toLowerCase().includes(lowercasedFilter) ||
        item.recipient.toLowerCase().includes(lowercasedFilter)
    );
    setFilteredMessages(filteredData);
    setTotalPages(Math.ceil(filteredData.length / MESSAGES_PER_PAGE));
    setCurrentPage(1);
  }, [searchTerm, allMessages]);

  const currentMessages = useMemo(() => {
    const startIndex = (currentPage - 1) * MESSAGES_PER_PAGE;
    return filteredMessages.slice(startIndex, startIndex + MESSAGES_PER_PAGE);
  }, [filteredMessages, currentPage]);

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
        setAllMessages(allMessages.filter(m => m.id !== selectedMessage.id));
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
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
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
                  {currentMessages.map((msg) => (
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
            )}
            {filteredMessages.length === 0 && !isLoading && (
              <div className="p-8 text-center text-muted-foreground">
                No messages found.
              </div>
            )}
          </CardContent>
          <div className="flex items-center justify-end space-x-2 border-t p-4">
            {isLoading ? (
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
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
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
