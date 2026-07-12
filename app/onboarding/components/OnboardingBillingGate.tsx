"use client";

import { useCallback, useRef, useState } from "react";
import { IconAlertCircle, IconLoader2, IconRefresh } from "@tabler/icons-react";
import { toast } from "sonner";

import {
  createCheckout,
  fetchBillingStatus,
  type BillingPlan,
  type BillingSubscriptionStatus,
} from "@/lib/services/billing";
import type { UserRequirementsStatus } from "@/lib/services/user-requirements";
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
  initialSubscription: UserRequirementsStatus["requirements"]["subscription"];
};

export function OnboardingBillingGate({
  accessToken,
  initialSubscription,
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
        if (result.kind === "resumed") {
          toast.success("Subscription resumed", {
            description: "Your Creator access will continue.",
          });
          window.location.reload();
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

  const copy = billingGateCopy(initialSubscription.status);

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
          {copy.title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {copy.description}
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

function billingGateCopy(status: BillingSubscriptionStatus): {
  title: string;
  description: string;
} {
  if (status === "expired") {
    return {
      title: "Your subscription has expired",
      description: "Choose a Creator plan to reactivate your workspace.",
    };
  }

  if (status === "cancelled") {
    return {
      title: "Your subscription is cancelled",
      description: "Choose a Creator plan to reactivate your workspace.",
    };
  }

  if (status === "on_hold") {
    return {
      title: "Your subscription is on hold",
      description: "Choose a Creator plan to restore access to your workspace.",
    };
  }

  if (status === "failed") {
    return {
      title: "Your payment couldn't be completed",
      description: "Choose a Creator plan to restore access to your workspace.",
    };
  }

  if (status === "pending" || status === "processing") {
    return {
      title: "Your subscription is still activating",
      description:
        "If payment is complete, try again shortly. You can also choose a plan to continue.",
    };
  }

  return {
    title: "Activate your workspace",
    description: "Choose your Creator plan to continue onboarding.",
  };
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
