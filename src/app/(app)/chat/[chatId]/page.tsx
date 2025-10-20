
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, orderBy, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import type { WithId } from '@/firebase';
import { Header } from '@/components/layout/header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type ChatMessage = {
    senderId: string;
    content: string;
    createdAt: any;
};

type UserProfile = {
    displayName: string;
    avatarId: string;
    imageBase64?: string;
};

type ChatParticipantInfo = {
    displayName: string;
    avatarId?: string;
    imageBase64?: string;
};

type Chat = {
    participantIds: string[];
    participantInfo: {
        [key: string]: ChatParticipantInfo;
    }
};

export default function ChatPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const params = useParams();
    const chatId = params.chatId as string;

    const [newMessage, setNewMessage] = useState('');
    const [otherUser, setOtherUser] = useState<WithId<UserProfile> | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const chatRef = useMemoFirebase(() => {
        if (!firestore || !chatId) return null;
        return doc(firestore, 'chats', chatId);
    }, [firestore, chatId]);
    const { data: chatData, isLoading: isChatLoading } = useDoc<Chat>(chatRef);

    const messagesQuery = useMemoFirebase(() => {
        if (!chatRef) return null;
        return query(collection(chatRef, 'messages'), orderBy('createdAt', 'asc'));
    }, [chatRef]);
    const { data: messages, isLoading: areMessagesLoading } = useCollection<ChatMessage>(messagesQuery);
    
    useEffect(() => {
      const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      };
      scrollToBottom();
    }, [messages]);
    
    useEffect(() => {
        const setupChat = async () => {
            if (!firestore || !user || !chatId) return;

            const participantIds = chatId.split('-');
            const otherUserId = participantIds.find(id => id !== user.uid);

            if (!otherUserId) {
                router.push('/social');
                return;
            }

            const chatDoc = await getDoc(chatRef!);
            if (!chatDoc.exists()) {
                const currentUserProfileDoc = await getDoc(doc(firestore, 'users', user.uid));
                const otherUserProfileDoc = await getDoc(doc(firestore, 'users', otherUserId));

                if (!currentUserProfileDoc.exists() || !otherUserProfileDoc.exists()) {
                    console.error("Could not find user profiles to create chat");
                    router.push('/social');
                    return;
                }
                const currentUserProfile = currentUserProfileDoc.data() as UserProfile;
                const otherUserProfile = otherUserProfileDoc.data() as UserProfile;
                
                const currentUserInfo: ChatParticipantInfo = {
                    displayName: currentUserProfile.displayName,
                    avatarId: currentUserProfile.avatarId,
                };
                if (currentUserProfile.imageBase64) {
                    currentUserInfo.imageBase64 = currentUserProfile.imageBase64;
                }
                
                const otherUserInfo: ChatParticipantInfo = {
                    displayName: otherUserProfile.displayName,
                    avatarId: otherUserProfile.avatarId,
                };
                if (otherUserProfile.imageBase64) {
                    otherUserInfo.imageBase64 = otherUserProfile.imageBase64;
                }

                const newChatData: Chat = {
                    participantIds: participantIds,
                    participantInfo: {
                        [user.uid]: currentUserInfo,
                        [otherUserId]: otherUserInfo
                    }
                };
                await setDoc(chatRef!, newChatData);
            }
             const otherProfileSnap = await getDoc(doc(firestore, 'users', otherUserId));
             if(otherProfileSnap.exists()) {
                setOtherUser({...(otherProfileSnap.data() as UserProfile), id: otherProfileSnap.id})
             }
        };

        if(!isUserLoading && !isChatLoading){
            setupChat();
        }
    }, [chatId, user, firestore, router, isUserLoading, isChatLoading, chatRef]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !user || !chatRef) return;
        
        const messageData = {
            senderId: user.uid,
            content: newMessage,
            createdAt: serverTimestamp(),
        };

        const messagesColRef = collection(chatRef, 'messages');
        addDocumentNonBlocking(messagesColRef, messageData);

        const chatUpdateData = {
            lastMessage: newMessage,
            lastMessageTimestamp: serverTimestamp(),
        };
        await setDoc(chatRef, chatUpdateData, { merge: true });

        setNewMessage('');
    };
    
    if (isUserLoading || isChatLoading || !otherUser) {
        return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }
    
    const otherUserAvatar = otherUser?.imageBase64 || PlaceHolderImages.find(p => p.id === otherUser?.avatarId)?.imageUrl;
    
    return (
        <div className="flex flex-col h-screen">
            <Header title={otherUser?.displayName || 'Chat'} />
            <div className="flex items-center border-b p-2">
                 <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft />
                </Button>
                <Avatar className="h-8 w-8">
                    <AvatarImage src={otherUserAvatar} />
                    <AvatarFallback>{otherUser?.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <h2 className="ml-2 font-semibold">{otherUser.displayName}</h2>
            </div>
            
            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                {areMessagesLoading && <div className="text-center text-muted-foreground">Loading messages...</div>}
                {messages?.map((msg) => {
                    const isSender = msg.senderId === user?.uid;
                    return (
                        <div key={msg.id} className={cn("flex", isSender ? "justify-end" : "justify-start")}>
                            <div className={cn(
                                "max-w-xs lg:max-w-md rounded-lg px-4 py-2",
                                isSender ? "bg-primary text-primary-foreground" : "bg-secondary"
                            )}>
                                <p>{msg.content}</p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </main>

            <footer className="p-4 border-t bg-background">
                <div className="flex items-center gap-2">
                    <Input 
                        placeholder="Type a message..." 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                        <Send className="w-5 h-5" />
                    </Button>
                </div>
            </footer>
        </div>
    );
}
