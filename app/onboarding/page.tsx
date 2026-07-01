import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import {
  fetchOnboardingStatus,
  resumeStepFromStatus,
} from "@/lib/services/onboarding-status";
import { fetchOnboardingNicheSuggestions } from "@/lib/services/onboarding-niche-suggestions";
import { fetchBillingStatus } from "@/lib/services/billing";
import MultistepForm from "./components/MultistepForm";
import { BackendStatusGate } from "@/components/backend-status-gate";
import { LogoutButton } from "@/components/auth/logout-button";
import { OnboardingStatusError } from "./components/OnboardingStatusError";
import { OnboardingBillingGate } from "./components/OnboardingBillingGate";

export const metadata: Metadata = {
  title: "Onboarding",
  robots: { index: false, follow: false },
};

function OnboardingShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-dvh bg-background p-4 sm:p-6 md:p-8">
      <LogoutButton className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6" />
      <div className="flex min-h-[calc(100dvh-2rem)] items-center justify-center sm:min-h-[calc(100dvh-3rem)] md:min-h-[calc(100dvh-4rem)]">
        {children}
      </div>
    </main>
  );
}

export default async function Page() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // proxy.ts already gates this route, but a missing token here means the
  // session vanished between middleware and render — bounce to login.
  if (!session?.access_token) {
    redirect("/login");
  }

  const billing = await fetchBillingStatus(session.access_token);

  if (billing.kind === "unauthorized") {
    // Cookies can't be mutated from an RSC; /signout is a Route Handler that
    // clears the Supabase session and 307s to /login.
    redirect("/signout");
  }

  if (billing.kind === "error") {
    return (
      <OnboardingShell>
        <OnboardingStatusError
          title="We couldn't check your subscription"
          description="Retry the access check to continue onboarding."
        />
      </OnboardingShell>
    );
  }

  const hasActiveSubscription =
    billing.data.has_access && billing.data.status === "active";

  if (!hasActiveSubscription) {
    return (
      <BackendStatusGate>
        <OnboardingShell>
          <OnboardingBillingGate
            accessToken={session.access_token}
            initialBillingStatus={billing.data}
          />
        </OnboardingShell>
      </BackendStatusGate>
    );
  }

  const result = await fetchOnboardingStatus(session.access_token);

  if (result.kind === "unauthorized") {
    redirect("/signout");
  }

  if (result.kind === "error") {
    return (
      <OnboardingShell>
        <OnboardingStatusError />
      </OnboardingShell>
    );
  }

  if (result.data.completed) {
    redirect("/dashboard");
  }

  const initialStep = resumeStepFromStatus(result.data.steps);
  const shouldHydrateNicheSuggestions =
    result.data.steps.xAccount &&
    result.data.steps.styleProfile &&
    !result.data.steps.preferences;

  const nicheSuggestions = shouldHydrateNicheSuggestions
    ? await fetchOnboardingNicheSuggestions(session.access_token)
    : null;

  if (nicheSuggestions?.kind === "unauthorized") {
    redirect("/signout");
  }

  if (nicheSuggestions?.kind === "error") {
    return (
      <OnboardingShell>
        <OnboardingStatusError
          title="We couldn't load your niche suggestions"
          description="Retry onboarding so we can restore the topics generated from your X analysis."
        />
      </OnboardingShell>
    );
  }

  return (
    <BackendStatusGate>
      <OnboardingShell>
        <MultistepForm
          initialStep={initialStep}
          statusSteps={result.data.steps}
          initialSuggestedNiches={nicheSuggestions?.data.suggestedNiches ?? []}
          initialSelectedNiches={nicheSuggestions?.data.preselectedNiches ?? []}
        />
      </OnboardingShell>
    </BackendStatusGate>
  );
}
