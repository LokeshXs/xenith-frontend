import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import {
  fetchOnboardingStatus,
  resumeStepFromStatus,
} from "@/lib/services/onboarding-status";
import MultistepForm from "./components/MultistepForm";
import { HealthCheck } from "./components/HealthCheck";
import { OnboardingStatusError } from "./components/OnboardingStatusError";

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

  const result = await fetchOnboardingStatus(session.access_token);

  console.log(result);

  if (result.kind === "unauthorized") {
    // Cookies can't be mutated from an RSC; /signout is a Route Handler that
    // clears the Supabase session and 307s to /login.
    redirect("/signout");
  }

  if (result.kind === "error") {
    return (
      <main className="min-h-screen flex justify-center items-center bg-background p-4 sm:p-6 md:p-8">
        <OnboardingStatusError />
      </main>
    );
  }

  if (result.data.completed) {
    redirect("/dashboard");
  }

  // Preferences already captured but X not (re)connected — no need to force the
  // Connect X step again; the rest of the app can run with stored preferences.
  if (result.data.steps.preferences && !result.data.steps.xAccount) {
    redirect("/dashboard");
  }

  const initialStep = resumeStepFromStatus(result.data.steps);

  return (
    <main className="min-h-screen flex justify-center items-center bg-background p-4 sm:p-6 md:p-8">
      <MultistepForm
        initialStep={initialStep}
        statusSteps={result.data.steps}
      />
      <HealthCheck />
    </main>
  );
}
