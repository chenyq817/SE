'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { Search, UserPlus, Check, X, Loader2 } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, writeBatch, arrayUnion, arrayRemove, doc } from 'firebase/firestore';
import type { WithId } from '@/firebase';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type UserProfile = {
  displayName: string;
  avatarId: string;
  imageBase64?: string;
  friendIds?: string[];
  friendRequestsSent?: string[];
  friendRequestsReceived?: string[];
  displayName_lowercase?: string;
};

const UserProfileCard = ({ profile, onAction, actionType }: { profile: WithId<UserProfile>, onAction: (targetUserId: string) => void, actionType: 'add' | 'sent' | 'friend' | 'accept' | 'decline' | 'loading' }) => {
    const avatarSrc = profile.imageBase64 || PlaceHolderImages.find(p => p.id === profile.avatarId)?.imageUrl;

    const renderButton = () => {
        switch(actionType) {
            case 'add':
                return <Button size="sm" onClick={() => onAction(profile.id)}><UserPlus className="mr-2 h-4 w-4" /> Add Friend</Button>;
            case 'sent':
                return <Button size="sm" variant="outline" disabled>Request Sent</Button>;
            case 'friend':
                 return <Button size="sm" variant="ghost" disabled>Friend</Button>;
            case 'accept':
                 return <Button size="sm" variant="default" onClick={() => onAction(profile.id)}><Check className="mr-2 h-4 w-4"/>Accept</Button>;
            case 'decline':
                 return <Button size="sm" variant="destructive" onClick={() => onAction(profile.id)}><X className="mr-2 h-4 w-4"/>Decline</Button>;
             case 'loading':
                return <Button size="sm" disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Working...</Button>
        }
    }

    return (
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary">
            <div className="flex items-center gap-3">
                <Avatar>
                    <AvatarImage src={avatarSrc} />
                    <AvatarFallback>{profile.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="font-medium">{profile.displayName}</p>
            </div>
            {renderButton()}
        </div>
    )
};

export default function SocialPage() {
    const { user } = useUser();
    const firestore = useFirestore();
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

    useEffect(() => {
        const fetchRelatedProfiles = async (ids: string[], setter: React.Dispatch<React.SetStateAction<WithId<UserProfile>[]>>) => {
            if (!firestore || !ids || ids.length === 0) {
                setter([]);
                return;
            }
            // Firestore 'in' queries are limited to 30 elements
            const chunks = [];
            for (let i = 0; i < ids.length; i += 30) {
                chunks.push(ids.slice(i, i + 30));
            }
            
            try {
                const profilePromises = chunks.map(chunk => 
                    getDocs(query(collection(firestore, 'users'), where('__name__', 'in', chunk)))
                );
                const snapshotResults = await Promise.all(profilePromises);
                const profiles = snapshotResults.flatMap(snapshot => 
                    snapshot.docs.map(d => ({ ...d.data() as UserProfile, id: d.id }))
                );
                setter(profiles);
            } catch (error) {
                console.error("Error fetching related profiles:", error);
                setter([]);
            }
        };

        if (currentUserProfile?.friendRequestsReceived) {
            fetchRelatedProfiles(currentUserProfile.friendRequestsReceived, setFriendRequests);
        } else {
            setFriendRequests([]);
        }

        if (currentUserProfile?.friendIds) {
            fetchRelatedProfiles(currentUserProfile.friendIds, setFriends);
        } else {
            setFriends([]);
        }
    }, [currentUserProfile, firestore]);

    const handleSearch = async () => {
        if (!searchTerm.trim() || !firestore || !user) return;
        setIsSearching(true);
        try {
            const usersRef = collection(firestore, "users");
            const lowercasedSearchTerm = searchTerm.toLowerCase();
            const q = query(usersRef, where("displayName_lowercase", ">=", lowercasedSearchTerm), where("displayName_lowercase", "<=", lowercasedSearchTerm + '\uf8ff'));
            const querySnapshot = await getDocs(q);
            const results = querySnapshot.docs
                .map(doc => ({ ...doc.data() as UserProfile, id: doc.id }))
                .filter(p => p.id !== user.uid); 
            setSearchResults(results);
        } catch (error) {
            console.error("Error searching users: ", error);
        }
        setIsSearching(false);
    };

    const handleSendFriendRequest = async (targetUserId: string) => {
        if (!firestore || !user) return;
        setActionLoading(targetUserId);

        const currentUserRef = doc(firestore, 'users', user.uid);
        const targetUserRef = doc(firestore, 'users', targetUserId);
        
        const batch = writeBatch(firestore);
        batch.update(currentUserRef, { friendRequestsSent: arrayUnion(targetUserId) });
        batch.update(targetUserRef, { friendRequestsReceived: arrayUnion(user.uid) });

        await batch.commit();
        if (refetchCurrentUserProfile) refetchCurrentUserProfile();
        setActionLoading(null);
    };

    const handleAcceptFriendRequest = async (requesterId: string) => {
        if (!firestore || !user) return;
        setActionLoading(requesterId);

        const currentUserRef = doc(firestore, 'users', user.uid);
        const requesterUserRef = doc(firestore, 'users', requesterId);

        const batch = writeBatch(firestore);

        batch.update(currentUserRef, { friendIds: arrayUnion(requesterId), friendRequestsReceived: arrayRemove(requesterId) });
        batch.update(requesterUserRef, { friendIds: arrayUnion(user.uid), friendRequestsSent: arrayRemove(user.uid) });
        
        await batch.commit();

        if (refetchCurrentUserProfile) refetchCurrentUserProfile();
        setActionLoading(null);
    }
    
    const handleDeclineFriendRequest = async (requesterId: string) => {
        if (!firestore || !user) return;
        setActionLoading(requesterId);

        const currentUserRef = doc(firestore, 'users', user.uid);
        const requesterUserRef = doc(firestore, 'users', requesterId);
        
        const batch = writeBatch(firestore);
        batch.update(currentUserRef, { friendRequestsReceived: arrayRemove(requesterId) });
        batch.update(requesterUserRef, { friendRequestsSent: arrayRemove(user.uid) });
        
        await batch.commit();

        if (refetchCurrentUserProfile) refetchCurrentUserProfile();
        setActionLoading(null);
    }

    const getActionType = (targetUserId: string): 'add' | 'sent' | 'friend' | 'loading' => {
        if(actionLoading === targetUserId) return 'loading';
        if (currentUserProfile?.friendIds?.includes(targetUserId)) return 'friend';
        if (currentUserProfile?.friendRequestsSent?.includes(targetUserId)) return 'sent';
        return 'add';
    }

    return (
        <div className="flex flex-col h-full">
            <Header title="Social Hub" />
            <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-8">
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    <div className="space-y-8">
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
                                <div className="mt-4 space-y-2 h-64 overflow-y-auto">
                                    {isSearching && <p className="text-muted-foreground text-center">Searching...</p>}
                                    {!isSearching && searchResults.length > 0 && searchResults.map(profile => (
                                        <UserProfileCard 
                                            key={profile.id}
                                            profile={profile}
                                            onAction={handleSendFriendRequest}
                                            actionType={getActionType(profile.id)}
                                        />
                                    ))}
                                    {!isSearching && searchResults.length === 0 && searchTerm && (
                                        <p className="text-muted-foreground text-center pt-4">No users found.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Friend Requests</CardTitle>
                                <CardDescription>Accept or decline requests from other users.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2 h-48 overflow-y-auto">
                               {friendRequests.length > 0 ? friendRequests.map(profile => (
                                   <div key={profile.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary">
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={profile.imageBase64 || PlaceHolderImages.find(p => p.id === profile.avatarId)?.imageUrl} />
                                                <AvatarFallback>{profile.displayName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <p className="font-medium">{profile.displayName}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {actionLoading === profile.id ? (
                                                <Button size="sm" disabled><Loader2 className="h-4 w-4 animate-spin" /> </Button>
                                            ) : (
                                                <>
                                                 <Button size="sm" onClick={() => handleAcceptFriendRequest(profile.id)}><Check className="w-4 h-4"/></Button>
                                                 <Button size="sm" variant="outline" onClick={() => handleDeclineFriendRequest(profile.id)}><X className="w-4 h-4"/></Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                               )) : (
                                 <p className="text-muted-foreground text-center py-8">No pending friend requests.</p>
                               )}
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>My Friends</CardTitle>
                            <CardDescription>Manage your connections and start conversations.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 h-[41.5rem] overflow-y-auto">
                            {friends.length > 0 ? friends.map(profile => (
                                <div key={profile.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary">
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={profile.imageBase64 || PlaceHolderImages.find(p => p.id === profile.avatarId)?.imageUrl} />
                                            <AvatarFallback>{profile.displayName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <p className="font-medium">{profile.displayName}</p>
                                    </div>
                                    {/* Placeholder for future actions like 'Message' or 'Remove' */}
                                </div>
                            )) : (
                                <p className="text-muted-foreground text-center py-8">Your friends list is empty. Find some friends!</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}