
'use client';

import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { WithId } from '@/firebase';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type Chat = {
    participantIds: string[];
    participantInfo: {
        [key: string]: {
            displayName: string;
            avatarId?: string;
            imageBase64?: string;
        }
    };
    lastMessage?: string;
    lastMessageTimestamp?: any;
};

export default function ChatsListPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const chatsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'chats'),
            where('participantIds', 'array-contains', user.uid),
            orderBy('lastMessageTimestamp', 'desc')
        );
    }, [firestore, user]);

    const { data: chats, isLoading: areChatsLoading } = useCollection<Chat>(chatsQuery);

    const handleChatClick = (chatId: string) => {
        router.push(`/chat/${chatId}`);
    };

    if (isUserLoading || areChatsLoading) {
        return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="flex flex-col h-full">
            <Header title="My Chats" />
            <main className="flex-1 p-4 md:p-6 lg:p-8">
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle>Conversations</CardTitle>
                        <CardDescription>Select a conversation to continue chatting.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {chats && chats.length > 0 ? (
                            chats.map(chat => {
                                const otherUserId = chat.participantIds.find(id => id !== user?.uid);
                                if (!otherUserId) return null;
                                const otherUserInfo = chat.participantInfo[otherUserId];
                                const avatarSrc = otherUserInfo?.imageBase64 || PlaceHolderImages.find(p => p.id === otherUserInfo?.avatarId)?.imageUrl;

                                return (
                                    <div 
                                        key={chat.id} 
                                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary cursor-pointer transition-colors"
                                        onClick={() => handleChatClick(chat.id)}
                                    >
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={avatarSrc} alt={otherUserInfo.displayName} />
                                            <AvatarFallback>{otherUserInfo.displayName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 truncate">
                                            <p className="font-semibold">{otherUserInfo.displayName}</p>
                                            <p className="text-sm text-muted-foreground truncate">{chat.lastMessage || 'No messages yet'}</p>
                                        </div>
                                        {chat.lastMessageTimestamp && (
                                            <p className="text-xs text-muted-foreground whitespace-nowrap">
                                                {formatDistanceToNow(chat.lastMessageTimestamp.toDate(), { addSuffix: true })}
                                            </p>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-center text-muted-foreground py-8">
                                You have no active chats. Find a friend and start a conversation!
                            </p>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

    