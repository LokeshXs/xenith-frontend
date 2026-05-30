'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  IconArticle,
  IconBrandX,
  IconCalendarTime,
  IconLayoutDashboard,
  IconSettings,
  type TablerIcon,
} from '@tabler/icons-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { NavUser } from './NavUser'

type NavItem = {
  title: string
  href: string
  icon: TablerIcon
}

const NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: IconLayoutDashboard },
  { title: 'Posts', href: '/dashboard/posts', icon: IconArticle },
  { title: 'Schedule', href: '/dashboard/schedule', icon: IconCalendarTime },
  { title: 'Settings', href: '/dashboard/settings', icon: IconSettings },
]

function isActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 overflow-hidden px-1 font-semibold tracking-tight group-data-[collapsible=icon]:hidden"
          >
            <IconBrandX className="size-5 shrink-0" />
            <span className="truncate">X Posts</span>
          </Link>
          <SidebarTrigger />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {NAV_ITEMS.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={isActive(pathname, item.href)}
                  tooltip={item.title}
                  render={<Link href={item.href} />}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
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
