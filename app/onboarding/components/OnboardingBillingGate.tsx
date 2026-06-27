"use client";

import { useCallback, useRef, useState } from "react";
import { IconAlertCircle, IconLoader2, IconRefresh } from "@tabler/icons-react";
import { toast } from "sonner";

import {
  createCheckout,
  fetchBillingStatus,
  type BillingPlan,
} from "@/lib/services/billing";
import {
  CreatorPlanCard,
  type CreatorBillingCycle,
} from "@/components/billing/creator-plan-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type OnboardingBillingGateProps = {
  accessToken: string;
};

export function OnboardingBillingGate({
  accessToken,
}: OnboardingBillingGateProps) {
  const [billing, setBilling] = useState<CreatorBillingCycle>("monthly");
  const [status, setStatus] = useState<"unpaid" | "checking" | "error">(
    "unpaid",
  );
  const [submittingPlan, setSubmittingPlan] = useState<BillingPlan | null>(null);
  const checkoutInFlight = useRef(false);

  const loadStatus = useCallback(async () => {
    setStatus("checking");
    const result = await fetchBillingStatus(accessToken);

    if (result.kind === "unauthorized") {
      window.location.assign("/signout");
      return;
    }

    if (result.kind === "error") {
      setStatus("error");
      return;
    }

    if (result.data.has_access) {
      window.location.reload();
      return;
    }

    setStatus("unpaid");
  }, [accessToken]);

  const subscribe = useCallback(
    async (plan: BillingPlan) => {
      if (checkoutInFlight.current) return;
      checkoutInFlight.current = true;
      setSubmittingPlan(plan);

      try {
        const result = await createCheckout(accessToken, plan);

        if (result.kind === "unauthorized") {
          window.location.assign("/signout");
          return;
        }
        if (result.kind === "conflict") {
          await loadStatus();
          return;
        }
        if (result.kind === "error") {
          toast.error(result.message);
          return;
        }

        window.location.assign(result.checkoutUrl);
      } finally {
        checkoutInFlight.current = false;
        setSubmittingPlan(null);
      }
    },
    [accessToken, loadStatus],
  );

  if (status === "checking") {
    return (
      <OnboardingStateCard
        icon={<IconLoader2 className="size-9 animate-spin text-primary" />}
        title="Checking your subscription"
        description="We're confirming your access before continuing onboarding."
      />
    );
  }

  if (status === "error") {
    return (
      <OnboardingStateCard
        icon={<IconAlertCircle className="size-9 text-destructive" />}
        title="We couldn't check your subscription"
        description="Retry the access check to continue onboarding."
        action={
          <Button onClick={() => void loadStatus()}>
            <IconRefresh data-icon="inline-start" />
            Try again
          </Button>
        }
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Activate your workspace
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose your Creator plan to continue onboarding.
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
      <Card className="flex min-h-[26rem] justify-center sm:min-h-[32rem]">
        <CardHeader className="flex w-full flex-col items-center pt-16 text-center">
          {icon}
          <CardTitle className="mt-2 text-xl sm:text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {action && <CardFooter className="justify-center">{action}</CardFooter>}
        {!action && <CardContent />}
      </Card>
    </div>
  );
}
