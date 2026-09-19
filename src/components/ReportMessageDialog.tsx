'use client';

import { useState, useTransition } from 'react';
import { Flag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
import { addFeedback } from '@/lib/data';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { siteConfig } from '@/lib/site-config';

/**
 * Lets any reader flag a message for the operator.
 *
 * The site publishes unmoderated writing from anonymous strangers, so a
 * reporting route is not optional — it is what makes the Terms enforceable and
 * gives a named person a way to get a note about them taken down.
 *
 * Reports are written to the same Firestore `feedback` collection the operator
 * already reads at /admin/feedback, so they land somewhere that is actually
 * checked rather than in a new inbox nobody opens.
 */
const REASONS = [
  { value: 'harassment', label: 'Harassment, bullying or threats' },
  { value: 'private-info', label: "Contains someone's private information" },
  { value: 'sexual-minor', label: 'Sexual content involving a minor' },
  { value: 'hate', label: 'Hate speech' },
  { value: 'spam', label: 'Spam or a scam' },
  { value: 'about-me', label: 'This is about me — please remove it' },
  { value: 'other', label: 'Something else' },
] as const;

const REPORT_COOLDOWN_KEY = 'miab_last_report';
const REPORT_COOLDOWN_MS = 60 * 1000;

export function ReportMessageDialog({
  messageId,
  recipient,
}: {
  messageId: string;
  recipient?: string;
}) {
  const { user } = useUser();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError(null);

    if (!reason) {
      setError('Please choose a reason.');
      return;
    }
    if (reason === 'other' && detail.trim().length < 10) {
      setError('Please say a little about what is wrong.');
      return;
    }

    try {
      const last = window.localStorage.getItem(REPORT_COOLDOWN_KEY);
      if (last && Date.now() - Number(last) < REPORT_COOLDOWN_MS) {
        setError('You just sent a report. Please wait a moment.');
        return;
      }
    } catch {
      /* storage unavailable — continue */
    }

    if (!user) {
      setError('Still starting up — please try again in a second.');
      return;
    }

    startTransition(async () => {
      try {
        const label =
          REASONS.find((r) => r.value === reason)?.label ?? reason;
        const url = `${siteConfig.url}/message/${messageId}`;

        await addFeedback(
          [
            `[REPORT] ${label}`,
            `Message: ${url}`,
            recipient ? `Addressed to: ${recipient}` : null,
            detail.trim() ? `\nDetail: ${detail.trim()}` : null,
          ]
            .filter(Boolean)
            .join('\n'),
          'report',
          user.uid
        );

        try {
          window.localStorage.setItem(REPORT_COOLDOWN_KEY, String(Date.now()));
        } catch {
          /* best effort */
        }

        setOpen(false);
        setReason('');
        setDetail('');
        toast({
          title: 'Report sent',
          description:
            'Thank you. This goes straight to the person who runs the site.',
        });
      } catch (err) {
        console.error('Report failed:', err);
        setError(
          'That did not go through. Please email ' +
            siteConfig.contactEmail +
            ' with the link instead.'
        );
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Report this message"
          title="Report this message"
        >
          <Flag className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Report this message</DialogTitle>
          <DialogDescription>
            Reports are read by {siteConfig.operator}, who runs the site. If a
            message is about you, you can have it removed — you do not need an
            account or to say who you are.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-3">
            <Label>What is wrong with it?</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {REASONS.map((r) => (
                <div key={r.value} className="flex items-center gap-3">
                  <RadioGroupItem value={r.value} id={`reason-${r.value}`} />
                  <Label
                    htmlFor={`reason-${r.value}`}
                    className="text-sm font-normal"
                  >
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-detail">
              Anything else?{' '}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Textarea
              id="report-detail"
              rows={3}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Context helps, but is not required."
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button onClick={submit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
