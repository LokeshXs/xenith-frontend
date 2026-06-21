"use client";

import { useState } from "react";
import { FormProvider, useFormContext } from "../context/FormContext";
import { NicheStep } from "./NicheStep";
import { PostTypeStep } from "./PostTypeStep";
import { InspirationStep } from "./InspirationStep";
import { ScheduleStep } from "./ScheduleStep";
import { OnboardingDone } from "./OnboardingDone";
import { ConnectXStep } from "./ConnectXStep";
import { AnalyzeXStep } from "./AnalyzeXStep";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { validateCurrentStep } from "../utils/formValidators";
import { getErrorMessage } from "../utils/getErrorMessage";
import { saveUserPreferences } from "@/lib/services/preferences";
import type { FormStep } from "../context/FormContext";
import type { OnboardingStatusSteps } from "@/lib/services/onboarding-status";

// Define the form steps
const FORM_STEPS: FormStep[] = [
  {
    id: "connect-x",
    title: "Connect your X account",
    description: "Import your recent posts to personalize your content",
  },
  {
    id: "analyze-x",
    title: "Analyzing your style",
    description: "We're learning your voice from your recent posts",
  },
  {
    id: "niche",
    title: "What's your niche?",
    description:
      "Pick the topics you post about. This helps us find the right trends for you.",
  },
  {
    id: "post-type",
    title: "What do you want to post?",
    description: "Pick the kinds of posts you want us to generate.",
  },
  {
    id: "inspiration",
    title: "Who inspires you?",
    description:
      "Add X accounts whose posts you love — we'll draw inspiration from them.",
  },
  {
    id: "schedule",
    title: "Set your schedule",
    description: "When should we generate and deliver your posts?",
  },
];

type MultistepFormProps = {
  initialStep?: number;
  statusSteps?: OnboardingStatusSteps;
  initiallyComplete?: boolean;
};

export default function MultistepForm({
  initialStep,
  statusSteps,
  initiallyComplete = false,
}: MultistepFormProps) {
  return (
    <FormProvider
      steps={FORM_STEPS}
      initialStep={initialStep}
      statusSteps={statusSteps}
      initialData={{
        niche: [], // selected topics
        postType: [], // selected post types
        suggestedNiches: [], // niche chips from the X analysis (falls back to defaults)
        suggestedPostTypes: [], // post-type chips from the X analysis (falls back to defaults)
        inspirationAccounts: [], // X usernames to take inspiration from

        postsPerDay: "1",
        deliveryTime: "08:00",
        postFormat: "single",
      }}
    >
      <MultistepFormContent initiallyComplete={initiallyComplete} />
    </FormProvider>
  );
}

function MultistepFormContent({
  initiallyComplete,
}: {
  initiallyComplete: boolean;
}) {
  const {
    currentStep,
    totalSteps,
    formData,
    goToNextStep,
    goToPreviousStep,
    canGoPrevious,
    steps,
  } = useFormContext();
  const currentStepId = steps[currentStep]?.id || "";
  const isCurrentStepValid = validateCurrentStep(currentStepId, formData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(initiallyComplete);
  const [error, setError] = useState<string | null>(null);

  async function FormSubmissionHandler() {
    if (currentStep < totalSteps - 1) {
      goToNextStep();
      return;
    }
    // Last step (schedule): save preferences
    setIsSubmitting(true);
    setError(null);
    try {

      
      await saveUserPreferences({
        niche: formData.niche,
        postType: formData.postType,
        inspirationAccounts: formData.inspirationAccounts,
        postsPerDay: formData.postsPerDay,
        deliveryTime: formData.deliveryTime,
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Something went wrong. Please try again."));
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);
    setIsComplete(true);
  }

  if (isComplete) {
    return (
      <OnboardingDone
        deliveryTime={initiallyComplete ? "" : formData.deliveryTime}
        postsPerDay={formData.postsPerDay}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8 mx-auto w-full max-w-6xl">
      {/* Step content. The analyze step is an immersive, self-advancing moment,
          so it renders without the step-counter header or footer navigation.
          A shared min-height keeps the card from resizing between steps. */}
      <Card className="min-h-[26rem] sm:min-h-[32rem] w-full ">
        {currentStepId !== "analyze-x" && (
          <CardHeader>
            <div className="text-xs text-muted-foreground font-medium text-center sm:text-left">
              STEP {currentStep + 1} OF {totalSteps}
            </div>
          </CardHeader>
        )}
        <CardContent className=" flex-1 flex items-center justify-center w-full">
          <FormStepContent />
        </CardContent>
      </Card>

      {/* Step counter and navigation */}
      {error && <p className="text-sm text-destructive text-center">{error}</p>}
      {currentStepId !== "analyze-x" && (
        <div className="flex items-center justify-between">
          {canGoPrevious() ? (
            <Button variant="outline" onClick={goToPreviousStep}>
              Back
            </Button>
          ) : (
            <div />
          )}
         
          <Button
            onClick={FormSubmissionHandler}
            disabled={!isCurrentStepValid || isSubmitting}
          >
            {currentStepId === "schedule"
              ? isSubmitting
                ? "Saving…"
                : "Save"
              : "Continue →"}
          </Button>
        </div>
      )}
    </div>
  );
}

function FormStepContent() {
  const { currentStep } = useFormContext();

  switch (currentStep) {
    case 0:
      return <ConnectXStep />;
    case 1:
      return <AnalyzeXStep />;
    case 2:
      return <NicheStep />;
    case 3:
      return <PostTypeStep />;
    case 4:
      return <InspirationStep />;
    case 5:
      return <ScheduleStep />;
    default:
      return <ConnectXStep />;
  }
}
