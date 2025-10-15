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
  UserCircle,
  KeyRound,
} from "lucide-react";
import { useUser } from "@/firebase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

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
  const { user } = useUser();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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
                isActive={pathname === item.href}
                tooltip={item.label}
              >
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        
        <SidebarMenu className="mt-auto">
          <SidebarMenuItem>
            <SidebarMenuButton
              href={adminMenuItem.href}
              isActive={pathname === adminMenuItem.href}
              tooltip={adminMenuItem.label}
            >
                <adminMenuItem.icon />
                <span>{adminMenuItem.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <DialogTrigger asChild>
            <SidebarMenuButton tooltip="Profile">
              <div className="flex items-center gap-2">
                  <UserCircle />
                  <span>User Profile</span>
                </div>
            </SidebarMenuButton>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>User Profile</DialogTitle>
              <DialogDescription>
                You are currently logged in anonymously.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <KeyRound className="w-4 h-4 text-muted-foreground"/>
                <span className="font-mono text-xs text-muted-foreground break-all">{user?.uid ?? 'Loading...'}</span>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarFooter>
    </Sidebar>
  );
}
