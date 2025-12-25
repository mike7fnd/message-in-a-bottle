
'use client';

import { useState, useTransition, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import {
  Loader2,
  Send,
  Camera,
  Brush,
  X,
  Undo,
  Redo,
  Music,
  Plus,
  Copy,
  Link as LinkIcon,
  Search,
  Upload,
  CalendarIcon,
  Eraser,
  SprayCan,
  Pen,
  Share2,
  Instagram,
} from 'lucide-react';
import { Card, CardContent } from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from './ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from './ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import { addMessage } from '@/lib/data';
import { z } from 'zod';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { SendingAnimation } from './SendingAnimation';
import Link from 'next/link';
import { useDebounce } from '@/hooks/use-debounce';
import { Skeleton } from './ui/skeleton';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { type SiteContent } from '@/lib/content';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Slider } from './ui/slider';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { toPng } from 'html-to-image';
import { StoryPreview } from './StoryPreview';
import {
  FacebookShareButton,
  FacebookIcon,
} from 'react-share';


const FormSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty.'),
  recipient: z
    .string()
    .min(1, 'Recipient cannot be empty.')
    .max(50, 'Recipient name is too long.'),
});

interface SpotifyTrack {
    id: string;
    name: string;
    artist: string;
    albumArt: string;
}

type BrushType = 'pen' | 'spray' | 'calligraphy' | 'eraser';


