"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Newspaper,
  Users,
  Calendar,
  Flame,
  HeartHandshake,
  Anchor,
  Shield,
  Bot,
  UserCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

const menuItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/social", label: "Social", icon: Users },
  { href: "/schedules", label: "Schedules", icon: Calendar },
  { href: "/activities", label: "Activities", icon: Flame },
  { href: "/confessions", label: "Confessions", icon: HeartHandshake },
  { href: "/community", label: "Community", icon: Anchor },
];

const adminMenuItem = { href: "/admin", label: "Admin", icon: Shield };

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Bot className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-semibold font-headline text-primary-foreground">
            Yu Garden Echo
          </h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        
        <SidebarMenu className="mt-auto">
          <SidebarMenuItem>
              <Link href={adminMenuItem.href} legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={pathname === adminMenuItem.href}
                  tooltip={adminMenuItem.label}
                >
                  <adminMenuItem.icon />
                  <span>{adminMenuItem.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <Link href="#" legacyBehavior passHref>
           <SidebarMenuButton tooltip="Profile">
              <UserCircle />
              <span>User Profile</span>
            </SidebarMenuButton>
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}
