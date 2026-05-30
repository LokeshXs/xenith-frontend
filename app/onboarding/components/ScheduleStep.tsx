'use client';

import { useState } from 'react';
import { useFormContext } from '../context/FormContext';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const POSTS_PER_DAY_OPTIONS = [
  { value: '1', label: '1 post/day' },
  { value: '2', label: '2 posts/day' },
  { value: '3', label: '3 posts/day' },
  { value: '4', label: '4 posts/day' },
  { value: '5', label: '5 posts/day' },
];

const POST_FORMAT_OPTIONS = [
  { id: 'single', label: 'Single post' },
  { id: 'thread', label: 'Thread' },
  { id: 'mix', label: 'Mix both' },
];

export function ScheduleStep() {
  const { formData, updateFormData } = useFormContext();
  const [deliveryTime, setDeliveryTime] = useState(
    formData.deliveryTime || '08:00'
  );
  const postsPerDay = formData.postsPerDay || '1';
  const postFormat = formData.postFormat || 'single';

  const handlePostsPerDayChange = (value: string) => {
    updateFormData({
      postsPerDay: value,
    });
  };

  const handleDeliveryTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDeliveryTime(value);
    updateFormData({
      deliveryTime: value,
    });
  };

  const handlePostFormatChange = (format: string) => {
    updateFormData({
      postFormat: format,
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Set your <em>schedule</em>
        </h2>
        <p className="text-muted-foreground">
          When should we generate and deliver your posts?
        </p>
      </div>

      {/* Posts per day */}
      <div className="flex flex-col gap-3">
        <Label htmlFor="posts-per-day" className="font-medium">
          Posts per day
        </Label>
        <Select value={postsPerDay} onValueChange={handlePostsPerDayChange}>
          <SelectTrigger id="posts-per-day">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {POSTS_PER_DAY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Delivery time */}
      <div className="flex flex-col gap-3">
        <Label htmlFor="delivery-time" className="font-medium">
          Deliver drafts to me at
        </Label>
        <Input
          id="delivery-time"
          type="time"
          value={deliveryTime}
          onChange={handleDeliveryTimeChange}
        />
      </div>

      {/* Post format */}
      <div className="flex flex-col gap-3">
        <Label className="font-medium">Post format</Label>
        <div className="flex flex-wrap gap-3">
          {POST_FORMAT_OPTIONS.map((format) => (
            <button
              key={format.id}
              onClick={() => handlePostFormatChange(format.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                postFormat === format.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-input hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {format.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-col gap-2 p-4 rounded-lg bg-muted">
        <p className="text-sm font-medium">Your schedule:</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>
            • {postsPerDay} post{postsPerDay !== '1' ? 's' : ''} per day
          </li>
          <li>• Deliver at {deliveryTime}</li>
          <li>
            • Format:{' '}
            {POST_FORMAT_OPTIONS.find((f) => f.id === postFormat)?.label}
          </li>
        </ul>
      </div>
    </div>
  );
}
