'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, CheckCircle, Loader2, Send } from 'lucide-react';
import { addFeedback } from '@/lib/data';
import { useUser } from '@/firebase';
import { siteConfig } from '@/lib/site-config';

const TOPICS = [
  { value: 'report', label: 'Report a message' },
  { value: 'removal', label: 'Ask for a message to be removed' },
  { value: 'privacy', label: 'Privacy request' },
  { value: 'copyright', label: 'Copyright complaint' },
  { value: 'bug', label: 'Report a bug' },
  { value: 'suggestion', label: 'Suggestion' },
  { value: 'other', label: 'Something else' },
] as const;

const ContactSchema = z.object({
  topic: z.string().min(1, 'Pick what this is about.'),
  // Optional: someone reporting a message may not want to identify themselves.
  email: z
    .string()
    .trim()
    .email('That does not look like an email address.')
    .max(254, 'That email address is too long.')
    .optional()
    .or(z.literal('')),
  message: z
    .string()
    .trim()
    .min(20, 'Please give a bit more detail — at least 20 characters.')
    .max(4000, 'Please keep this under 4000 characters.'),
});

/** One submission per five minutes per browser. */
const COOLDOWN_MS = 5 * 60 * 1000;
const COOLDOWN_KEY = 'miab_contact_last_sent';
/** A genuine reader takes longer than this to read the form and type. */
const MIN_FILL_MS = 3000;

type Status =
  | { kind: 'idle' }
  | { kind: 'error'; message: string }
  | { kind: 'sent' };

export function ContactForm() {
  const { user, isUserLoading } = useUser();
  const [isPending, startTransition] = useTransition();

  const [topic, setTopic] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  // Bot traps: a field no human sees, and a minimum time on the form.
  const [botField, setBotField] = useState('');
  const mountedAt = useRef<number>(Date.now());

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setStatus({ kind: 'idle' });

    // Silently accept-and-drop anything that trips a bot trap: reporting the
    // reason back would just teach a scraper how to get around it. Nothing is
    // written, and the user-visible state stays idle rather than claiming
    // success.
    if (botField.trim() !== '') return;
    if (Date.now() - mountedAt.current < MIN_FILL_MS) {
      setStatus({
        kind: 'error',
        message: 'That was very quick — please take a moment and try again.',
      });
      return;
    }

    const parsed = ContactSchema.safeParse({ topic, email, message });
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors as Record<string, string[]>);
      return;
    }

    try {
      const last = window.localStorage.getItem(COOLDOWN_KEY);
      if (last && Date.now() - Number(last) < COOLDOWN_MS) {
        const mins = Math.ceil(
          (COOLDOWN_MS - (Date.now() - Number(last))) / 60000
        );
        setStatus({
          kind: 'error',
          message: `You've just sent one. Please wait about ${mins} minute${mins === 1 ? '' : 's'}, or email directly.`,
        });
        return;
      }
    } catch {
      // Storage unavailable — carry on without the cooldown.
    }

    if (isUserLoading || !user) {
      setStatus({
        kind: 'error',
        message: 'Still starting up — give it a second and try again.',
      });
      return;
    }

    startTransition(async () => {
      try {
        const topicLabel =
          TOPICS.find((t) => t.value === parsed.data.topic)?.label ??
          parsed.data.topic;

        // The reply address is written into the body as well as being passed
        // through, so it shows up in the operator's existing feedback view
        // rather than being stored somewhere he never looks.
        const replyLine = parsed.data.email
          ? `Reply to: ${parsed.data.email}`
          : 'Reply to: (not provided)';

        await addFeedback(
          `[${topicLabel}]\n${replyLine}\n\n${parsed.data.message}`,
          parsed.data.topic,
          user.uid
        );

        try {
          window.localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
        } catch {
          /* best effort */
        }

        setStatus({ kind: 'sent' });
        setMessage('');
        setEmail('');
        setTopic('');
      } catch (err) {
        console.error('Contact submission failed:', err);
        setStatus({
          kind: 'error',
          // No raw error text — it would leak Firestore internals.
          message:
            'That did not go through. Please email directly instead so your message is not lost.',
        });
      }
    });
  };

  if (status.kind === 'sent') {
    return (
      <div
        role="status"
        className="mt-4 rounded-20px border border-border bg-muted/40 p-6"
      >
        <div className="flex items-start gap-3">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-foreground">Message received.</p>
            <p className="text-muted-foreground">
              It has been saved to the site&apos;s feedback log, which only{' '}
              {siteConfig.operator} can read. It is not sent as an email, so if
              you need a guaranteed reply, write to{' '}
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                className="underline hover:text-foreground"
              >
                {siteConfig.contactEmail}
              </a>{' '}
              as well.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatus({ kind: 'idle' })}
            >
              Send another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="contact-topic">What is this about?</Label>
        <Select value={topic} onValueChange={setTopic}>
          <SelectTrigger id="contact-topic" aria-describedby="contact-topic-error">
            <SelectValue placeholder="Choose a topic" />
          </SelectTrigger>
          <SelectContent>
            {TOPICS.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.topic && (
          <p id="contact-topic-error" className="text-sm text-destructive">
            {errors.topic.join(' ')}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-email">
          Your email{' '}
          <span className="font-normal text-muted-foreground">
            (optional — needed only if you want a reply)
          </span>
        </Label>
        <Input
          id="contact-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-describedby="contact-email-hint contact-email-error"
          disabled={isPending}
        />
        <p id="contact-email-hint" className="text-xs text-muted-foreground">
          Stored with your message and used only to reply. See the{' '}
          <Link href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>
        {errors.email && (
          <p id="contact-email-error" className="text-sm text-destructive">
            {errors.email.join(' ')}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-message">Your message</Label>
        <Textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={7}
          placeholder="If you're reporting or asking to remove a message, please paste its link."
          aria-describedby="contact-message-error"
          disabled={isPending}
        />
        {errors.message && (
          <p id="contact-message-error" className="text-sm text-destructive">
            {errors.message.join(' ')}
          </p>
        )}
      </div>

      {/* Honeypot. Hidden from sight and from assistive tech, and skipped in
          the tab order, so only an automated filler will populate it. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="contact-website">Leave this field empty</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={botField}
          onChange={(e) => setBotField(e.target.value)}
        />
      </div>

      {status.kind === 'error' && (
        <p
          role="alert"
          className="flex items-start gap-2 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {status.message}
        </p>
      )}

      <Button type="submit" disabled={isPending || isUserLoading}>
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Send className="mr-2 h-4 w-4" />
        )}
        Send message
      </Button>
    </form>
  );
}
