
'use client';

import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { WithId } from '@/firebase';
import { Header } from '@/components/layout/header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { formatDistanceToNow } from 'date-fns';

type Chat = {
    participantIds: string[];
    participantInfo: {
        [key: string]: {
            displayName: string;
            avatarId?: string;
            imageBase64?: string;
        }
    };
    lastMessage: string;
    lastMessageTimestamp: any;
};

function ChatListItem({ chat }: { chat: WithId<Chat> }) {
    const { user } = useUser();
    const router = useRouter();

    if (!user) return null;

    const otherUserId = chat.participantIds.find(id => id !== user.uid);
    if (!otherUserId) return null;

    const otherUserInfo = chat.participantInfo[otherUserId];
    if (!otherUserInfo) return null;

    const avatarSrc = otherUserInfo.imageBase64 || PlaceHolderImages.find(p => p.id === otherUserInfo.avatarId)?.imageUrl;

    const handleChatSelect = () => {
        router.push(`/chat/${chat.id}`);
    };

    const formatTimestamp = (timestamp: any) => {
        if (!timestamp) return '';
        return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
    }

    return (
        <div 
            className="flex items-center p-3 rounded-lg hover:bg-secondary cursor-pointer transition-colors"
            onClick={handleChatSelect}
        >
            <Avatar className="h-12 w-12 mr-4">
                <AvatarImage src={avatarSrc} alt={otherUserInfo.displayName} />
                <AvatarFallback>{otherUserInfo.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-grow overflow-hidden">
                <p className="font-semibold truncate">{otherUserInfo.displayName}</p>
                <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
            </div>
            {chat.lastMessageTimestamp && (
                <p className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                    {formatTimestamp(chat.lastMessageTimestamp)}
                </p>
            )}
        </div>
    );
}


export default function ChatsPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const chatsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'chats'),
            where('participantIds', 'array-contains', user.uid),
            orderBy('lastMessageTimestamp', 'desc')
        );
    }, [firestore, user]);

    const { data: chats, isLoading } = useCollection<Chat>(chatsQuery);

    return (
        <div className="flex flex-col h-full">
            <Header title="My Chats" />
            <main className="flex-1 p-4 md:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>Conversations</CardTitle>
                            <CardDescription>Select a conversation to start chatting.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[70vh] overflow-y-auto">
                            {isLoading && (
                                <div className="flex justify-center items-center h-full">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            )}
                            {!isLoading && chats && chats.length > 0 && (
                                <div className="space-y-1">
                                    {chats.map(chat => <ChatListItem key={chat.id} chat={chat} />)}
                                </div>
                            )}
                            {!isLoading && (!chats || chats.length === 0) && (
                                <div className="text-center text-muted-foreground pt-16">
                                    <p>You have no active conversations.</p>
                                    <p className="text-sm">Find a friend in the Social Hub to start a chat.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
