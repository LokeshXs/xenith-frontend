import type {
  BillingPlan,
  BillingSubscriptionStatus,
} from "@/lib/services/billing";

export type UserRequirementKey =
  | "subscription"
  | "xAccount"
  | "styleProfile"
  | "preferences";

export type UserRequirementSteps = {
  preferences: boolean;
  xAccount: boolean;
  styleProfile: boolean;
};

export type UserRequirementsStatus = {
  ready: boolean;
  destination: "/dashboard" | "/onboarding";
  blockingRequirement: UserRequirementKey | null;
  requirements: {
    subscription: {
      satisfied: boolean;
      plan: BillingPlan | null;
      status: BillingSubscriptionStatus;
      hasAccess: boolean;
      accessExpiresAt: string | null;
    };
    xAccount: {
      satisfied: boolean;
      connected: boolean;
    };
    styleProfile: {
      satisfied: boolean;
      exists: boolean;
    };
    preferences: {
      satisfied: boolean;
      exists: boolean;
    };
  };
  onboarding: {
    completed: boolean;
    resumeStep: 0 | 1 | 2;
  };
};

export type UserRequirementsStatusResult =
  | { kind: "ok"; data: UserRequirementsStatus }
  | { kind: "unauthorized" }
  | { kind: "error"; message: string };

function apiUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!baseUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured");
  return `${baseUrl}${path}`;
}

async function errorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error ?? fallback;
  } catch {
    return fallback;
  }
}

export function requirementStepsFromStatus(
  status: UserRequirementsStatus,
): UserRequirementSteps {
  return {
    xAccount: status.requirements.xAccount.connected,
    styleProfile: status.requirements.styleProfile.exists,
    preferences: status.requirements.preferences.exists,
  };
}

export async function fetchUserRequirementsStatus(
  accessToken: string,
): Promise<UserRequirementsStatusResult> {
  try {
    const response = await fetch(apiUrl("/api/v1/user/requirements-status"), {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (response.status === 401) return { kind: "unauthorized" };
    if (!response.ok) {
      return {
        kind: "error",
        message: await errorMessage(
          response,
          "Unable to load user requirements status",
        ),
      };
    }

    return {
      kind: "ok",
      data: (await response.json()) as UserRequirementsStatus,
    };
  } catch (error) {
    return {
      kind: "error",
      message:
        error instanceof Error
          ? error.message
          : "Unable to load user requirements status",
    };
  }
}
