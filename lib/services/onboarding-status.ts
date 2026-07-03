import {
  fetchUserRequirementsStatus,
  requirementStepsFromStatus,
  type UserRequirementSteps,
} from "@/lib/services/user-requirements";

export type OnboardingStatusSteps = UserRequirementSteps;

export type OnboardingStatus = {
  completed: boolean;
  steps: OnboardingStatusSteps;
};

export type OnboardingStatusResult =
  | { kind: "ok"; data: OnboardingStatus }
  | { kind: "unauthorized" }
  | { kind: "error" };

export async function fetchOnboardingStatus(
  accessToken: string,
): Promise<OnboardingStatusResult> {
  const result = await fetchUserRequirementsStatus(accessToken);

  if (result.kind === "unauthorized") return result;
  if (result.kind === "error") return { kind: "error" };

  return {
    kind: "ok",
    data: {
      completed: result.data.onboarding.completed,
      steps: requirementStepsFromStatus(result.data),
    },
  };
}

// Maps an incomplete onboarding state to the step the user should resume on.
// xAccount missing → step 0 (Connect X).
// styleProfile missing → step 1 (Analyze X, which runs the analysis).
// preferences missing → step 2 (Niche).
export function resumeStepFromStatus(steps: OnboardingStatusSteps): number {
  if (!steps.xAccount) return 0;
  if (!steps.styleProfile) return 1;
  if (!steps.preferences) return 2;

  return 0;
}
