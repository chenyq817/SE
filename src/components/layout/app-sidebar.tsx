
"use client";

import { usePathname } from "next/navigation";
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
  Anchor,
  Shield,
  Bot,
  MessageSquare,
  MessagesSquare,
} from "lucide-react";
import { useUser } from "@/firebase";

const menuItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/post", label: "Posts", icon: MessageSquare },
  { href: "/social", label: "Social", icon: Users },
  { href: "/chat", label: "Chats", icon: MessagesSquare },
  { href: "/schedules", label: "Schedules", icon: Calendar },
  { href: "/activities", label: "Activities", icon: Flame },
  { href: "/community", label: "Community", icon: Anchor },
];

const adminMenuItem = { href: "/admin", label: "Admin", icon: Shield };

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const isAdmin = user?.email === 'admin@111.com';

  const isActive = (href: string) => {
    return href === '/' ? pathname === href : pathname.startsWith(href);
  };

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
              <SidebarMenuButton
                href={item.href}
                isActive={isActive(item.href)}
                tooltip={item.label}
              >
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        
        {isAdmin && (
          <SidebarMenu className="mt-auto">
            <SidebarMenuItem>
              <SidebarMenuButton
                href={adminMenuItem.href}
                isActive={isActive(adminMenuItem.href)}
                tooltip={adminMenuItem.label}
              >
                  <adminMenuItem.icon />
                  <span>{adminMenuItem.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarContent>
      <SidebarFooter>
        {/* User profile button removed from here, now handled by UserNav in Header */}
      </SidebarFooter>
    </Sidebar>
  );
}

    