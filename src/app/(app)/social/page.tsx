'use client';

import { useState } from 'react';
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, UserPlus, Loader2 } from 'lucide-react';
import { useFirestore, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type UserSearchResult = {
    id: string;
    displayName: string;
    avatarId: string;
    imageBase64?: string;
};

export default function SocialPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchPerformed, setSearchPerformed] = useState(false);

    const handleSearch = async () => {
        if (!firestore || !searchQuery.trim()) {
            setSearchResults([]);
            setSearchPerformed(true);
            return;
        };

        setIsLoading(true);
        setSearchPerformed(true);
        const usersRef = collection(firestore, 'users');
        
        const q = query(
            usersRef, 
            where('displayName', '>=', searchQuery),
            where('displayName', '<=', searchQuery + '\uf8ff')
        );

        try {
            const querySnapshot = await getDocs(q);
            const results: UserSearchResult[] = [];
            querySnapshot.forEach((doc) => {
                if (doc.id !== user?.uid) {
                    const data = doc.data();
                    if (data.displayName.toLowerCase().startsWith(searchQuery.toLowerCase())) {
                      results.push({
                          id: doc.id,
                          displayName: data.displayName,
                          avatarId: data.avatarId,
                          imageBase64: data.imageBase64,
                      });
                    }
                }
            });
            setSearchResults(results);
        } catch (error: any) {
            if (error.code === 'permission-denied') {
                const contextualError = new FirestorePermissionError({
                    operation: 'list',
                    path: 'users',
                });
                errorEmitter.emit('permission-error', contextualError);
            } else {
                console.error("An unexpected error occurred during user search:", error);
            }
            setSearchResults([]);
        } finally {
            setIsLoading(false);
        }
    };


    return (
    <div className="flex flex-col h-full">
      <Header title="Social Hub" />
      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-8">
        <div className="max-w-4xl mx-auto">

            {/* Find Friends Card */}
            <Card>
              <CardHeader>
                <CardTitle>Find Friends</CardTitle>
                <CardDescription>Search for other users on the platform by their display name.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex w-full items-center space-x-2">
                    <Input 
                        type="text" 
                        placeholder="Enter display name..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button onClick={handleSearch} disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        <span className="ml-2 hidden sm:inline">Search</span>
                    </Button>
                </div>
              </CardContent>
              {searchPerformed && (
                <CardFooter className="flex flex-col items-start gap-4">
                    <h3 className="font-semibold text-lg">Search Results</h3>
                    {isLoading ? (
                        <p>Searching...</p>
                    ) : searchResults.length > 0 ? (
                        <ul className="w-full space-y-2">
                        {searchResults.map(foundUser => {
                            const avatarSrc = foundUser.imageBase64 || PlaceHolderImages.find(p => p.id === foundUser.avatarId)?.imageUrl;
                            return (
                            <li key={foundUser.id} className="flex items-center justify-between p-2 rounded-lg border">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={avatarSrc} />
                                        <AvatarFallback>{foundUser.displayName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span>{foundUser.displayName}</span>
                                </div>
                                <Button variant="outline" size="sm" disabled>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Add Friend
                                </Button>
                            </li>
                            )
                        })}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground">No users found with that name.</p>
                    )}
                </CardFooter>
              )}
            </Card>

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
