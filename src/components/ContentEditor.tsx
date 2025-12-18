
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { getRawContent, saveContent } from '@/lib/content';
import { useToast } from '@/hooks/use-toast';
import { Code, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ContentEditor() {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError(null);
      getRawContent()
        .then((rawContent) => {
          // Format JSON for better readability
          try {
            const parsed = JSON.parse(rawContent);
            setContent(JSON.stringify(parsed, null, 2));
          } catch {
            setContent(rawContent);
          }
        })
        .catch(() => {
          setError('Failed to load content.');
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not fetch site content.',
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, toast]);

  const handleSave = () => {
    startSaving(async () => {
        try {
            // Test if content is valid JSON
            JSON.parse(content);
        } catch (e) {
            toast({
                variant: 'destructive',
                title: 'Invalid JSON',
                description: 'The content is not valid JSON. Please correct it and try again.',
            });
            return;
        }

        const result = await saveContent(content);
        if (result.success) {
            toast({
                title: 'Content Saved!',
                description: 'Your changes are now live.',
            });
            setIsOpen(false);
            // Force a hard reload to ensure all pages get the new content
            router.refresh();
        } else {
            toast({
                variant: 'destructive',
                title: 'Save Failed',
                description: result.error || 'An unexpected error occurred.',
            });
        }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Code className="mr-2 h-4 w-4" />
          Edit Content
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl w-[90vw] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Site Content Editor</DialogTitle>
          <DialogDescription>
            Directly edit the `site-content.json` file. Changes will be reflected live.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
             <div className="flex items-center justify-center h-full text-destructive">
                <AlertCircle className="mr-2 h-4 w-4" /> {error}
            </div>
          ) : (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="h-full w-full font-mono text-xs resize-none"
              placeholder="Loading content..."
              disabled={isSaving}
            />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
