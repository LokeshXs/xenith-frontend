'use client';

import { useState } from 'react';
import { useFormContext } from '../context/FormContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const USERNAME_REGEX = /^[A-Za-z0-9_]{1,15}$/;

export function InspirationStep() {
  const { formData, updateFormData } = useFormContext();
  const accounts: string[] = formData.inspirationAccounts || [];
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');

  const addAccount = () => {
    // Strip a leading @ the user may have typed before the username.
    const normalized = draft.trim().replace(/^@+/, '');

    if (!normalized) {
      setError('Please enter a username.');
      return;
    }
    if (/\s/.test(normalized)) {
      setError("Username can't contain spaces.");
      return;
    }
    if (!USERNAME_REGEX.test(normalized)) {
      setError('Use 1–15 letters, numbers, or underscores.');
      return;
    }

    const isDuplicate = accounts.some(
      (a) => a.toLowerCase() === normalized.toLowerCase(),
    );
    if (isDuplicate) {
      setError('You already added that account.');
      setDraft('');
      return;
    }

    updateFormData({ inspirationAccounts: [...accounts, normalized] });
    setDraft('');
    setError('');
  };

  const removeAccount = (name: string) => {
    updateFormData({
      inspirationAccounts: accounts.filter((a) => a !== name),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addAccount();
    }
  };

  return (
    <div className="flex flex-col gap-6 ">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Who <em>inspires</em> you?{' '}
          <span className="text-base font-normal text-muted-foreground">
            (optional)
          </span>
        </h2>
        <p className="text-muted-foreground">
          Add X accounts whose posts you love — we'll draw inspiration from
          them.
        </p>
      </div>

      {/* Username Input */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="@username"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (error) setError('');
            }}
            onKeyDown={handleKeyDown}
            aria-invalid={!!error}
          />
          <Button
            type="button"
            variant="outline"
            onClick={addAccount}
            disabled={!draft.trim()}
          >
            Add
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {/* Added Accounts */}
      {accounts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {accounts.map((name) => (
            <Badge key={name} variant="secondary" className="gap-1 pr-1">
              @{name}
              <button
                type="button"
                onClick={() => removeAccount(name)}
                aria-label={`Remove @${name}`}
                className="ml-1 rounded-full p-0.5 hover:bg-background/60"
              >
                ✕
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
