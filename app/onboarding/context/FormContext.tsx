'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { OnboardingStatusSteps } from '@/lib/services/onboarding-status';

/**
 * Shape of the onboarding form data collected across the steps.
 */
export interface FormData {
  niche: string[];
  // Personalized chips from the X analysis (fall back to defaults when empty).
  suggestedNiches: string[];
  inspirationAccounts: string[];
  postsPerDay: string;
  deliveryTime: string;
}

/**
 * Configuration for each form step
 */
export interface FormStep {
  id: string;
  title: string;
  description?: string;
}

/**
 * Multi-step form context type
 */
export interface FormContextType {
  // Step management
  currentStep: number;
  totalSteps: number;
  currentStepId: string;
  steps: FormStep[];

  // Onboarding-status snapshot from the server. Steps can branch their UI on this
  // (e.g. ConnectXStep renders the "analyze posts" variant when xAccount is true
  // but styleProfile is false).
  statusSteps?: OnboardingStatusSteps;

  // Form data management
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  getStepData: (stepId: string) => FormData;

  // Navigation
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  goToStep: (stepIndex: number) => void;
  canGoNext: () => boolean;
  canGoPrevious: () => boolean;

  // Utilities
  resetForm: () => void;
  getCompletedSteps: () => number[];
  markStepComplete: (stepIndex: number) => void;
}

// Create the context
const FormContext = createContext<FormContextType | undefined>(undefined);

/**
 * Form context provider component
 */
export function FormProvider({
  children,
  steps,
  initialData,
  initialStep = 0,
  statusSteps,
}: {
  children: ReactNode;
  steps: FormStep[];
  initialData: FormData;
  initialStep?: number;
  statusSteps?: OnboardingStatusSteps;
}) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [formData, setFormData] = useState<FormData>(initialData);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const totalSteps = steps.length;
  const currentStepId = steps[currentStep]?.id || '';

  /**
   * Update form data
   */
  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => ({
      ...prev,
      ...data,
    }));
  };

  /**
   * Get data for a specific step
   */
  const getStepData = (): FormData => {
    // You can customize this to filter data by step if needed
    return formData;
  };

  /**
   * Navigation functions
   */
  const goToNextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    // Steps 0–2 (Connect X, Analyze X, Niche) are one-way.
    if (currentStep > 2) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < totalSteps) {
      setCurrentStep(stepIndex);
    }
  };

  const canGoNext = () => currentStep < totalSteps - 1;
  const canGoPrevious = () => currentStep > 2;

  /**
   * Mark a step as completed
   */
  const markStepComplete = (stepIndex: number) => {
    setCompletedSteps((prev) => new Set([...prev, stepIndex]));
  };

  /**
   * Get list of completed steps
   */
  const getCompletedSteps = () => Array.from(completedSteps);

  /**
   * Reset the entire form
   */
  const resetForm = () => {
    setCurrentStep(initialStep);
    setFormData(initialData);
    setCompletedSteps(new Set());
  };

  const value: FormContextType = {
    currentStep,
    totalSteps,
    currentStepId,
    steps,
    statusSteps,
    formData,
    updateFormData,
    getStepData,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    canGoNext,
    canGoPrevious,
    resetForm,
    getCompletedSteps,
    markStepComplete,
  };

  return (
    <FormContext.Provider value={value}>
      {children}
    </FormContext.Provider>
  );
}

/**
 * Hook to use the form context
 */
export function useFormContext(): FormContextType {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
}
