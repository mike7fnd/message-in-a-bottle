'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/firebase';
import { initializeFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2, CheckCircle, AlertCircle, Power, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// ── Types ─────────────────────────────────────────────────────────────────────

interface MaintenanceConfig {
  enabled: boolean;
  title: string;
  description: string;
}

interface ScheduledConfig {
  enabled: boolean;
  opensAt: number | null;
  title: string;
  description: string;
}

// ── Presets ───────────────────────────────────────────────────────────────────

const MAINTENANCE_PRESETS = [
  { label: 'Back Soon', title: "We'll Be Right Back", description: "We're making some improvements. The app will be back shortly." },
  { label: 'Too Many Users', title: 'Under Heavy Traffic', description: "We're experiencing high traffic right now. We'll be back in a moment." },
  { label: 'Maintenance', title: 'Scheduled Maintenance', description: "We're performing scheduled maintenance. We'll be back soon." },
  { label: 'Update', title: 'Updating the App', description: "We're rolling out a new update. This won't take long!" },
];

const SCHEDULED_PRESETS = [
  { label: 'Coming Soon', title: 'Coming Soon', description: 'Something exciting is on the way. The app opens at the time shown below.' },
  { label: 'New Season', title: 'A New Chapter Begins', description: "We're preparing something special. Stay tuned — the wait is almost over." },
  { label: 'Event', title: 'Launching Soon', description: 'A new experience is about to begin. Check back when the countdown reaches zero.' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function SaveFeedback({ result }: { result: 'success' | 'error' | null }) {
  if (!result) return null;
  return result === 'success'
    ? <span className="flex items-center gap-1 text-sm text-green-600"><CheckCircle className="h-4 w-4" /> Saved</span>
    : <span className="flex items-center gap-1 text-sm text-destructive"><AlertCircle className="h-4 w-4" /> Failed to save</span>;
}

function parseFirestoreDoc(data: any) {
  const f = data?.fields ?? {};
  const str = (k: string) => f[k]?.stringValue ?? null;
  const bool = (k: string) => f[k]?.booleanValue ?? false;
  const num = (k: string) => f[k]?.integerValue
    ? parseInt(f[k].integerValue, 10)
    : f[k]?.doubleValue
      ? Number(f[k].doubleValue)
      : null;
  return { str, bool, num };
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminMorePage() {
  const auth = useAuth();
  const router = useRouter();

  const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/config`;

  // Maintenance state
  const [mConfig, setMConfig] = useState<MaintenanceConfig>({ enabled: false, title: "We'll Be Right Back", description: "We're making some improvements." });
  const [mLoading, setMLoading] = useState(true);
  const [mSaving, setMSaving] = useState(false);
  const [mResult, setMResult] = useState<'success' | 'error' | null>(null);

  // Scheduled state
  const [sConfig, setSConfig] = useState<ScheduledConfig>({ enabled: false, opensAt: null, title: 'Coming Soon', description: 'Something exciting is on the way.' });
  const [sLoading, setSLoading] = useState(true);
  const [sSaving, setSSaving] = useState(false);
  const [sResult, setSResult] = useState<'success' | 'error' | null>(null);
  const [opensAtInput, setOpensAtInput] = useState('');

  // ── Get auth token ──────────────────────────────────────────────────────────
  const getToken = useCallback(async () => {
    const { auth: fbAuth } = initializeFirebase();
    const token = await fbAuth.currentUser?.getIdToken(true);
    if (!token) throw new Error('Not authenticated — please sign in again.');
    return token;
  }, []);

  // ── Firestore REST PATCH ────────────────────────────────────────────────────
  const fsPatch = useCallback(async (docId: string, fields: Record<string, unknown>) => {
    const token = await getToken();
    const fsFields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(fields)) {
      if (typeof v === 'boolean') fsFields[k] = { booleanValue: v };
      else if (typeof v === 'string') fsFields[k] = { stringValue: v };
      else if (typeof v === 'number') fsFields[k] = { integerValue: String(v) };
      else fsFields[k] = { nullValue: null };
    }
    const res = await fetch(`${FS_BASE}/${docId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ fields: fsFields }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('Firestore PATCH error:', err);
      throw new Error('Firestore write failed');
    }
  }, [FS_BASE, getToken]);

  // ── Load both configs ───────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch(`${FS_BASE}/maintenance`).then(r => r.json()),
      fetch(`${FS_BASE}/scheduled`).then(r => r.json()),
    ]).then(([m, s]) => {
      const mp = parseFirestoreDoc(m);
      setMConfig({
        enabled: mp.bool('enabled'),
        title: mp.str('title') ?? "We'll Be Right Back",
        description: mp.str('description') ?? "We're making some improvements.",
      });

      const sp = parseFirestoreDoc(s);
      const ts = sp.num('opensAt');
      setSConfig({
        enabled: sp.bool('enabled'),
        title: sp.str('title') ?? 'Coming Soon',
        description: sp.str('description') ?? 'Something exciting is on the way.',
        opensAt: ts,
      });
      if (ts) {
        const d = new Date(ts);
        const p = (n: number) => String(n).padStart(2, '0');
        setOpensAtInput(`${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`);
      }
    }).catch(console.error)
      .finally(() => { setMLoading(false); setSLoading(false); });
  }, [FS_BASE]);

  // ── Save maintenance ────────────────────────────────────────────────────────
  const saveMaintenance = async (cfg: MaintenanceConfig) => {
    setMSaving(true); setMResult(null);
    try {
      await fsPatch('maintenance', cfg);
      setMConfig(cfg);
      setMResult('success');
    } catch { setMResult('error'); }
    finally { setMSaving(false); setTimeout(() => setMResult(null), 3000); }
  };

  // ── Save scheduled ──────────────────────────────────────────────────────────
  const saveScheduled = async (cfg: ScheduledConfig) => {
    setSSaving(true); setSResult(null);
    try {
      const opensAtMs = opensAtInput ? new Date(opensAtInput).getTime() : null;
      await fsPatch('scheduled', { ...cfg, opensAt: opensAtMs });
      setSConfig({ ...cfg, opensAt: opensAtMs });
      setSResult('success');
    } catch { setSResult('error'); }
    finally { setSSaving(false); setTimeout(() => setSResult(null), 3000); }
  };

  const handleSignOut = async () => {
    if (auth) { await signOut(auth); router.push('/admin/login'); }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">More</h1>
      </div>
      <div className="grid gap-6">

        {/* ── Maintenance Mode ──────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Power className="h-5 w-5" /> Site Maintenance</CardTitle>
                <CardDescription className="mt-1">Instantly pause the app. All visitors see a maintenance page.</CardDescription>
              </div>
              {!mLoading && (
                <Badge variant={mConfig.enabled ? 'destructive' : 'secondary'} className="text-xs shrink-0">
                  {mConfig.enabled ? 'PAUSED' : 'LIVE'}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {mLoading ? <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
              <>
                <div className={cn('flex items-center justify-between rounded-lg border p-4 transition-colors', mConfig.enabled ? 'border-destructive/50 bg-destructive/5' : '')}>
                  <div>
                    <Label className="text-base font-medium">{mConfig.enabled ? '🔴 App is paused' : '🟢 App is live'}</Label>
                    <p className="text-sm text-muted-foreground mt-0.5">{mConfig.enabled ? 'Users are seeing the maintenance page.' : 'Toggle to pause the app for all users.'}</p>
                  </div>
                  <Switch checked={mConfig.enabled} onCheckedChange={(v) => saveMaintenance({ ...mConfig, enabled: v })} disabled={mSaving} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Quick Presets</Label>
                  <div className="flex flex-wrap gap-2">
                    {MAINTENANCE_PRESETS.map(p => (
                      <Button key={p.label} variant="outline" size="sm" onClick={() => setMConfig(prev => ({ ...prev, title: p.title, description: p.description }))}>{p.label}</Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Page Heading</Label>
                  <Input value={mConfig.title} onChange={e => setMConfig(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Message to Users</Label>
                  <Textarea value={mConfig.description} onChange={e => setMConfig(p => ({ ...p, description: e.target.value }))} rows={3} />
                </div>
                <div className="flex items-center gap-3">
                  <Button onClick={() => saveMaintenance(mConfig)} disabled={mSaving}>
                    {mSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Message
                  </Button>
                  <SaveFeedback result={mResult} />
                </div>
                {(mConfig.title || mConfig.description) && (
                  <div className="rounded-lg border border-dashed p-4 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Preview</p>
                    <p className="font-bold text-foreground">{mConfig.title}</p>
                    <p className="text-sm text-muted-foreground">{mConfig.description}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* ── Scheduled Opening ─────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Scheduled Opening</CardTitle>
                <CardDescription className="mt-1">Lock the site until a set date and time. Users see a live countdown.</CardDescription>
              </div>
              {!sLoading && (
                <Badge variant={sConfig.enabled ? 'destructive' : 'secondary'} className="text-xs shrink-0">
                  {sConfig.enabled ? 'LOCKED' : 'OFF'}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {sLoading ? <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
              <>
                <div className={cn('flex items-center justify-between rounded-lg border p-4 transition-colors', sConfig.enabled ? 'border-destructive/50 bg-destructive/5' : '')}>
                  <div>
                    <Label className="text-base font-medium">{sConfig.enabled ? '🔒 Site is locked until opening time' : '🔓 Scheduled lock is off'}</Label>
                    <p className="text-sm text-muted-foreground mt-0.5">{sConfig.enabled ? 'Users see a countdown page.' : 'Enable to lock until a specific time.'}</p>
                  </div>
                  <Switch checked={sConfig.enabled} onCheckedChange={v => saveScheduled({ ...sConfig, enabled: v })} disabled={sSaving} />
                </div>
                <div className="space-y-2">
                  <Label>Opening Date & Time</Label>
                  <Input type="datetime-local" value={opensAtInput} onChange={e => setOpensAtInput(e.target.value)} min={new Date().toISOString().slice(0, 16)} />
                  <p className="text-xs text-muted-foreground">Time is in your local timezone.</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Quick Presets</Label>
                  <div className="flex flex-wrap gap-2">
                    {SCHEDULED_PRESETS.map(p => (
                      <Button key={p.label} variant="outline" size="sm" onClick={() => setSConfig(prev => ({ ...prev, title: p.title, description: p.description }))}>{p.label}</Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Page Heading</Label>
                  <Input value={sConfig.title} onChange={e => setSConfig(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Message to Users</Label>
                  <Textarea value={sConfig.description} onChange={e => setSConfig(p => ({ ...p, description: e.target.value }))} rows={3} />
                </div>
                <div className="flex items-center gap-3">
                  <Button onClick={() => saveScheduled(sConfig)} disabled={sSaving}>
                    {sSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Schedule
                  </Button>
                  <SaveFeedback result={sResult} />
                </div>
                {(sConfig.title || sConfig.description) && (
                  <div className="rounded-lg border border-dashed p-4 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preview</p>
                    <p className="font-bold text-foreground">{sConfig.title}</p>
                    <p className="text-sm text-muted-foreground">{sConfig.description}</p>
                    {opensAtInput && (
                      <p className="text-xs text-muted-foreground">Opens: <span className="font-medium text-foreground">
                        {new Date(opensAtInput).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </span></p>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* ── Authentication ────────────────────────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle>Authentication</CardTitle></CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </CardContent>
        </Card>

      </div>
    </>
  );
}
