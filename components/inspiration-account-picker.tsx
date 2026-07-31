'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { IconLoader2, IconX } from '@tabler/icons-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { searchXUsers, type XAccountSearchResult } from '@/lib/services/twitter'

const USERNAME_FRAGMENT = /^[A-Za-z0-9_]{1,15}$/
const SEARCH_DELAY_MS = 350

type InspirationAccountPickerProps = {
  accounts: string[]
  onChange: (accounts: string[]) => void
  maxAccounts: number
  label?: string
}

function normalizedQuery(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed || trimmed === '@') return ''
  const handle = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed
  return USERNAME_FRAGMENT.test(handle) ? handle : null
}

function fallbackInitial(result: XAccountSearchResult) {
  return (result.name ?? result.username).trim().charAt(0).toUpperCase() || '?'
}

export function InspirationAccountPicker({
  accounts,
  onChange,
  maxAccounts,
  label = 'Search X accounts',
}: InspirationAccountPickerProps) {
  const [draft, setDraft] = useState('')
  const [results, setResults] = useState<XAccountSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const listboxId = useId()
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const query = normalizedQuery(draft)
  const invalidInput = draft.trim() !== '' && query === null
  const atCapacity = accounts.length >= maxAccounts
  const selected = useMemo(
    () => new Set(accounts.map((account) => account.toLowerCase())),
    [accounts],
  )

  const selectableIndex = (start: number, direction: 1 | -1) => {
    if (results.length === 0) return -1
    for (let offset = 0; offset < results.length; offset += 1) {
      const index = (start + direction * offset + results.length) % results.length
      const result = results[index]
      if (result && !selected.has(result.username.toLowerCase())) return index
    }
    return -1
  }

  useEffect(() => {
    return () => {
      if (blurTimeout.current) clearTimeout(blurTimeout.current)
    }
  }, [])

  useEffect(() => {
    if (!query || invalidInput || atCapacity) return

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setIsLoading(true)
      setSearchError('')
      setIsOpen(true)
      try {
        const next = await searchXUsers(query, controller.signal)
        if (controller.signal.aborted) return
        setResults(next)
        const firstAvailable = next.findIndex(
          (result) => !selected.has(result.username.toLowerCase()),
        )
        setActiveIndex(firstAvailable)
      } catch {
        if (!controller.signal.aborted) {
          setResults([])
          setActiveIndex(-1)
          setSearchError("Couldn’t search X right now. Try again.")
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }, SEARCH_DELAY_MS)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, invalidInput, atCapacity, selected])

  const selectResult = (result: XAccountSearchResult) => {
    if (atCapacity || selected.has(result.username.toLowerCase())) return
    onChange([...accounts, result.username])
    setDraft('')
    setResults([])
    setSearchError('')
    setActiveIndex(-1)
    setIsOpen(false)
  }

  const removeAccount = (account: string) => {
    onChange(accounts.filter((existing) => existing !== account))
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setIsOpen(true)
      const direction = event.key === 'ArrowDown' ? 1 : -1
      const start =
        activeIndex >= 0
          ? activeIndex + direction
          : direction === 1
            ? 0
            : results.length - 1
      setActiveIndex(selectableIndex(start, direction))
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      const active = results[activeIndex]
      if (active && !selected.has(active.username.toLowerCase())) selectResult(active)
      return
    }
    if (event.key === 'Escape') {
      setIsOpen(false)
      setActiveIndex(-1)
    }
  }

  const showDropdown = isOpen && !!query && !invalidInput && !atCapacity
  const activeResult = results[activeIndex]

  return (
    <div className="flex max-w-xl flex-col gap-3">
      <div className="relative">
        <Input
          type="text"
          aria-label={label}
          role="combobox"
          aria-autocomplete="list"
          aria-controls={showDropdown ? listboxId : undefined}
          aria-expanded={showDropdown}
          aria-activedescendant={
            activeResult && showDropdown ? `${listboxId}-option-${activeIndex}` : undefined
          }
          placeholder="@username"
          value={draft}
          disabled={atCapacity}
          onChange={(event) => {
            setDraft(event.target.value)
            setResults([])
            setActiveIndex(-1)
            setIsLoading(false)
            setSearchError('')
            setIsOpen(Boolean(normalizedQuery(event.target.value)))
          }}
          onFocus={() => {
            if (query && !invalidInput && !atCapacity) setIsOpen(true)
          }}
          onBlur={() => {
            blurTimeout.current = setTimeout(() => setIsOpen(false), 120)
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={invalidInput || !!searchError}
        />

        {showDropdown && (
          <div
            id={listboxId}
            role="listbox"
            aria-label="X account suggestions"
            className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border bg-popover p-1 shadow-lg"
          >
            {isLoading ? (
              <p className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground">
                <IconLoader2 className="size-4 animate-spin" /> Searching X…
              </p>
            ) : searchError ? (
              <p className="px-3 py-2.5 text-sm text-destructive">{searchError}</p>
            ) : results.length === 0 ? (
              <p className="px-3 py-2.5 text-sm text-muted-foreground">
                No public X accounts found for @{query}.
              </p>
            ) : (
              results.map((result, index) => {
                const isAdded = selected.has(result.username.toLowerCase())
                const isActive = activeIndex === index
                return (
                  <button
                    key={result.id}
                    id={`${listboxId}-option-${index}`}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    disabled={isAdded}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectResult(result)}
                    className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${
                      isAdded
                        ? 'cursor-not-allowed opacity-50'
                        : isActive
                          ? 'bg-muted'
                          : 'hover:bg-muted'
                    }`}
                  >
                    <Avatar size="sm">
                      {result.avatar && <AvatarImage src={result.avatar} alt="" />}
                      <AvatarFallback>{fallbackInitial(result)}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {result.name ?? result.username}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        @{result.username}
                      </span>
                    </span>
                    {isAdded && <span className="text-xs text-muted-foreground">Added</span>}
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>

      {invalidInput ? (
        <p className="text-sm text-destructive">Use letters, numbers, and underscores only.</p>
      ) : searchError && !showDropdown ? (
        <p className="text-sm text-destructive">{searchError}</p>
      ) : null}

      {accounts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {accounts.map((account) => (
            <Badge key={account} variant="secondary" className="gap-1 pr-1">
              @{account}
              <button
                type="button"
                onClick={() => removeAccount(account)}
                aria-label={`Remove @${account}`}
                className="ml-0.5 inline-flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <IconX className="size-3.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
