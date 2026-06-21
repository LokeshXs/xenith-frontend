'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconAlertCircle, IconLoader2, IconRefresh } from '@tabler/icons-react';
import { toast } from 'sonner';

import { useAuth } from '@/context/AuthContext';
import {
  createCheckout,
  fetchBillingStatus,
  type BillingPlan,
} from '@/lib/services/billing';
import {
  CreatorPlanCard,
  type CreatorBillingCycle,
} from '@/components/billing/creator-plan-card';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
  postsPerDay: string;
};

export function OnboardingDone({
  deliveryTime,
}: OnboardingDoneProps) {
  const router = useRouter();
  const { session, isLoading: isAuthLoading } = useAuth();
  const accessToken = session?.access_token ?? null;
  const [billing, setBilling] = useState<CreatorBillingCycle>('monthly');
  const [status, setStatus] = useState<'loading' | 'active' | 'unpaid' | 'error'>('loading');
  const [submittingPlan, setSubmittingPlan] = useState<BillingPlan | null>(null);
  const checkoutInFlight = useRef(false);

  const loadStatus = useCallback(async () => {
    if (!accessToken) return;

    setStatus('loading');
    const result = await fetchBillingStatus(accessToken);

    if (result.kind === 'unauthorized') {
      window.location.assign('/signout');
      return;
    }
    if (result.kind === 'error') {
      setStatus('error');
      return;
    }

    setStatus(result.data.has_access ? 'active' : 'unpaid');
  }, [accessToken]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!accessToken) {
      window.location.assign('/login?redirectTo=%2Fonboarding');
      return;
    }

    const timer = window.setTimeout(() => {
      void loadStatus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [accessToken, isAuthLoading, loadStatus]);

  const subscribe = useCallback(async (plan: BillingPlan) => {
    if (!accessToken || checkoutInFlight.current) return;
    checkoutInFlight.current = true;
    setSubmittingPlan(plan);

    try {
      const result = await createCheckout(accessToken, plan);

      if (result.kind === 'unauthorized') {
        window.location.assign('/signout');
        return;
      }
      if (result.kind === 'conflict') {
        await loadStatus();
        return;
      }
      if (result.kind === 'error') {
        toast.error(result.message);
        return;
      }

      window.location.assign(result.checkoutUrl);
    } finally {
      checkoutInFlight.current = false;
      setSubmittingPlan(null);
    }
  }, [accessToken, loadStatus]);

  if (isAuthLoading || status === 'loading') {
    return (
      <OnboardingStateCard
        icon={<IconLoader2 className="size-9 animate-spin text-primary" />}
        title="Checking your subscription"
        description="We’re confirming your access before opening the dashboard."
      />
    );
  }

  if (status === 'error') {
    return (
      <OnboardingStateCard
        icon={<IconAlertCircle className="size-9 text-destructive" />}
        title="We couldn’t check your subscription"
        description="Your onboarding is saved. Retry the access check to continue."
        action={
          <Button onClick={() => void loadStatus()}>
            <IconRefresh data-icon="inline-start" />
            Try again
          </Button>
        }
      />
    );
  }

  if (status === 'unpaid') {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            One last step
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose your Creator plan to activate your workspace.
          </p>
        </div>
        <CreatorPlanCard
          billing={billing}
          onBillingChange={setBilling}
          submittingPlan={submittingPlan}
          onSubscribe={subscribe}
        />
      </div>
    );
  }

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

function OnboardingStateCard({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <Card className="min-h-[26rem] sm:min-h-[32rem]  flex justify-center">
        <CardHeader className=" pt-16 text-center flex flex-col items-center w-full">
          {icon}
          <CardTitle className="mt-2 text-xl sm:text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {action && (
          <CardFooter className="justify-center">
            {action}
          </CardFooter>
        )}
        {!action && <CardContent />}
      </Card>
    </div>
  );
}
