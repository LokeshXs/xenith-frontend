import { z } from 'zod';
import type { FormData } from '../context/FormContext';

/**
 * Zod schemas for form validation
 * Consolidated fields: custom values stored at index 0 in arrays
 */

// Niche Step Schema - array of selected topics
export const nicheStepSchema = z.object({
  niche: z.array(z.string()).min(1, 'Please select at least one topic'),
});

// Post Type Step Schema - array of selected post types
export const postTypeStepSchema = z.object({
  postType: z.array(z.string()).min(1, 'Please select at least one post type'),
});

// Schedule Step Schema
export const scheduleStepSchema = z.object({
  postsPerDay: z.string().min(1, 'Please select posts per day'),
  deliveryTime: z.string().min(1, 'Please select a delivery time'),
  postFormat: z.string().min(1, 'Please select a post format'),
});

/**
 * Get schema for a specific step
 */
const stepSchemas: Record<string, z.ZodSchema> = {
  niche: nicheStepSchema,
  'post-type': postTypeStepSchema,
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
  } catch (error) {
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
