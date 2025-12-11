
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
  CheckCircle,
  AlertCircle,
  Camera,
  Brush,
  X,
  Undo,
  Redo,
} from 'lucide-react';
import { Card, CardContent } from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { addMessage } from '@/lib/data';
import { z } from 'zod';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

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
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const [isPending, startTransition] = useTransition();
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [formState, setFormState] = useState<{
    success: boolean;
    message?: string;
    recipient?: string;
    errors?: { recipient?: string[]; message?: string[] };
  }>({ success: false });

  const [modalContent, setModalContent] = useState<'camera' | 'draw' | null>(
    null
  );

  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);

  // Sketch state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#000000');
  const [penSize, setPenSize] = useState(2);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

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

    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [getCanvasContext, penColor, penSize]);

  // Effect for handling camera logic
  useEffect(() => {
    let stream: MediaStream | null = null;
  
    const requestCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
        setModalContent(null);
      }
    };
  
    if (modalContent === 'camera') {
      requestCamera();
    }
  
    // Cleanup function to stop camera stream
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const currentStream = videoRef.current.srcObject as MediaStream;
        currentStream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [modalContent, toast]);


  useEffect(() => {
    if (modalContent === 'draw') {
        const handleResize = () => {
            setupCanvas();
            restoreCanvas();
        };
        window.addEventListener('resize', handleResize);
        setTimeout(handleResize, 0); // Initial setup

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


  const handleModalOpen = (type: 'camera' | 'draw') => {
    setModalContent(type);
    if (type === 'draw') {
      // Initialize history for drawing
      setHistory([]);
      setHistoryIndex(-1);
    }
  };

  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        setPhoto(canvas.toDataURL('image/jpeg'));
      }
      setModalContent(null);
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
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing || !canvasRef.current) return;
    e.preventDefault();
    const ctx = getCanvasContext();
    if (!ctx) return;
    const { offsetX, offsetY } = getEventCoordinates(e);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    const ctx = getCanvasContext();
    if (!ctx) return;
    ctx.closePath();
    setIsDrawing(false);
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormState({ success: false });

    if (!user) {
      setFormState({
        success: false,
        message: 'You must be signed in to send a message.',
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
        await addMessage(
          validatedFields.data.message,
          validatedFields.data.recipient,
          user.uid,
          photo ?? undefined
        );
        setFormState({
          success: true,
          recipient: validatedFields.data.recipient,
        });
        setRecipient('');
        setMessage('');
        setPhoto(null);
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
  };

  const penSizes = [1, 2, 4, 8, 16];
  const colors = [
    '#000000',
    '#EF4444',
    '#3B82F6',
    '#22C55E',
    '#A855F7',
    '#EAB308',
  ];

  return (
    <div className="mx-auto mt-8 max-w-xl">
      <Card className="rounded-30px">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="recipient">This letter is for:</Label>
              <Input
                id="recipient"
                name="recipient"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="e.g., Mike"
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
              <Label htmlFor="message">Your Anonymous Message</Label>
              <Textarea
                id="message"
                name="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="write something..."
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

            <div className="space-y-4">
              <Label>You can send them a Snap or Sketch</Label>
              {photo ? (
                <div className="relative">
                  <Image
                    src={photo}
                    alt="Attached photo"
                    width={200}
                    height={200}
                    className="w-full rounded-md object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => setPhoto(null)}
                    className="absolute top-2 right-2"
                    aria-label="Remove photo"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleModalOpen('camera')}
                    disabled={isPending || isUserLoading}
                  >
                    <Camera className="mr-2" /> Take Photo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleModalOpen('draw')}
                    disabled={isPending || isUserLoading}
                  >
                    <Brush className="mr-2" /> Draw
                  </Button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="submit"
                className="w-full flex-1"
                disabled={isPending || isUserLoading}
              >
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

      <Dialog
        open={!!modalContent}
        onOpenChange={(open) => !open && setModalContent(null)}
      >
        <DialogContent
          className={
            modalContent === 'draw'
              ? 'w-[90vw] max-w-md rounded-30px'
              : 'w-[90vw] max-w-md rounded-30px'
          }
        >
          {modalContent === 'camera' && (
            <>
              <DialogHeader>
                <DialogTitle>Take a Photo</DialogTitle>
              </DialogHeader>
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full aspect-[4/3] rounded-md bg-black object-cover"
                  autoPlay
                  muted
                  playsInline
                />
                {!hasCameraPermission && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <p className="text-white">Waiting for camera permission...</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={handleCapture} disabled={!hasCameraPermission}>
                  Capture
                </Button>
              </DialogFooter>
            </>
          )}
          {modalContent === 'draw' && (
            <>
              <DialogHeader>
                <DialogTitle>Create a Sketch</DialogTitle>
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
                <div className="flex w-full flex-wrap items-center justify-center gap-4">
                  <div className="flex items-center flex-wrap justify-center gap-2">
                    <Label className="text-sm">Color:</Label>
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setPenColor(color)}
                        className={`h-6 w-6 rounded-full border-2 ${
                          penColor === color
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
                  <div className="flex items-center flex-wrap justify-center gap-2">
                    <Label className="text-sm">Size:</Label>
                    {penSizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setPenSize(size)}
                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                          penSize === size
                            ? 'border-primary bg-muted'
                            : 'border-transparent'
                        }`}
                      >
                        <div
                          className="rounded-full bg-black"
                          style={{
                            width: `${size + 2}px`,
                            height: `${size + 2}px`,
                          }}
                        ></div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-4 sm:justify-center">
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

    