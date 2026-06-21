import { IconLogout } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function LogoutButton({ className }: { className?: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn("bg-background/80 backdrop-blur-sm", className)}
      nativeButton={false}
      render={<a href="/signout" />}
    >
      <IconLogout data-icon="inline-start" aria-hidden />
      Log out
    </Button>
  )
}
