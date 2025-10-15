import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { UserCircle } from "lucide-react";

type HeaderProps = {
  title: string;
};

export function Header({ title }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <h1 className="text-lg font-semibold font-headline md:text-xl">{title}</h1>
      </div>
      <Button variant="ghost" size="icon">
        <UserCircle className="h-6 w-6" />
        <span className="sr-only">User Profile</span>
      </Button>
    </header>
  );
}
