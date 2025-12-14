'use client';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { getFeedback, type Feedback } from '@/lib/data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const FEEDBACK_PER_PAGE = 10;

export default function AdminFeedbackPage() {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(
    null
  );
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchFeedback() {
      setIsLoading(true);
      try {
        const fetchedFeedback = await getFeedback();
        setFeedbackList(fetchedFeedback);
      } catch (error) {
        console.error('Failed to fetch feedback:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFeedback();
  }, []);

  const totalPages = Math.ceil(feedbackList.length / FEEDBACK_PER_PAGE);
  const currentFeedback = feedbackList.slice(
    (currentPage - 1) * FEEDBACK_PER_PAGE,
    currentPage * FEEDBACK_PER_PAGE
  );

  const handleRowClick = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setIsViewDialogOpen(true);
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
  
  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'bug':
        return 'destructive';
      case 'suggestion':
        return 'secondary';
      default:
        return 'outline';
    }
  };


  return (
    <>
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Feedback</h1>
        </div>
        <Card className="flex flex-1 flex-col">
          <CardHeader>
            <CardTitle>User Feedback</CardTitle>
            <CardDescription>
              Browse all feedback submitted by users.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {isLoading ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: FEEDBACK_PER_PAGE }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentFeedback.map((fb) => (
                    <TableRow
                      key={fb.id}
                      onClick={() => handleRowClick(fb)}
                      className="cursor-pointer"
                    >
                      <TableCell>
                        <Badge variant={getBadgeVariant(fb.type)} className="capitalize">{fb.type}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[250px] truncate md:max-w-md">
                        {fb.content}
                      </TableCell>
                      <TableCell className="text-right">
                        {fb.timestamp
                          ? format(fb.timestamp, 'MMM d, yyyy')
                          : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {feedbackList.length === 0 && !isLoading && (
              <div className="p-8 text-center text-muted-foreground">
                No feedback submitted yet.
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

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge variant={getBadgeVariant(selectedFeedback?.type ?? '')} className="capitalize">{selectedFeedback?.type}</Badge>
              Feedback Details
            </DialogTitle>
          </DialogHeader>
          {selectedFeedback && (
            <div className="grid gap-4 py-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Date Submitted</p>
                <p className="text-muted-foreground">
                  {selectedFeedback.timestamp ? format(selectedFeedback.timestamp, "MMM d, yyyy 'at' h:mm a") : 'N/A'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Feedback</p>
                <p className="text-muted-foreground">{selectedFeedback.content}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Sender ID</p>
                <p className="text-muted-foreground text-xs">{selectedFeedback.senderId || 'Anonymous'}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
