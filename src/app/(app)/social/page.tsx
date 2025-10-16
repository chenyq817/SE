
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
import { Input } from "@/components/ui/input";
import { UserPlus, Search, Loader2 } from "lucide-react";
import { useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import type { WithId } from "@/firebase";

type UserProfile = {
  displayName: string;
  avatarId: string;
  imageBase64?: string;
};

export default function SocialPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<WithId<UserProfile>[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !firestore) return;
    setIsSearching(true);
    setSearchAttempted(true);

    const usersRef = collection(firestore, "users");
    // For a real app, you might want a more sophisticated search (e.g., using a third-party service like Algolia),
    // as Firestore's native querying capabilities for text search are limited.
    // Here, we'll do a simple "equals" query.
    const q = query(usersRef, where("displayName", "==", searchQuery.trim()));
    
    try {
      const querySnapshot = await getDocs(q);
      const users: WithId<UserProfile>[] = [];
      querySnapshot.forEach((doc) => {
        // Exclude current user from search results
        if (doc.id !== user?.uid) {
            users.push({ id: doc.id, ...doc.data() } as WithId<UserProfile>);
        }
      });
      setSearchResults(users);
    } catch (error) {
      console.error("Error searching for users:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Social Hub" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Find Friends</CardTitle>
              <CardDescription>Search for other students on campus by their exact display name.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex w-full items-center space-x-2">
                <Input 
                  type="text" 
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
                  {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                   Search
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {searchAttempted && (
             <Card>
                <CardHeader>
                  <CardTitle>Search Results</CardTitle>
                </CardHeader>
                <CardContent>
                  {isSearching ? (
                     <div className="text-center text-muted-foreground py-8">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                        <p className="mt-2">Searching...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-4">
                        {searchResults.map(foundUser => {
                           const avatarSrc = foundUser.imageBase64 || PlaceHolderImages.find(img => img.id === foundUser.avatarId)?.imageUrl;
                           return (
                                <div key={foundUser.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50">
                                    <div className="flex items-center gap-4">
                                         <Avatar>
                                            {avatarSrc && <AvatarImage src={avatarSrc} alt={foundUser.displayName} />}
                                            <AvatarFallback>{foundUser.displayName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <p className="font-semibold">{foundUser.displayName}</p>
                                    </div>
                                    <Button variant="outline" size="sm">
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Add Friend
                                    </Button>
                                </div>
                           )
                        })}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <p>No users found matching "{searchQuery}".</p>
                      <p className="text-sm">Try a different name.</p>
                    </div>
                  )}
                </CardContent>
            </Card>
          )}

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
