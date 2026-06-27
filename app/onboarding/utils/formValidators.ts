import { z } from 'zod';
import type { FormData } from '../context/FormContext';
import { CREATOR_PLAN_LIMITS } from '@/lib/plan-limits';

/**
 * Zod schemas for form validation
 * Consolidated fields: custom values stored at index 0 in arrays
 */

// Niche Step Schema - array of selected topics
export const nicheStepSchema = z.object({
  niche: z
    .array(z.string())
    .min(1, 'Please select at least one topic')
    .max(
      CREATOR_PLAN_LIMITS.maxNiches,
      `Select up to ${CREATOR_PLAN_LIMITS.maxNiches} topics`,
    ),
});

// Inspiration Step Schema - optional accounts with plan cap
export const inspirationStepSchema = z.object({
  inspirationAccounts: z
    .array(z.string())
    .max(
      CREATOR_PLAN_LIMITS.maxInspirationAccounts,
      `Add up to ${CREATOR_PLAN_LIMITS.maxInspirationAccounts} inspiration accounts`,
    ),
});

// Schedule Step Schema
export const scheduleStepSchema = z.object({
  postsPerDay: z.enum(
    Array.from({ length: CREATOR_PLAN_LIMITS.maxPostsPerDay }, (_, index) =>
      String(index + 1),
    ) as [string, ...string[]],
    `Select between 1 and ${CREATOR_PLAN_LIMITS.maxPostsPerDay} posts per day`,
  ),
  deliveryTime: z.string().min(1, 'Please select a delivery time'),
});

/**
 * Get schema for a specific step
 */
const stepSchemas: Record<string, z.ZodSchema> = {
  niche: nicheStepSchema,
  inspiration: inspirationStepSchema,
  schedule: scheduleStepSchema,
};

/**
 * Validate current step using Zod
 */
export const validateCurrentStep = (stepId: string, data: FormData): boolean => {
  const schema = stepSchemas[stepId];
  if (!schema) return true;

  try {
    schema.parse(data);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get validation errors for a step
 */
export const getStepValidationErrors = (stepId: string, data: FormData) => {
  const schema = stepSchemas[stepId];
  if (!schema) return null;

  try {
    schema.parse(data);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.flatten();
    }
    return null;
  }
};
