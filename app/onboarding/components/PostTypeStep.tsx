'use client';

import { useFormContext } from '../context/FormContext';
import { Button } from '@/components/ui/button';

const POST_TYPES = [
  'Guidance',
  'News',
  'Motivational',
  'Educational',
  'Opinion',
  'Personal Story',
  'Entertainment',
  'Promotional',
];

export function PostTypeStep() {
  const { formData, updateFormData } = useFormContext();
  const selected: string[] = formData.postType || [];

  const handleToggle = (type: string) => {
    const isSelected = selected.includes(type);
    const updated = isSelected
      ? selected.filter((t) => t !== type)
      : [...selected, type];

    updateFormData({ postType: updated });
  };

  return (
    <div className="flex flex-col gap-6 ">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">
          What do you want to <em>post</em>?
        </h2>
        <p className="text-muted-foreground">
          Pick the kinds of posts you want us to generate.
        </p>
      </div>

      {/* Post Type Chips */}
      <div>
        <div className="flex flex-wrap gap-3">
          {POST_TYPES.map((type) => (
            <Button
              key={type}
              onClick={() => handleToggle(type)}
              variant={selected.includes(type) ? 'default' : 'outline'}
              className="rounded-full"
            >
              {type}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
