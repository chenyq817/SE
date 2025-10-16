
'use client';

import { useState } from "react";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Columns, Send } from "lucide-react";
import { useUser, useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, serverTimestamp, orderBy, doc } from "firebase/firestore";
import type { WithId } from "@/firebase";

type UserProfile = {
  displayName: string;
};

type WallMessage = {
  content: string;
  authorId: string;
  authorName: string;
  createdAt: any;
};

const WallMessageCard = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={`p-4 bg-yellow-200 dark:bg-yellow-700 dark:text-yellow-100 rounded-lg shadow-md transform -rotate-1 hover:rotate-0 hover:scale-105 transition-transform ${className}`}>
        <p className="font-serif">{children}</p>
    </div>
)

export default function CommunityPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [newWallMessage, setNewWallMessage] = useState("");

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const wallMessagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "wallMessages"), orderBy("createdAt", "desc"));
  }, [firestore]);

  const { data: wallMessages, isLoading: wallMessagesLoading } = useCollection<WallMessage>(wallMessagesQuery);
  
  const handlePostWallMessage = () => {
    if (!newWallMessage.trim() || !user || !firestore || !userProfile) return;

    const messageData: WallMessage = {
      content: newWallMessage,
      authorId: user.uid,
      authorName: userProfile.displayName,
      createdAt: serverTimestamp(),
    };

    addDocumentNonBlocking(collection(firestore, "wallMessages"), messageData);
    setNewWallMessage("");
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Community Fun" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="grid gap-8 lg:grid-cols-1">
          
          {/* HUST Bottle feature temporarily disabled
          <Card className="hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Waves className="w-8 h-8 text-primary" />
                    <div>
                        <CardTitle className="font-headline text-2xl">HUST Bottle</CardTitle>
                        <CardDescription>Send a message into the digital sea, or find one from a stranger.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="text-center space-y-4">
                <p className="text-6xl">🌊</p>
                <p className="text-muted-foreground">The tide is calm. What will you do?</p>
            </CardContent>
            <CardFooter className="flex gap-4 justify-center">
                <Button size="lg" onClick={() => setIsThrowing(true)} disabled={!user}>
                    <Sailboat className="mr-2"/> Throw a Bottle
                </Button>
                <Button size="lg" variant="outline" onClick={handlePickBottle} disabled={!user}>
                    <Inbox className="mr-2"/> Pick One Up
                </Button>
            </CardFooter>
          </Card>
          */}

          <Card className="hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
                 <div className="flex items-center gap-3">
                    <Columns className="w-8 h-8 text-primary" />
                    <div>
                        <CardTitle className="font-headline text-2xl">WeChat on the Wall</CardTitle>
                        <CardDescription>Leave a public message for everyone to see.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 bg-secondary/50 rounded-lg h-72 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-4">
                    {wallMessagesLoading && <p className="text-muted-foreground">Loading messages...</p>}
                    {wallMessages && wallMessages.map((msg, index) => (
                      <WallMessageCard key={msg.id} className={index % 3 === 0 ? 'rotate-1' : index % 3 === 1 ? '-rotate-2' : ''}>
                        {msg.content}
                      </WallMessageCard>
                    ))}
                    {!wallMessagesLoading && wallMessages?.length === 0 && (
                      <div className="col-span-full text-center text-muted-foreground self-center">
                          The wall is empty. Be the first to write something!
                      </div>
                    )}
                </div>
                 <div className="flex gap-2">
                    <Textarea 
                      placeholder="Write on the wall..." 
                      disabled={!user}
                      value={newWallMessage}
                      onChange={(e) => setNewWallMessage(e.target.value)}
                    />
                    <Button 
                      size="icon" 
                      aria-label="Post message" 
                      disabled={!user || !newWallMessage.trim()}
                      onClick={handlePostWallMessage}
                    >
                      <Send/>
                    </Button>
                 </div>
            </CardContent>
          </Card>

        </div>
      </main>

      {/* Dialogs for HUST Bottle are kept in case the feature is re-enabled, but won't be triggered */}
      
    </div>
  );
}

    