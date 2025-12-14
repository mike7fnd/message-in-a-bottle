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
            setFeedbackType('suggestion');
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
            className="animate-in fade-in-0 duration-500 space-y-12"
            aria-labelledby="about-heading"
          >
            <div className="space-y-2 text-center">
              <h1
                id="about-heading"
                className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl"
              >
                About & Support
              </h1>
              <p className="text-muted-foreground">
                Learn more about the project and how you can contribute.
              </p>
            </div>
            
            <Card>
              <CardHeader className="items-center text-center">
                <Heart className="h-12 w-12 text-red-500" />
                <CardTitle>Support the Developers</CardTitle>
                <CardDescription>
                  Your contribution helps us maintain and improve this
                  application. Every little bit helps!
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center p-6">
                <Button asChild size="lg">
                  <Link href="https://buymeacoffee.com/dvbmike" target="_blank" rel="noopener noreferrer">Donate Now</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
                <CardHeader className="items-center text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                        <MessageSquare />
                        Leave a Feedback
                    </CardTitle>
                    <CardDescription>
                        Have a suggestion or found a bug? Let us know!
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                         <div className="space-y-4 text-center">
                            <Label>What's on your mind?</Label>
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
                                    'cursor-pointer rounded-lg border-2 p-4 transition-colors',
                                    feedbackType === option.value
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-muted bg-transparent text-muted-foreground hover:border-primary/50'
                                    )}
                                >
                                    <RadioGroupItem
                                    value={option.value}
                                    id={`r-${option.value}`}
                                    className="sr-only"
                                    />
                                    <div className="flex flex-col items-center gap-2">
                                        <option.icon className="h-6 w-6" />
                                        <span className="font-semibold">{option.label}</span>
                                    </div>
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
                            />
                        </div>
                        <Button type="submit" disabled={isPending} className="w-full">
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Submit Feedback
                        </Button>
                    </form>
                    {formState.message && (
                        <div className={`mt-4 flex items-center rounded-lg p-3 text-sm ${formState.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
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
