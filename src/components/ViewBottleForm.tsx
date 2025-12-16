'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';

export default function ViewBottleForm() {
  const [recipient, setRecipient] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (recipient.trim()) {
      router.push(`/bottle/${recipient.trim()}`);
    }
  };

  return (
    <div className="mx-auto mt-8 max-w-xl">
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Enter a name to check their bottle"
              className="flex-1"
              required
            />
            <Button type="submit">Check Bottle</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
