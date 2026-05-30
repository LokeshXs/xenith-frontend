'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

function formatTime(value: string): string {
  const [hStr, mStr] = (value || '').split(':');
  const hours = Number(hStr);
  const minutes = Number(mStr);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value;

  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

type OnboardingDoneProps = {
  deliveryTime: string;
  postsPerDay: string;
};

export function OnboardingDone({
  deliveryTime,
  postsPerDay,
}: OnboardingDoneProps) {
  const router = useRouter();
  const count = Number(postsPerDay) || 1;
  const postLabel = count === 1 ? 'post' : 'posts';

  return (
    <div className="flex flex-col gap-8 container mx-auto max-w-2/3 w-full">
      <Card>
        <CardContent className="flex flex-col items-center gap-6 text-center py-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold tracking-tight">
              You're all <em>set</em>! 🎉
            </h2>
            <p className="text-muted-foreground">
              Your first posts will be ready by {formatTime(deliveryTime)}{' '}
              tomorrow.
            </p>
            <p className="text-muted-foreground">
              We'll analyse today's trends tonight and generate {count}{' '}
              {postLabel} tailored to your voice and niche.
            </p>
          </div>
          <Button size="lg" onClick={() => router.push('/dashboard')}>
            Go to dashboard →
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
