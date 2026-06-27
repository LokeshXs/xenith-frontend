'use client';

import { useFormContext } from '../context/FormContext';
import { Button } from '@/components/ui/button';
import { CREATOR_PLAN_LIMITS } from '@/lib/plan-limits';

const NICHE_TOPICS = [
  'AI & Tech',
  'Startups',
  'Marketing',
  'Finance',
  'Design',
  'Fitness',
  'SaaS',
  'Web3',
  'Creator Economy',
  'Leadership',
];

export function NicheStep() {
  const { formData, updateFormData } = useFormContext();
  const selectedTopics: string[] = formData.niche || [];
  const maxNiches = CREATOR_PLAN_LIMITS.maxNiches;
  const isAtLimit = selectedTopics.length >= maxNiches;
  // Use the X-analysis suggestions when present; otherwise fall back to the
  // default topics (e.g. the user skipped connecting their X account).
  const topics: string[] = formData.suggestedNiches?.length
    ? formData.suggestedNiches
    : NICHE_TOPICS;

  const handleTopicToggle = (topic: string) => {
    const isSelected = selectedTopics.includes(topic);
    if (!isSelected && isAtLimit) return;

    const updated = isSelected
      ? selectedTopics.filter((t) => t !== topic)
      : [...selectedTopics, topic];

    updateFormData({ niche: updated });
  };

  return (
    <div className="flex flex-col gap-6 ">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold tracking-tight text-pretty sm:text-3xl text-center sm:text-left">
          What&apos;s your <em>niche</em>?
        </h2>
        <p className="text-muted-foreground">
          Pick the topics you post about. This helps us find the right trends
          for you. Select up to {maxNiches}.
        </p>
      </div>

      {/* Topic Chips */}
      <div>
        <div className="flex flex-wrap gap-3">
          {topics.map((topic) => {
            const isSelected = selectedTopics.includes(topic);

            return (
              <Button
                key={topic}
                onClick={() => handleTopicToggle(topic)}
                variant={isSelected ? 'default' : 'outline'}
                disabled={!isSelected && isAtLimit}
                className="rounded-full min-h-11 max-sm:text-xs"
              >
                {topic}
              </Button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {selectedTopics.length} / {maxNiches} selected
        </p>
      </div>
    </div>
  );
}
