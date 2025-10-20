
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, UserPlus, Check, X, Loader2, MessageSquare } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, where, getDocs, writeBatch, arrayUnion, arrayRemove, doc, getDoc } from 'firebase/firestore';
import type { WithId } from '@/firebase';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type UserProfile = {
  displayName: string;
  avatarId: string;
  imageBase64?: string;
  friendIds?: string[];
  friendRequestsSent?: string[];
  friendRequestsReceived?: string[];
  displayName_lowercase?: string;
};

export default function SocialPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<WithId<UserProfile>[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: currentUserProfile, refetch: refetchCurrentUserProfile } = useDoc<UserProfile>(userProfileRef);

    const [friendRequests, setFriendRequests] = useState<WithId<UserProfile>[]>([]);
    const [friends, setFriends] = useState<WithId<UserProfile>[]>([]);

    const fetchProfilesByIds = async (ids: string[]): Promise<WithId<UserProfile>[]> => {
        if (!firestore || ids.length === 0) return [];
        
        const profilePromises = ids.map(id => getDoc(doc(firestore, 'users', id)));
        
        return Promise.all(profilePromises)
            .then(profileSnapshots => {
                return profileSnapshots
                    .filter(docSnap => docSnap.exists())
                    .map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as WithId<UserProfile>));
            })
            .catch(error => {
                console.error("Error fetching profiles by IDs:", error);
                // Create and emit a contextual error for better debugging
                const permissionError = new FirestorePermissionError({
                    path: `users/[${ids.join(',')}]`, // Indicate which user docs were being fetched
                    operation: 'get',
                });
                errorEmitter.emit('permission-error', permissionError);
                return []; // Return empty array on error
            });
    };


    useEffect(() => {
        if (currentUserProfile?.friendRequestsReceived) {
            fetchProfilesByIds(currentUserProfile.friendRequestsReceived).then(setFriendRequests);
        } else {
            setFriendRequests([]);
        }

        if (currentUserProfile?.friendIds) {
            fetchProfilesByIds(currentUserProfile.friendIds).then(setFriends);
        } else {
            setFriends([]);
        }
    }, [currentUserProfile]);

    const handleSearch = async () => {
        if (!searchTerm.trim() || !firestore || !user) return;
        setIsSearching(true);
        try {
            const usersRef = collection(firestore, "users");
            const q = query(usersRef, where("displayName", ">=", searchTerm), where("displayName", "<=", searchTerm + '\uf8ff'));
            const querySnapshot = await getDocs(q);
            const results = querySnapshot.docs
                .map(doc => ({ ...doc.data() as UserProfile, id: doc.id }))
                .filter(p => p.id !== user.uid);
            setSearchResults(results);
        } catch (error) {
            console.error("Error searching users: ", error);
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'users', operation: 'list' }));
        } finally {
            setIsSearching(false);
        }
    };
    
    const handleFriendAction = async (targetUserId: string, action: 'send' | 'accept' | 'decline' | 'remove') => {
        if (!firestore || !user) return;
        setActionLoading(targetUserId);

        const currentUserRef = doc(firestore, 'users', user.uid);
        const targetUserRef = doc(firestore, 'users', targetUserId);
        
        try {
            const batch = writeBatch(firestore);

            switch (action) {
                case 'send':
                    batch.update(currentUserRef, { friendRequestsSent: arrayUnion(targetUserId) });
                    batch.update(targetUserRef, { friendRequestsReceived: arrayUnion(user.uid) });
                    break;
                case 'accept':
                    batch.update(currentUserRef, { friendIds: arrayUnion(targetUserId), friendRequestsReceived: arrayRemove(targetUserId) });
                    batch.update(targetUserRef, { friendIds: arrayUnion(user.uid), friendRequestsSent: arrayRemove(user.uid) });
                    break;
                case 'decline':
                    batch.update(currentUserRef, { friendRequestsReceived: arrayRemove(targetUserId) });
                    batch.update(targetUserRef, { friendRequestsSent: arrayRemove(user.uid) });
                    break;
                case 'remove':
                     batch.update(currentUserRef, { friendIds: arrayRemove(targetUserId) });
                     batch.update(targetUserRef, { friendIds: arrayRemove(user.uid) });
                    break;
            }
            await batch.commit();
            if (refetchCurrentUserProfile) refetchCurrentUserProfile();
        } catch (error) {
            console.error(`Error during friend action '${action}':`, error);
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `users/${targetUserId}`, operation: 'update' }));
        } finally {
            setActionLoading(null);
        }
    };
    
    const handleMessage = (friendId: string) => {
        if(!user) return;
        const chatId = [user.uid, friendId].sort().join('-');
        router.push(`/chat/${chatId}`);
    };

    const UserCard = ({ profile, type }: { profile: WithId<UserProfile>; type: 'search' | 'request' | 'friend' }) => {
        const avatarSrc = profile.imageBase64 || PlaceHolderImages.find(p => p.id === profile.avatarId)?.imageUrl;
        const isLoading = actionLoading === profile.id;

        const getActionType = () => {
            if (currentUserProfile?.friendIds?.includes(profile.id)) return 'friend';
            if (currentUserProfile?.friendRequestsSent?.includes(profile.id)) return 'sent';
            return 'add';
        };

        return (
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary">
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={avatarSrc} alt={profile.displayName} />
                        <AvatarFallback>{profile.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className="font-medium">{profile.displayName}</p>
                </div>
                <div className="flex gap-2">
                    {isLoading ? <Button size="sm" disabled><Loader2 className="h-4 w-4 animate-spin" /></Button> :
                     type === 'search' && (
                         <>
                            {getActionType() === 'add' && <Button size="sm" onClick={() => handleFriendAction(profile.id, 'send')}><UserPlus className="mr-2 h-4 w-4" /> Add</Button>}
                            {getActionType() === 'sent' && <Button size="sm" variant="outline" disabled>Sent</Button>}
                            {getActionType() === 'friend' && <Button size="sm" variant="ghost" disabled>Friend</Button>}
                         </>
                     )}
                     {type === 'request' && !isLoading && (
                         <>
                            <Button size="icon" onClick={() => handleFriendAction(profile.id, 'accept')}><Check className="w-4 h-4" /></Button>
                            <Button size="icon" variant="outline" onClick={() => handleFriendAction(profile.id, 'decline')}><X className="w-4 h-4" /></Button>
                         </>
                     )}
                     {type === 'friend' && !isLoading && (
                        <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleMessage(profile.id)}>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Message
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleFriendAction(profile.id, 'remove')}>
                                Remove
                            </Button>
                        </div>
                     )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full">
            <Header title="Social Hub" />
            <main className="flex-1 p-4 md:p-6 lg:p-8">
                <Tabs defaultValue="friends" className="max-w-4xl mx-auto">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="friends">My Friends</TabsTrigger>
                        <TabsTrigger value="requests">Requests ({friendRequests.length})</TabsTrigger>
                        <TabsTrigger value="search">Find People</TabsTrigger>
                    </TabsList>
                    <TabsContent value="friends">
                        <Card>
                             <CardHeader>
                                <CardTitle>My Friends</CardTitle>
                                <CardDescription>Manage your connections and start conversations.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2 h-[60vh] overflow-y-auto">
                                {friends.length > 0 ? friends.map(profile => (
                                    <UserCard key={profile.id} profile={profile} type="friend" />
                                )) : (
                                    <p className="text-muted-foreground text-center pt-8">Your friends list is empty. Find some friends!</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="requests">
                         <Card>
                            <CardHeader>
                                <CardTitle>Friend Requests</CardTitle>
                                <CardDescription>Accept or decline requests from other users.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2 h-[60vh] overflow-y-auto">
                               {friendRequests.length > 0 ? friendRequests.map(profile => (
                                   <UserCard key={profile.id} profile={profile} type="request" />
                               )) : (
                                 <p className="text-muted-foreground text-center pt-8">No pending friend requests.</p>
                               )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="search">
                        <Card>
                            <CardHeader>
                                <CardTitle>Find New Friends</CardTitle>
                                <CardDescription>Search for other users on campus by their display name.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Enter a name..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                    <Button onClick={handleSearch} disabled={isSearching}>
                                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <div className="mt-4 space-y-2 h-[50vh] overflow-y-auto">
                                    {isSearching && <p className="text-muted-foreground text-center">Searching...</p>}
                                    {!isSearching && searchResults.length > 0 && searchResults.map(profile => (
                                        <UserCard key={profile.id} profile={profile} type="search" />
                                    ))}
                                    {!isSearching && searchResults.length === 0 && searchTerm && (
                                        <p className="text-muted-foreground text-center pt-4">No users found.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
