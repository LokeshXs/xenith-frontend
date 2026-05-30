'use client';

import { useFormContext } from '../context/FormContext';
import { Button } from '@/components/ui/button';

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

  const handleTopicToggle = (topic: string) => {
    const isSelected = selectedTopics.includes(topic);
    const updated = isSelected
      ? selectedTopics.filter((t) => t !== topic)
      : [...selectedTopics, topic];

    updateFormData({ niche: updated });
  };

  return (
    <div className="flex flex-col gap-6 ">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">
          What's your <em>niche</em>?
        </h2>
        <p className="text-muted-foreground">
          Pick the topics you post about. This helps us find the right trends
          for you.
        </p>
      </div>

      {/* Topic Chips */}
      <div>
        <div className="flex flex-wrap gap-3">
          {NICHE_TOPICS.map((topic) => (
            <Button
              key={topic}
              onClick={() => handleTopicToggle(topic)}
              variant={selectedTopics.includes(topic) ? 'default' : 'outline'}
              className="rounded-full"
            >
              {topic}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