export default function SendMessageForm({ content }: { content: SiteContent }) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const [isPending, startTransition] = useTransition();
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [spotifyTrack, setSpotifyTrack] = useState<SpotifyTrack | null>(null);
  const [openDate, setOpenDate] = useState<Date | undefined>(undefined);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isExtrasOpen, setIsExtrasOpen] = useState(false);
  const [sentMessageId, setSentMessageId] = useState<string | null>(null);
  const [formState, setFormState] = useState<{
    success: boolean;
    message?: string;
    recipient?: string;
    errors?: { recipient?: string[]; message?: string[] };
  }>({ success: false });

  const [modalContent, setModalContent] = useState<'draw' | 'music' | 'share' | null>(
    null
  );

  const { resolvedTheme } = useTheme();

  const extrasContainer = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);


  useGSAP(
    () => {
      if (isExtrasOpen) {
        gsap.fromTo(
          extrasContainer.current,
          { height: 0, opacity: 0, marginTop: 0, y: -20 },
          {
            height: 'auto',
            opacity: 1,
            marginTop: '1rem',
            y: 0,
            duration: 0.8,
            ease: 'elastic.out(1, 0.75)',
          }
        );
      } else {
        gsap.to(extrasContainer.current, {
          height: 0,
          opacity: 0,
          marginTop: 0,
          y: -20,
          duration: 0.3,
          ease: 'power2.in',
        });
      }
    },
    { dependencies: [isExtrasOpen], scope: extrasContainer }
  );

  useEffect(() => {
    try {
      const draft = localStorage.getItem('messageDraft');
      if (draft) {
        const { recipient, message } = JSON.parse(draft);
        setRecipient(recipient || '');
        setMessage(message || '');
      }
    } catch (e) {
        console.error("Failed to parse draft from local storage", e);
    }
  }, []);

  useEffect(() => {
    const draft = JSON.stringify({ recipient, message });
    localStorage.setItem('messageDraft', draft);
  }, [recipient, message]);


  const fileInputRef = useRef<HTMLInputElement>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#000000');
  const [penSize, setPenSize] = useState(5);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const lastPoint = useRef<{ x: number, y: number } | null>(null);

  const [brushType, setBrushType] = useState<BrushType>('pen');

  const [spotifySearchQuery, setSpotifySearchQuery] = useState('');
  const [spotifySearchResults, setSpotifySearchResults] = useState<SpotifyTrack[]>([]);
  const [isSpotifySearching, setIsSpotifySearching] = useState(false);
  const debouncedSpotifySearch = useDebounce(spotifySearchQuery, 300);

  useEffect(() => {
    if (modalContent === 'music' && !debouncedSpotifySearch) {
        setIsSpotifySearching(true);
        fetch(`/api/spotify/featured`)
            .then(res => res.json())
            .then(data => {
                if (data.tracks) {
                    setSpotifySearchResults(data.tracks);
                }
            })
            .catch(console.error)
            .finally(() => setIsSpotifySearching(false));
    }
  }, [modalContent, debouncedSpotifySearch]);

  useEffect(() => {
    if (debouncedSpotifySearch) {
      setIsSpotifySearching(true);
      fetch(`/api/spotify/search?query=${encodeURIComponent(debouncedSpotifySearch)}`)
        .then(res => res.json())
        .then(data => {
            if (data.tracks) {
                setSpotifySearchResults(data.tracks);
            }
        })
        .catch(console.error)
        .finally(() => setIsSpotifySearching(false));
    } else {
        if(modalContent !== 'music') {
          setSpotifySearchResults([]);
        }
    }
  }, [debouncedSpotifySearch, modalContent]);

  const getCanvasContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d', { willReadFrequently: true });
  }, []);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    setHistory((prevHistory) => {
      const newHistory = prevHistory.slice(0, historyIndex + 1);
      newHistory.push(dataUrl);
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
  }, [historyIndex]);

  const restoreCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (!canvas || !ctx || !history[historyIndex]) return;

    const img = new window.Image();
    img.src = history[historyIndex];
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const dpr = window.devicePixelRatio || 1;
      ctx.drawImage(
        img,
        0,
        0,
        canvas.width / dpr,
        canvas.height / dpr
      );
    };
  }, [getCanvasContext, history, historyIndex]);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (!canvas || !ctx) return;

    const container = canvasContainerRef.current;
    if (container) {
      const { width } = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = width * (3 / 4) * dpr; // Maintain 4:3 aspect ratio
      ctx.scale(dpr, dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${width * (3 / 4)}px`;
    }

  }, [getCanvasContext]);

  useEffect(() => {
    if (modalContent === 'draw') {
        const handleResize = () => {
            setupCanvas();
            restoreCanvas();
        };
        window.addEventListener('resize', handleResize);
        setTimeout(handleResize, 0);

        if (history.length === 0) {
          setTimeout(() => {
            const canvas = canvasRef.current;
            const ctx = getCanvasContext();
            if (canvas && ctx) {
              ctx.fillStyle = 'white';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              saveToHistory();
            }
          }, 100);
        }

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }
  }, [modalContent, setupCanvas, restoreCanvas, history.length, saveToHistory, getCanvasContext]);


  const handleModalOpen = (type: 'draw' | 'music' | 'share') => {
    setModalContent(type);
    if (type === 'draw') {
      setHistory([]);
      setHistoryIndex(-1);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getEventCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      if ('touches' in e) {
        return {
          offsetX: e.touches[0].clientX - rect.left,
          offsetY: e.touches[0].clientY - rect.top,
        };
      }
      return {
        offsetX: e.nativeEvent.offsetX,
        offsetY: e.nativeEvent.offsetY,
      };
    }
    return { offsetX: 0, offsetY: 0 };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const ctx = getCanvasContext();
    if (!ctx) return;
    setIsDrawing(true);
    const { offsetX, offsetY } = getEventCoordinates(e);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;

    if (brushType === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = penSize * 2;
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }

    lastPoint.current = { x: offsetX, y: offsetY };
    if (brushType !== 'spray') {
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
    }
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing || !canvasRef.current) return;
    e.preventDefault();
    const ctx = getCanvasContext();
    if (!ctx) return;
    const { offsetX, offsetY } = getEventCoordinates(e);

    if (brushType === 'spray') {
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * 2 * Math.PI;
            const radius = Math.random() * (penSize * 2);
            const x = offsetX + radius * Math.cos(angle);
            const y = offsetY + radius * Math.sin(angle);
            ctx.fillStyle = penColor;
            ctx.globalAlpha = Math.random() * 0.5;
            ctx.fillRect(x, y, 1, 1);
        }
        ctx.globalAlpha = 1.0;
    } else if (brushType === 'calligraphy') {
      if (lastPoint.current) {
        ctx.lineWidth = Math.abs(offsetX - lastPoint.current.x) > Math.abs(offsetY - lastPoint.current.y)
          ? penSize / 3
          : penSize;
      }
      ctx.lineTo(offsetX, offsetY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY);
    } else {
      ctx.lineTo(offsetX, offsetY);
      ctx.stroke();
    }
    lastPoint.current = { x: offsetX, y: offsetY };
  };

  const stopDrawing = () => {
    const ctx = getCanvasContext();
    if (!ctx) return;
    setIsDrawing(false);
    lastPoint.current = null;
    ctx.closePath();
    saveToHistory();
  };

  const handleSaveSketch = () => {
    if (canvasRef.current) {
      setPhoto(canvasRef.current.toDataURL('image/png'));
      setModalContent(null);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1);
    }
  };

  useEffect(() => {
    if (modalContent === 'draw') {
        restoreCanvas();
    }
  }, [historyIndex, restoreCanvas, modalContent]);

  const generateAndShareImage = useCallback(async (shareType: 'native' | 'download') => {
    if (storyRef.current === null) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not capture message card.' });
      return;
    }
    setIsGenerating(true);

    try {
      const dataUrl = await toPng(storyRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        fetchRequestInit: {
          mode: 'cors',
          credentials: 'anonymous',
        },
      });

      if (shareType === 'download') {
        const link = document.createElement('a');
        link.download = `message-for-${recipient}.png`;
        link.href = dataUrl;
        link.click();
        return;
      }

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `message-for-${recipient}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `A message for ${recipient}`,
          text: `I sent a message in a bottle to ${recipient}!`,
        });
      } else {
        toast({ title: "Sharing not supported", description: "Your browser doesn't support direct image sharing. Please download the image instead." });
      }
    } catch (err) {
      console.error("Error generating image:", err);
      toast({
        variant: 'destructive',
        title: 'Oops!',
        description: 'Could not generate or share image. Please try again.',
      });
    } finally {
        setIsGenerating(false);
    }
  }, [recipient, message, toast]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormState({ success: false });

    if (isUserLoading) {
      setFormState({
        success: false,
        message: 'Initializing session, please wait...',
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
        const messageId = await addMessage(
          validatedFields.data.message,
          validatedFields.data.recipient,
          user?.uid,
          photo ?? undefined,
          spotifyTrack?.id ?? undefined,
          openDate,
        );
        setShowSuccess(true);
        setSentMessageId(messageId);
        setMessage('');
        localStorage.removeItem('messageDraft');
        setPhoto(null);
        setSpotifyTrack(null);
        setOpenDate(undefined);
        setIsExtrasOpen(false);
        router.refresh();
      } catch (error) {
        console.error('Error sending message:', error);
        setFormState({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : 'An unknown error occurred.',
        });
      }
    });
  }

  const resetForm = () => {
    setShowSuccess(false);
    setSentMessageId(null);
    setRecipient('');
    setMessage('');
  }

  const handleCopyLink = () => {
    if (!sentMessageId) return;
    const link = `${window.location.origin}/message/${sentMessageId}`;
    navigator.clipboard.writeText(link);
    toast({
        title: "Link Copied!",
        description: "The message link has been copied to your clipboard.",
    });
  }

  const colors = [
    '#000000',
    '#EF4444',
    '#3B82F6',
    '#22C55E',
    '#A855F7',
    '#EAB308',
  ];

  const successImage = resolvedTheme === 'dark' ? content.sendSuccessImageDark : content.sendSuccessImageLight;

  if (showSuccess && sentMessageId) {
    return (
        <div className="mx-auto mt-8 max-w-xl">
            <Card className="relative overflow-hidden">
                <CardContent className="p-6 text-center space-y-4">
                    <div className="flex justify-center">
                        {successImage && (
                          <Image
                              src={successImage}
                              alt="Success image"
                              width={128}
                              height={128}
                              className="h-32 w-32 animate-bottle-sent"
                              unoptimized
                          />
                        )}
                    </div>
                    <h3 className="text-2xl font-bold font-headline">{content.sendSuccessTitle}</h3>
                    <p className="text-muted-foreground">{content.sendSuccessDescription}</p>

                    <div className="relative rounded-md bg-muted p-3">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Link href={`/message/${sentMessageId}`} className="block w-full truncate pl-7 text-left text-sm font-mono text-primary hover:underline">
                            {`${window.location.origin}/message/${sentMessageId}`}
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Button onClick={handleCopyLink} className="w-full">
                            <Copy className="mr-2" />
                            {content.sendCopyLinkButton}
                        </Button>
                         <Button variant="secondary" onClick={() => handleModalOpen('share')} className="w-full">
                            <Share2 className="mr-2" />
                            Share to Story
                        </Button>
                         <Button variant="outline" onClick={resetForm} className="w-full col-span-1 sm:col-span-2">
                           <Send className="mr-2" />
                           {content.sendAnotherButton}
                        </Button>
                    </div>
                </CardContent>
            </Card>
             <Dialog open={modalContent === 'share'} onOpenChange={(open) => !open && setModalContent(null)}>
                <DialogContent className="max-w-xs w-[90vw]">
                    <DialogHeader className="text-center">
                        <DialogTitle>Share this Message</DialogTitle>
                        <DialogDescription>
                            Share this bottle on social media or download it.
                        </DialogDescription>
                    </DialogHeader>
                    {/* Hidden component to generate image from */}
                    <div className="absolute top-[-1000px] left-[-1000px]">
                         <StoryPreview ref={storyRef} recipient={recipient} message={message} messageUrl={`${window.location.origin}/message/${sentMessageId}`} />
                    </div>
                    <div className="flex flex-col gap-2 pt-4">
                         <Button
                            onClick={() => generateAndShareImage('native')}
                            disabled={isGenerating}
                        >
                            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Share2 className="mr-2 h-5 w-5" />}
                            Share Message
                        </Button>
                        <Button onClick={() => generateAndShareImage('download')} variant="outline" disabled={isGenerating}>
                          {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2"/>}
                          Download Image
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
  }

  return (
    <div className="mx-auto mt-8 max-w-xl">
      <Card className="relative overflow-hidden">
        {isPending && <SendingAnimation content={content} />}
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="recipient">{content.sendRecipientLabel}</Label>
              <Input
                id="recipient"
                name="recipient"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder={content.sendRecipientPlaceholder}
                required
                disabled={isPending || isUserLoading}
              />
              {formState.errors?.recipient && (
                <p className="text-sm text-red-500">
                  {formState.errors.recipient.join(', ')}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">{content.sendMessageLabel}</Label>
              <Textarea
                id="message"
                name="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={content.sendMessagePlaceholder}
                rows={5}
                required
                disabled={isPending || isUserLoading}
              />
              {formState.errors?.message && (
                <p className="text-sm text-red-500">
                  {formState.errors.message.join(', ')}
                </p>
              )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />

            <div className="flex flex-col gap-2">
              <Collapsible open={isExtrasOpen} onOpenChange={setIsExtrasOpen}>
                  <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full">
                          <Plus className={cn("mr-2 h-4 w-4 transition-transform duration-300", isExtrasOpen && "rotate-45")} />
                          {content.sendAddSomethingButton}
                      </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent asChild>
                    <div ref={extrasContainer} className="h-0 overflow-hidden space-y-4">
                      <div className="space-y-2">
                          {photo && (
                          <div className="relative">
                              <Image
                              src={photo}
                              alt="Attached photo"
                              width={200}
                              height={200}
                              className="w-full rounded-md object-cover"
                              unoptimized
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setPhoto(null)}
                                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background text-foreground shadow-subtle"
                                aria-label="Remove photo"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                          </div>
                          )}
                          <div className="grid grid-cols-2 gap-2">
                              <Button
                              type="button"
                              variant="outline"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isPending || isUserLoading || !!photo}
                              >
                              <Upload className="mr-2" /> {content.sendAttachPhotoButton}
                              </Button>
                              <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleModalOpen('draw')}
                              disabled={isPending || isUserLoading || !!photo}
                              >
                              <Brush className="mr-2" /> {content.sendDrawButton}
                              </Button>
                          </div>
                      </div>

                      <div className="space-y-2">
                         {spotifyTrack ? (
                            <div className="relative">
                               <iframe
                                  data-testid="embed-iframe"
                                  style={{ borderRadius: '12px' }}
                                  src={`https://open.spotify.com/embed/track/${spotifyTrack.id}?utm_source=generator`}
                                  width="100%"
                                  height="152"
                                  frameBorder="0"
                                  allowFullScreen
                                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                  loading="lazy"
                                ></iframe>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setSpotifyTrack(null)}
                                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background text-foreground shadow-subtle"
                                  aria-label="Remove song"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                            </div>
                         ) : (
                            <Sheet open={modalContent === 'music'} onOpenChange={(open) => { if (!open) setModalContent(null) }}>
                                <SheetTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                        disabled={isPending || isUserLoading}
                                        onClick={() => handleModalOpen('music')}
                                    >
                                        <Music className="mr-2" /> {content.sendAddSongButton}
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="bottom" className="w-full max-w-xl mx-auto rounded-t-30px p-0">
                                    <SheetHeader className="p-6 pb-2 text-left">
                                        <SheetTitle>{content.sendMusicTitle}</SheetTitle>
                                    </SheetHeader>
                                    <div className="px-6 relative">
                                        <Search className="absolute left-9 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            placeholder={content.sendMusicPlaceholder}
                                            value={spotifySearchQuery}
                                            onChange={(e) => setSpotifySearchQuery(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                    <div className="space-y-2 max-h-80 overflow-y-auto p-6 pt-2">
                                        {!isSpotifySearching && !debouncedSpotifySearch && spotifySearchResults.length > 0 && (
                                            <h3 className="text-sm font-semibold text-muted-foreground px-2 pt-2">{content.sendFeaturedSongs}</h3>
                                        )}
                                        {isSpotifySearching ? (
                                            Array.from({length: 3}).map((_, i) => (
                                                <div key={i} className="flex items-center gap-4 p-2">
                                                    <Skeleton className="h-10 w-10" />
                                                    <div className="space-y-2">
                                                        <Skeleton className="h-4 w-40" />
                                                        <Skeleton className="h-3 w-24" />
                                                    </div>
                                                </div>
                                            ))
                                        ) : spotifySearchResults.map(track => (
                                            <div
                                                key={track.id}
                                                className="group flex cursor-pointer items-center gap-4 rounded-md p-2 hover:bg-muted"
                                                onClick={() => {
                                                    setSpotifyTrack(track);
                                                    setModalContent(null);
                                                    setSpotifySearchQuery('');
                                                }}
                                            >
                                                <Image src={track.albumArt} alt={track.name} width={40} height={40} className="rounded-sm flex-shrink-0" unoptimized/>
                                                <div className="relative flex-1 overflow-hidden">
                                                    <p className="font-semibold whitespace-nowrap">{track.name}</p>
                                                    <p className="text-sm text-muted-foreground whitespace-nowrap">{track.artist}</p>
                                                    <div className="absolute inset-y-0 right-0 z-10 w-8 bg-popover group-hover:from-muted pointer-events-none"></div>
                                                </div>
                                            </div>
                                        ))}
                                        {!isSpotifySearching && debouncedSpotifySearch && spotifySearchResults.length === 0 && (
                                            <p className="text-center text-sm text-muted-foreground py-4">No results found.</p>
                                        )}
                                    </div>
                                </SheetContent>
                            </Sheet>
                         )}
                      </div>

                       <div className="space-y-2 text-center">
                         <Label>Time Capsule (Optional)</Label>
                         <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-center text-left font-normal",
                                    !openDate && "text-muted-foreground"
                                )}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {openDate ? format(openDate, "PPP") : <span>Set an open date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                mode="single"
                                selected={openDate}
                                onSelect={setOpenDate}
                                disabled={(date) => date < new Date()}
                                initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        {openDate && (
                           <div className="flex justify-center">
                             <Button variant="ghost" size="sm" onClick={() => setOpenDate(undefined)}>
                               <X className="mr-2 h-4 w-4" /> Clear
                             </Button>
                           </div>
                        )}
                       </div>
                    </div>
                  </CollapsibleContent>
              </Collapsible>
              <Button
                type="submit"
                className="w-full"
                disabled={isPending || isUserLoading}
              >
                {isPending || isUserLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {content.sendMessageButton}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog
        open={modalContent === 'draw'}
        onOpenChange={(open) => !open && setModalContent(null)}
      >
        <DialogContent
          className="w-[90vw] max-w-md rounded-30px"
        >
            <>
              <DialogHeader>
                <DialogTitle>{content.sendDrawingTitle}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4">
                 <div ref={canvasContainerRef} className="w-full">
                  <canvas
                    ref={canvasRef}
                    className="cursor-crosshair rounded-md border touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
                <div className="flex w-full flex-col gap-4">
                  <ToggleGroup type="single" value={brushType} onValueChange={(value: BrushType) => value && setBrushType(value)} className="w-full justify-center">
                    <ToggleGroupItem value="pen" aria-label="Pen"><Pen /></ToggleGroupItem>
                    <ToggleGroupItem value="spray" aria-label="Spray"><SprayCan /></ToggleGroupItem>
                    <ToggleGroupItem value="calligraphy" aria-label="Calligraphy"><Brush /></ToggleGroupItem>
                    <ToggleGroupItem value="eraser" aria-label="Eraser"><Eraser /></ToggleGroupItem>
                  </ToggleGroup>

                  <div className="space-y-2">
                    <Label>Size ({penSize}px)</Label>
                    <Slider defaultValue={[penSize]} max={50} step={1} onValueChange={([value]) => setPenSize(value)} />
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setPenColor(color)}
                        className={`h-6 w-6 rounded-full border-2 ${
                          penColor === color && brushType !== 'eraser'
                            ? 'border-primary'
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                        aria-label={`Set color to ${color}`}
                      />
                    ))}
                    <input
                      type="color"
                      value={penColor}
                      onChange={(e) => setPenColor(e.target.value)}
                      className="h-8 w-8 cursor-pointer rounded-full border-none bg-transparent p-0"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-4 flex-col sm:flex-row sm:justify-center">
                <div className="flex flex-wrap justify-center gap-2">
                    <Button
                    variant="outline"
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    >
                    <Undo className="mr-2 h-4 w-4" /> Undo
                    </Button>
                    <Button
                    variant="outline"
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                    >
                    <Redo className="mr-2 h-4 w-4" /> Redo
                    </Button>
                    <Button
                    variant="outline"
                    onClick={() => {
                        const ctx = getCanvasContext();
                        if (ctx && canvasRef.current) {
                        ctx.fillStyle = 'white';
                        ctx.fillRect(
                            0,
                            0,
                            canvasRef.current.width,
                            canvasRef.current.height
                        );
                        saveToHistory();
                        }
                    }}
                    >
                    Clear
                    </Button>
                    <Button onClick={handleSaveSketch}>Save Sketch</Button>
                </div>
              </DialogFooter>
            </>
        </DialogContent>
      </Dialog>
    </div>
  );
}
