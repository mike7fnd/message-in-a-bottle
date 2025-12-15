
'use client';
import { useState, useTransition } from 'react';
import { Header } from '@/components/Header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, AlertCircle, CheckCircle, Loader2, Lightbulb, Bug, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { addFeedback } from '@/lib/data';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';


export default function AboutPage() {
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('suggestion');
  const [formState, setFormState] = useState<{ success: boolean; message?: string; errors?: any }>({ success: false });
  const [isPending, startTransition] = useTransition();
  const { user } = useUser();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) {
        setFormState({ success: false, message: "Feedback content cannot be empty." });
        return;
    }
    startTransition(async () => {
        try {
            await addFeedback(feedback, feedbackType, user?.uid);
            setFormState({ success: true, message: "Thank you for your feedback!" });
            setFeedback('');
        } catch (error) {
            console.error(error);
            setFormState({ success: false, message: "Failed to send feedback. Please try again." });
        }
    });
  }

  const feedbackOptions = [
    { value: 'suggestion', label: 'Suggestion', icon: Lightbulb },
    { value: 'bug', label: 'Bug Report', icon: Bug },
    { value: 'other', label: 'Other', icon: HelpCircle },
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
          <section
            id="about"
            className="animate-in fade-in-0 duration-500 space-y-8"
            aria-labelledby="about-heading"
          >
            <Card>
              <CardHeader className="items-center text-center">
                <Heart className="h-12 w-12 text-primary" />
                <CardTitle>Support the Developers</CardTitle>
                <CardDescription>
                  Your contribution helps us maintain and improve this
                  application. Every little bit helps!
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center p-6 pt-0">
                <Button asChild size="lg">
                  <Link href="https://buymeacoffee.com/dvbmike" target="_blank" rel="noopener noreferrer">Donate Now</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
                <CardHeader className="items-center text-center">
                    <MessageSquare className="h-12 w-12 text-primary" />
                    <CardTitle>
                        Leave Feedback
                    </CardTitle>
                    <CardDescription>
                        Have a suggestion or found a bug? Let us know!
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                         <div className="space-y-4">
                            <Label className="text-center block">What's on your mind?</Label>
                            <RadioGroup
                                value={feedbackType}
                                onValueChange={setFeedbackType}
                                className="grid grid-cols-1 gap-4 sm:grid-cols-3"
                            >
                                {feedbackOptions.map((option) => (
                                <Label
                                    key={option.value}
                                    htmlFor={`r-${option.value}`}
                                    className={cn(
                                    'cursor-pointer border-2 p-4 transition-colors flex flex-col items-center gap-2 rounded-30px',
                                    feedbackType === option.value
                                        ? 'border-primary/70 bg-primary/10 text-primary'
                                        : 'border-muted/50 bg-transparent text-muted-foreground hover:bg-muted/50'
                                    )}
                                >
                                    <RadioGroupItem
                                    value={option.value}
                                    id={`r-${option.value}`}
                                    className="sr-only"
                                    />
                                    <option.icon className="h-6 w-6" />
                                    <span className="font-semibold">{option.label}</span>
                                </Label>
                                ))}
                            </RadioGroup>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="feedback-content">Your Feedback</Label>
                            <Textarea 
                                id="feedback-content"
                                placeholder="Tell us what you think..."
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                required
                                className="min-h-[120px]"
                            />
                        </div>
                        <Button type="submit" disabled={isPending} className="w-full">
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Submit Feedback
                        </Button>
                    </form>
                    {formState.message && (
                        <div className={cn(
                            'mt-4 flex items-center rounded-lg p-3 text-sm',
                            formState.success ? 'bg-green-100/50 text-green-800' : 'bg-red-100/50 text-red-800'
                        )}>
                           {formState.success ? <CheckCircle className="mr-2 h-4 w-4" /> : <AlertCircle className="mr-2 h-4 w-4" />}
                           {formState.message}
                        </div>
                    )}
                </CardContent>
            </Card>

          </section>
        </div>
      </main>
    </div>
  );
}
