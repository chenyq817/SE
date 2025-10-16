
'use client';

import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";

export default function SocialPage() {
    return (
        <div className="flex flex-col h-full">
          <Header title="Social Hub" />
          <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-8">
            <div className="max-w-4xl mx-auto">
    
                {/* Placeholder for Friend Requests */}
                <Card className="mt-8">
                     <CardHeader>
                        <CardTitle>Friend Requests</CardTitle>
                         <CardDescription>Accept or decline requests from other users.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground text-center py-8">Friend requests will appear here.</p>
                    </CardContent>
                </Card>
    
                {/* Placeholder for Friends List */}
                <Card className="mt-8">
                     <CardHeader>
                        <CardTitle>My Friends</CardTitle>
                         <CardDescription>Manage your connections and start conversations.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <p className="text-muted-foreground text-center py-8">Your friends list will appear here.</p>
                    </CardContent>
                </Card>
    
            </div>
          </main>
        </div>
        );
}
