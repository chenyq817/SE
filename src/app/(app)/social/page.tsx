
'use client';

import { useState, useMemo, useEffect } from "react";
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
import { UserPlus, Search, Loader2, MessageSquare, UserX, Check, X } from "lucide-react";
import { useFirestore, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useCollection, useDoc, FirestorePermissionError, errorEmitter } from "@/firebase";
import { collection, query, where, getDocs, doc, writeBatch, arrayUnion, arrayRemove, serverTimestamp, orderBy } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import type { WithId } from "@/firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type UserProfile = {
  displayName: string;
  avatarId: string;
  imageBase64?: string;
  friendIds?: string[];
};

type FriendRequest = {
    fromId: string;
    fromName: string;
    fromAvatarId?: string;
    fromImageBase64?: string;
    toId: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: any;
}

type Conversation = {
    participantIds: string[];
    lastMessage: string;
    updatedAt: any;
}

type Message = {
    conversationId: string;
    senderId: string;
    content: string;
    createdAt: any;
}

// --- Sub-components for Social Page ---

const FriendRequestCard = ({ request, onUpdate }: { request: WithId<FriendRequest>, onUpdate: () => void }) => {
    const firestore = useFirestore();
    const { user } = useUser();

    const handleAccept = async () => {
        if (!firestore || !user) return;

        const batch = writeBatch(firestore);

        // Update request status
        const requestRef = doc(firestore, "friendRequests", request.id);
        batch.update(requestRef, { status: 'accepted' });

        // Add each user to the other's friend list
        const currentUserRef = doc(firestore, "users", user.uid);
        batch.update(currentUserRef, { friendIds: arrayUnion(request.fromId) });
        
        const senderUserRef = doc(firestore, "users", request.fromId);
        batch.update(senderUserRef, { friendIds: arrayUnion(user.uid) });

        await batch.commit();
        onUpdate();
    };

    const handleDecline = () => {
        if (!firestore) return;
        const requestRef = doc(firestore, "friendRequests", request.id);
        updateDocumentNonBlocking(requestRef, { status: 'rejected' });
        onUpdate();
    };

    const avatarSrc = request.fromImageBase64 || PlaceHolderImages.find(img => img.id === request.fromAvatarId)?.imageUrl;

    return (
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50">
            <div className="flex items-center gap-4">
                <Avatar>
                    {avatarSrc && <AvatarImage src={avatarSrc} alt={request.fromName} />}
                    <AvatarFallback>{request.fromName.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="font-semibold">{request.fromName}</p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8 bg-green-500 hover:bg-green-600 text-white" onClick={handleAccept}>
                    <Check className="h-4 w-4" />
                </Button>
                 <Button variant="outline" size="icon" className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white" onClick={handleDecline}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

const FriendCard = ({ friend, onMessage, onRemove }: { friend: WithId<UserProfile>, onMessage: (friend: WithId<UserProfile>) => void, onRemove: (friendId: string) => void }) => {
    const avatarSrc = friend.imageBase64 || PlaceHolderImages.find(img => img.id === friend.avatarId)?.imageUrl;
    return (
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50">
            <div className="flex items-center gap-4">
                <Avatar>
                    {avatarSrc && <AvatarImage src={avatarSrc} alt={friend.displayName} />}
                    <AvatarFallback>{friend.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="font-semibold">{friend.displayName}</p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onMessage(friend)}>
                    <MessageSquare className="mr-2 h-4 w-4" /> Message
                </Button>
                <Button variant="destructive" size="sm" onClick={() => onRemove(friend.id)}>
                    <UserX className="mr-2 h-4 w-4" /> Remove
                </Button>
            </div>
        </div>
    );
}

const PrivateMessageDialog = ({ friend, open, onOpenChange }: { friend: WithId<UserProfile> | null, open: boolean, onOpenChange: (open: boolean) => void }) => {
    const firestore = useFirestore();
    const { user } = useUser();
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState("");

    // Effect to find or create a conversation
    useEffect(() => {
        if (!firestore || !user || !friend) return;
        
        const findConversation = async () => {
            const conversationsRef = collection(firestore, 'conversations');
            // Firestore allows querying for arrays containing elements. We create a canonical participants array to query.
            const participantIds = [user.uid, friend.id].sort();
            const q = query(conversationsRef, where('participantIds', '==', participantIds));

            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                setConversationId(querySnapshot.docs[0].id);
            } else {
                // Create conversation
                const newConvRef = await addDoc(conversationsRef, {
                    participantIds,
                    lastMessage: "",
                    updatedAt: serverTimestamp()
                });
                setConversationId(newConvRef.id);
            }
        };
        findConversation();

    }, [firestore, user, friend]);

    const messagesQuery = useMemoFirebase(() => {
        if (!firestore || !conversationId) return null;
        return query(collection(firestore, 'conversations', conversationId, 'messages'), orderBy('createdAt', 'asc'));
    }, [firestore, conversationId]);

    const { data: messages } = useCollection<Message>(messagesQuery);
    
    const handleSendMessage = () => {
        if (!newMessage.trim() || !firestore || !user || !conversationId) return;
        
        const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');
        addDocumentNonBlocking(messagesRef, {
            conversationId,
            senderId: user.uid,
            content: newMessage,
            createdAt: serverTimestamp(),
        });
        
        // Also update the last message on the conversation for previews/notifications
        const conversationRef = doc(firestore, 'conversations', conversationId);
        updateDocumentNonBlocking(conversationRef, {
            lastMessage: newMessage,
            updatedAt: serverTimestamp(),
        });

        setNewMessage("");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Chat with {friend?.displayName}</DialogTitle>
                    <DialogDescription>Your private conversation.</DialogDescription>
                </DialogHeader>
                <div className="h-96 flex flex-col p-2 space-y-4 bg-secondary/50 rounded-lg overflow-y-auto">
                    {messages?.map(msg => (
                        <div key={msg.id} className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}>
                            <p className={`max-w-xs rounded-lg px-4 py-2 ${msg.senderId === user?.uid ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
                                {msg.content}
                            </p>
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <div className="w-full flex gap-2">
                        <Textarea placeholder="Type your message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} />
                        <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>Send</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// --- Main Social Page Component ---

export default function SocialPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<WithId<UserProfile>[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  
  // User profile state
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: currentUserProfile } = useDoc<UserProfile>(userProfileRef);

  // Friend Requests state
  const friendRequestsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "friendRequests"), where("toId", "==", user.uid), where("status", "==", "pending"));
  }, [firestore, user]);
  const { data: friendRequests, refetch: refetchRequests } = useCollection<FriendRequest>(friendRequestsQuery);

  // Friends list state
  const [friends, setFriends] = useState<WithId<UserProfile>[]>([]);
  useEffect(() => {
    if (!firestore || !currentUserProfile?.friendIds || currentUserProfile.friendIds.length === 0) {
        setFriends([]);
        return;
    }
    const fetchFriends = async () => {
        const usersRef = collection(firestore, "users");
        const friendIds = currentUserProfile.friendIds;
        // Firestore 'in' query is limited to 10 items. For a real app, paginate or restructure data.
        const q = query(usersRef, where("__name__", "in", friendIds.slice(0, 10)));
        const snapshot = await getDocs(q);
        const friendData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as WithId<UserProfile>));
        setFriends(friendData);
    };
    fetchFriends();
  }, [firestore, currentUserProfile]);

  // Messaging state
  const [messagingFriend, setMessagingFriend] = useState<WithId<UserProfile> | null>(null);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);


  const handleSearch = async () => {
    if (!searchQuery.trim() || !firestore) return;
    setIsSearching(true);
    setSearchAttempted(true);
    setSearchResults([]);

    const usersRef = collection(firestore, "users");
    const q = query(usersRef, where("displayName", "==", searchQuery.trim()));
    
    try {
      const querySnapshot = await getDocs(q);
      const users: WithId<UserProfile>[] = [];
      querySnapshot.forEach((doc) => {
        if (doc.id !== user?.uid) {
            users.push({ id: doc.id, ...doc.data() } as WithId<UserProfile>);
        }
      });
      setSearchResults(users);
    } catch (error) {
      console.error("Error searching for users:", error);
      const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: `users`,
      });
      errorEmitter.emit('permission-error', contextualError);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFriend = (targetUserId: string) => {
      if (!firestore || !user || !currentUserProfile) return;

      const request: Omit<FriendRequest, 'createdAt'> = {
          fromId: user.uid,
          fromName: currentUserProfile.displayName,
          fromAvatarId: currentUserProfile.avatarId,
          fromImageBase64: currentUserProfile.imageBase64,
          toId: targetUserId,
          status: 'pending',
      }

      addDocumentNonBlocking(collection(firestore, "friendRequests"), {
          ...request,
          createdAt: serverTimestamp(),
      });
  };
  
  const handleRemoveFriend = async (friendId: string) => {
    if (!firestore || !user) return;
    const batch = writeBatch(firestore);

    const currentUserRef = doc(firestore, 'users', user.uid);
    batch.update(currentUserRef, { friendIds: arrayRemove(friendId) });

    const friendUserRef = doc(firestore, 'users', friendId);
    batch.update(friendUserRef, { friendIds: arrayRemove(user.uid) });
    
    await batch.commit();
  }

  const handleOpenMessageDialog = (friend: WithId<UserProfile>) => {
      setMessagingFriend(friend);
      setIsMessageDialogOpen(true);
  }

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
                           const isFriend = currentUserProfile?.friendIds?.includes(foundUser.id);
                           // In a real app, you'd also check for pending requests
                           const isSelf = foundUser.id === user?.uid;
                           return (
                                <div key={foundUser.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50">
                                    <div className="flex items-center gap-4">
                                         <Avatar>
                                            {avatarSrc && <AvatarImage src={avatarSrc} alt={foundUser.displayName} />}
                                            <AvatarFallback>{foundUser.displayName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <p className="font-semibold">{foundUser.displayName}</p>
                                    </div>
                                    {!isSelf && !isFriend && (
                                        <Button variant="outline" size="sm" onClick={() => handleAddFriend(foundUser.id)}>
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Add Friend
                                        </Button>
                                    )}
                                     {isFriend && (
                                        <Button variant="ghost" size="sm" disabled>Already Friends</Button>
                                    )}
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

          {friendRequests && friendRequests.length > 0 && (
             <Card>
                <CardHeader>
                    <CardTitle>Friend Requests</CardTitle>
                    <CardDescription>People who want to connect with you.</CardDescription>
                </CardHeader>
                <CardContent>
                    {friendRequests.map(req => (
                        <FriendRequestCard key={req.id} request={req} onUpdate={() => refetchRequests && refetchRequests()} />
                    ))}
                </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>My Friends</CardTitle>
              <CardDescription>Your list of connections.</CardDescription>
            </CardHeader>
            <CardContent>
               {friends.length > 0 ? (
                    <div className="space-y-2">
                        {friends.map(friend => (
                            <FriendCard key={friend.id} friend={friend} onMessage={handleOpenMessageDialog} onRemove={handleRemoveFriend} />
                        ))}
                    </div>
               ) : (
                <div className="text-center text-muted-foreground py-8">
                    <p>Your friend list is empty.</p>
                    <p className="text-sm">Use the search above to find and add friends.</p>
                </div>
               )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      <PrivateMessageDialog friend={messagingFriend} open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen} />

    </div>
  );
}

    