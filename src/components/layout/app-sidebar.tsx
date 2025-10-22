
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
  Anchor,
  Shield,
  Bot,
  FileText,
  MessageSquare
} from "lucide-react";
import { useUser } from "@/firebase";

const menuItems = [
  { href: "/", label: "仪表盘", icon: LayoutDashboard },
  { href: "/news", label: "新闻", icon: Newspaper },
  { href: "/post", label: "帖子", icon: FileText },
  { href: "/social", label: "社交", icon: Users },
  { href: "/community", label: "社区", icon: MessageSquare },
];

const adminMenuItem = { href: "/admin", label: "管理后台", icon: Shield };

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const isAdmin = user?.email === 'admin@111.com';

  const isActive = (href: string) => {
    if (href === '/') {
        return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Bot className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-semibold font-headline text-primary-foreground">
            I know hust
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
                className="text-base"
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
                className="text-base"
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
