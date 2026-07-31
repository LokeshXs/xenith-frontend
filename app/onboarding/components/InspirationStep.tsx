'use client';

import { useFormContext } from '../context/FormContext';
import { InspirationAccountPicker } from '@/components/inspiration-account-picker';
import { CREATOR_PLAN_LIMITS } from '@/lib/plan-limits';

export function InspirationStep() {
  const { formData, updateFormData } = useFormContext();
  const accounts: string[] = formData.inspirationAccounts || [];
  const minAccounts = CREATOR_PLAN_LIMITS.minInspirationAccounts;
  const maxAccounts = CREATOR_PLAN_LIMITS.maxInspirationAccounts;
  const isBelowMinimum = accounts.length < minAccounts;

  return (
    <div className="flex flex-col gap-6 ">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold tracking-tight text-pretty sm:text-3xl text-center sm:text-left">
          Who <em>inspires</em> you?
        </h2>
        <p className="text-muted-foreground">
          Add X accounts whose posts you love — we&apos;ll draw inspiration from
          them. Search for and select {minAccounts} to {maxAccounts} public accounts.
        </p>
      </div>

      <div className="flex flex-col gap-2 max-w-xl">
        <InspirationAccountPicker
          accounts={accounts}
          maxAccounts={maxAccounts}
          onChange={(inspirationAccounts) => updateFormData({ inspirationAccounts })}
        />
        <p className="text-xs text-muted-foreground">
          {accounts.length} / {maxAccounts} selected.
          {isBelowMinimum ? ` Select at least ${minAccounts} to continue.` : ''}
        </p>
      </div>
    </div>
  );
}
