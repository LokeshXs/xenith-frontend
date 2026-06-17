'use client'

import { useRef, type ForwardRefExoticComponent, type RefAttributes } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, useReducedMotion } from 'motion/react'
import {
  ContactIcon,
  LayoutGridIcon,
  LayoutListIcon,
  ReplyIcon,
  SettingsIcon,
} from '@animateicons/react/lucide'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { XenithLogo } from '@/components/brand/xenith-logo'
import { NavUser } from './NavUser'

// Strong ease-out (emil) for the on-load nav stagger.
const EASE_OUT = [0.23, 1, 0.32, 1] as const

// Shared shape across every @animateicons/react icon — they all expose the same
// imperative handle and prop set, so we can hold any of them in NAV_ITEMS.
type AnimatedIconHandle = {
  startAnimation: () => void
  stopAnimation: () => void
}

type AnimatedIcon = ForwardRefExoticComponent<
  {
    size?: number
    duration?: number
    isAnimated?: boolean
    color?: string
    className?: string
  } & RefAttributes<AnimatedIconHandle>
>

type NavItem = {
  title: string
  href: string
  icon: AnimatedIcon
}

const NAV_ITEMS: NavItem[] = [
  { title: "Today's posts", href: '/dashboard/todays-posts', icon: LayoutGridIcon },
  { title: 'All posts', href: '/dashboard/posts', icon: LayoutListIcon },
  { title: 'Suggested Replies', href: '/dashboard/suggested-replies', icon: ReplyIcon },
  { title: 'Settings', href: '/dashboard/settings', icon: SettingsIcon },
  { title: 'Contact Support', href: '/dashboard/contact-support', icon: ContactIcon },
]

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

// Each icon animates on its own hover by default; we also drive it from the
// whole row's hover so it plays when the user hovers anywhere on the nav item.
// On the dashboard's first mount the rows slide in from the left, staggered by
// their index. (motion.li mirrors SidebarMenuItem — a plain styled <li>.)
function NavItemLink({
  item,
  active,
  index,
}: {
  item: NavItem
  active: boolean
  index: number
}) {
  const iconRef = useRef<AnimatedIconHandle>(null)
  const reduce = useReducedMotion()
  const Icon = item.icon

  return (
    <motion.li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className="group/menu-item relative"
      initial={{ opacity: 0, x: reduce ? 0 : -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: reduce ? 0 : 0.35,
        ease: EASE_OUT,
        delay: reduce ? 0 : index * 0.06,
      }}
      onMouseEnter={() => iconRef.current?.startAnimation()}
      onMouseLeave={() => iconRef.current?.stopAnimation()}
    >
      <SidebarMenuButton
        isActive={active}
        tooltip={item.title}
        render={<Link href={item.href} />}
      >
        <Icon ref={iconRef} size={18} className="shrink-0" />
        <span>{item.title}</span>
      </SidebarMenuButton>
    </motion.li>
  )
}

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader >
        <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
          <XenithLogo
            href="/dashboard"
            className="overflow-hidden px-1 group-data-[collapsible=icon]:hidden"
          />
          <SidebarTrigger />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {NAV_ITEMS.map((item, index) => (
              <NavItemLink
                key={item.href}
                item={item}
                active={isActive(pathname, item.href)}
                index={index}
              />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
