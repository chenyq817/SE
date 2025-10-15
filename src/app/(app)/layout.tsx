'use client';

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { useAuth, useFirebase } from "@/firebase";
import { useEffect } from "react";
import { signInAnonymously } from "firebase/auth";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { auth } = useFirebase();

  useEffect(() => {
    if (auth) {
      signInAnonymously(auth).catch((error) => {
        console.error("Anonymous sign-in failed:", error);
      });
    }
  }, [auth]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="min-h-screen w-full">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
