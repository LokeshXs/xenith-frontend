'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';

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
};

export function OnboardingDone({
  deliveryTime,
}: OnboardingDoneProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-8 mx-auto w-full max-w-6xl">
      <Card className='min-h-[26rem] sm:min-h-[32rem]'>
        <CardContent className="flex flex-col justify-center flex-1 items-center gap-6 text-center py-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold tracking-tight text-pretty sm:text-3xl">
              You&rsquo;re all <em>set</em>! 🎉
            </h2>
            <p className="text-muted-foreground">
              {deliveryTime
                ? `Your first posts will be ready by ${formatTime(deliveryTime)} tomorrow.`
                : 'Your workspace is ready and your subscription is active.'}
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
