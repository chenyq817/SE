
'use client';

import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Search } from "lucide-react";

export default function SocialPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Social Hub" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Find Friends</CardTitle>
              <CardDescription>Search for other students on campus to connect with.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex w-full items-center space-x-2">
                <Input type="text" placeholder="Search by name or email..." />
                <Button type="submit">
                  <Search className="mr-2 h-4 w-4" /> Search
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Friends</CardTitle>
              <CardDescription>Your list of connections.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="text-center text-muted-foreground py-8">
                 <p>Your friend list is empty.</p>
                 <p className="text-sm">Use the search above to find and add friends.</p>
               </div>
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <CardTitle>Private Messages</CardTitle>
              <CardDescription>Chat directly with your friends.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="text-center text-muted-foreground py-8">
                 <p>No active conversations.</p>
               </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
