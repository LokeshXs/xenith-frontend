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
import { TimePicker, formatTime12 } from '@/components/ui/time-picker';
import { CREATOR_PLAN_LIMITS } from '@/lib/plan-limits';

const POSTS_PER_DAY_OPTIONS = Array.from(
  { length: CREATOR_PLAN_LIMITS.maxPostsPerDay },
  (_, index) => {
    const count = index + 1;
    return {
      value: String(count),
      label: `${count} post${count === 1 ? '' : 's'}/day`,
    };
  },
);



export function ScheduleStep() {
  const { formData, updateFormData } = useFormContext();
  const [deliveryTime, setDeliveryTime] = useState(
    formData.deliveryTime || '08:00'
  );
  const postsPerDay = formData.postsPerDay || '1';


  const handlePostsPerDayChange = (value: string | null) => {
    if (typeof value !== 'string') return;
    updateFormData({
      postsPerDay: value,
    });
  };

  const handleDeliveryTimeChange = (value: string) => {
    setDeliveryTime(value);
    updateFormData({
      deliveryTime: value,
    });
  };



  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold tracking-tight text-pretty sm:text-3xl text-center sm:text-left">
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
        <TimePicker
          id="delivery-time"
          value={deliveryTime}
          onChange={handleDeliveryTimeChange}
        />
      </div>


      {/* Summary */}
      <div className="flex flex-col gap-2 p-4 rounded-lg bg-muted">
        <p className="text-sm font-medium">Your schedule:</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>
            • {postsPerDay} post{postsPerDay !== '1' ? 's' : ''} per day
          </li>
          <li>• Deliver at {formatTime12(deliveryTime)}</li>
        
        </ul>
      </div>
    </div>
  );
}
