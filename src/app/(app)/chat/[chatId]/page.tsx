
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, orderBy, serverTimestamp, where, getDocs, writeBatch } from 'firebase/firestore';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
<<<<<<< HEAD
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Loader2, Send, Smile, ImagePlus, X } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import type { WithId } from '@/firebase';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
=======
import { Send, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type ChatMessage = {
    senderId: string;
    content: string;
    createdAt: any;
};
>>>>>>> parent of 0c1c661 (在私聊功能添加发送图片和emoji的功能)

type UserProfile = {
    displayName: string;
    avatarId: string;
    imageBase64?: string;
};

type ChatMessage = {
    chatId: string;
    senderId: string;
    content?: string;
    imageBase64?: string;
    createdAt: any;
};

type Chat = {
    participantIds: string[];
    participantInfo: {
        [key: string]: {
            displayName: string;
            avatarId: string;
            imageBase64?: string;
        }
    };
};

export default function ChatPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const params = useParams();
    const chatId = params.chatId as string;

<<<<<<< HEAD
    const [newMessageContent, setNewMessageContent] = useState('');
    const [newImage, setNewImage] = useState<string | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
=======
    const [newMessage, setNewMessage] = useState('');
    const [otherUser, setOtherUser] = useState<WithId<UserProfile> | null>(null);
>>>>>>> parent of 0c1c661 (在私聊功能添加发送图片和emoji的功能)
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const chatRef = useMemoFirebase(() => {
        if (!firestore || !chatId) return null;
        return doc(firestore, 'chats', chatId);
    }, [firestore, chatId]);
    const { data: chat, isLoading: isChatLoading } = useDoc<Chat>(chatRef);

    const messagesQuery = useMemoFirebase(() => {
        if (!firestore || !chatId) return null;
        return query(collection(firestore, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'));
    }, [firestore, chatId]);
    const { data: messages, isLoading: areMessagesLoading } = useCollection<ChatMessage>(messagesQuery);

    const otherParticipantId = useMemo(() => {
        return chat?.participantIds.find(id => id !== user?.uid);
    }, [chat, user]);

    const otherParticipantInfo = useMemo(() => {
        if (!chat || !otherParticipantId) return null;
        return chat.participantInfo[otherParticipantId];
    }, [chat, otherParticipantId]);

    // This effect handles setting up a new chat if one doesn't exist
    useEffect(() => {
        if (isUserLoading || isChatLoading) return;
        if (!user || !firestore) return;

        const setupChat = async () => {
            if (!chat && !isChatLoading && user && otherParticipantId) {
                 const currentUserProfileRef = doc(firestore, 'users', user.uid);
                 const otherUserProfileRef = doc(firestore, 'users', otherParticipantId);

                 try {
                     const [currentUserProfileSnap, otherUserProfileSnap] = await Promise.all([
                         getDocs(query(collection(firestore, 'users'), where('__name__', '==', user.uid))),
                         getDocs(query(collection(firestore, 'users'), where('__name__', '==', otherParticipantId))),
                     ]);

                     const currentUserProfile = currentUserProfileSnap.docs[0]?.data() as UserProfile;
                     const otherUserProfile = otherUserProfileSnap.docs[0]?.data() as UserProfile;

                     if (currentUserProfile && otherUserProfile) {
                         const newChatData: Chat = {
                             participantIds: [user.uid, otherParticipantId],
                             participantInfo: {
                                 [user.uid]: {
                                     displayName: currentUserProfile.displayName,
                                     avatarId: currentUserProfile.avatarId,
                                 },
                                 [otherParticipantId]: {
                                     displayName: otherUserProfile.displayName,
                                     avatarId: otherUserProfile.avatarId,
                                 },
                             },
                         };
                         
                         if (currentUserProfile.imageBase64) {
                             newChatData.participantInfo[user.uid].imageBase64 = currentUserProfile.imageBase64;
                         }
                         if (otherUserProfile.imageBase64) {
                             newChatData.participantInfo[otherParticipantId].imageBase64 = otherUserProfile.imageBase64;
                         }

                         setDocumentNonBlocking(doc(firestore, 'chats', chatId), newChatData, { merge: true });
                     }
                 } catch (error) {
                     console.error("Error setting up chat:", error);
                 }
            }
        };

        if (chatId.includes('-') && !chat) {
            const ids = chatId.split('-');
            const otherId = ids.find(id => id !== user?.uid);
            if (otherId) {
                setupChat();
            }
        }
    }, [chat, isChatLoading, user, isUserLoading, firestore, chatId, otherParticipantId]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = () => {
        if ((!newMessageContent.trim() && !newImage) || !user || !firestore || !chatId) return;

<<<<<<< HEAD
        const messageData: Partial<ChatMessage> = {
            chatId: chatId,
=======
    const handleSendMessage = async () => {
        if (!newMessage.trim() || !user || !chatRef) return;
        
        const messageData = {
>>>>>>> parent of 0c1c661 (在私聊功能添加发送图片和emoji的功能)
            senderId: user.uid,
            content: newMessage,
            createdAt: serverTimestamp(),
        };

<<<<<<< HEAD
        if (newMessageContent.trim()) {
            messageData.content = newMessageContent;
        }
        if (newImage) {
            messageData.imageBase64 = newImage;
        }
        
        addDocumentNonBlocking(collection(firestore, 'chats', chatId, 'messages'), messageData);

        const lastMessageData: any = {
            content: newMessageContent.trim() || undefined,
            imageBase64: newImage || undefined,
            senderId: user.uid,
            timestamp: serverTimestamp(),
=======
        const messagesColRef = collection(chatRef, 'messages');
        addDocumentNonBlocking(messagesColRef, messageData);

        const chatUpdateData = {
            lastMessage: newMessage,
            lastMessageTimestamp: serverTimestamp(),
>>>>>>> parent of 0c1c661 (在私聊功能添加发送图片和emoji的功能)
        };
        
        // Remove undefined fields before updating
        Object.keys(lastMessageData).forEach(key => lastMessageData[key] === undefined && delete lastMessageData[key]);

<<<<<<< HEAD
        setDocumentNonBlocking(doc(firestore, 'chats', chatId), { lastMessage: lastMessageData }, { merge: true });

        setNewMessageContent('');
        setNewImage(null);
        if (imageInputRef.current) {
            imageInputRef.current.value = '';
        }
    };
    
    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEmojiSelect = (emoji: string) => {
        setNewMessageContent(prev => prev + emoji);
=======
        setNewMessage('');
>>>>>>> parent of 0c1c661 (在私聊功能添加发送图片和emoji的功能)
    };

    const isLoading = isUserLoading || isChatLoading;

    if (isLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    if (!chat && !isLoading) {
        // This handles the case where the chat doesn't exist and isn't being created.
        return (
             <div className="flex flex-col h-full">
                <Header title="Chat Not Found" />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-lg text-muted-foreground">The chat you are looking for does not exist.</p>
                        <Button asChild variant="link" className="mt-4">
                            <Link href="/social">Go to Social Hub</Link>
                        </Button>
                    </div>
                </main>
            </div>
        );
    }
    
    const otherUserAvatarSrc = otherParticipantInfo?.imageBase64 || PlaceHolderImages.find(p => p.id === otherParticipantInfo?.avatarId)?.imageUrl;

    return (
        <div className="flex flex-col h-screen bg-secondary/30">
             <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-6 sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft />
                    </Button>
                     {otherParticipantInfo && (
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={otherUserAvatarSrc} alt={otherParticipantInfo.displayName} />
                                <AvatarFallback>{otherParticipantInfo.displayName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <h1 className="text-lg font-semibold font-headline md:text-xl">{otherParticipantInfo.displayName}</h1>
                        </div>
                     )}
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                {areMessagesLoading && <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin"/></div>}
                {messages?.map(message => {
                    const isSender = message.senderId === user?.uid;
                    const senderInfo = chat?.participantInfo[message.senderId];
                    const senderAvatarSrc = senderInfo?.imageBase64 || PlaceHolderImages.find(p => p.id === senderInfo?.avatarId)?.imageUrl;
                    return (
<<<<<<< HEAD
                        <div key={message.id} className={cn("flex items-end gap-3", isSender ? "justify-end" : "justify-start")}>
                            {!isSender && (
                                 <Avatar className="h-8 w-8">
                                    <AvatarImage src={senderAvatarSrc} />
                                    <AvatarFallback>{senderInfo?.displayName.charAt(0)}</AvatarFallback>
                                </Avatar>
                            )}
                             <div className={cn(
                                "max-w-xs md:max-w-md lg:max-w-lg rounded-xl px-4 py-2",
                                isSender ? "bg-primary text-primary-foreground" : "bg-background"
                            )}>
                                {message.imageBase64 && (
                                    <div className="relative aspect-video w-full mb-2">
                                        <Image src={message.imageBase64} alt="Sent image" fill className="rounded-md object-cover" />
                                    </div>
                                )}
                                {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}
=======
                        <div key={msg.id} className={cn("flex", isSender ? "justify-end" : "justify-start")}>
                            <div className={cn(
                                "max-w-xs lg:max-w-md rounded-lg px-4 py-2",
                                isSender ? "bg-primary text-primary-foreground" : "bg-secondary"
                            )}>
                                <p>{msg.content}</p>
>>>>>>> parent of 0c1c661 (在私聊功能添加发送图片和emoji的功能)
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </main>

<<<<<<< HEAD
            <footer className="p-4 bg-background border-t">
                <div className="max-w-4xl mx-auto">
                    {newImage && (
                        <div className="relative w-24 h-24 mb-2">
                            <Image src={newImage} alt="Preview" fill className="rounded-md object-cover" />
                            <Button
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                onClick={() => {
                                    setNewImage(null);
                                    if(imageInputRef.current) imageInputRef.current.value = '';
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <Textarea
                            placeholder="Type a message..."
                            value={newMessageContent}
                            onChange={(e) => setNewMessageContent(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            rows={1}
                            className="resize-none h-auto max-h-48"
                        />
                        <input
                            type="file"
                            ref={imageInputRef}
                            onChange={handleImageChange}
                            className="hidden"
                            accept="image/png, image/jpeg, image/gif"
                        />
                        <Button variant="ghost" size="icon" onClick={() => imageInputRef.current?.click()}>
                            <ImagePlus />
                        </Button>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Smile />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto border-none bg-transparent shadow-none">
                                <div className="grid grid-cols-6 gap-2 p-2 rounded-lg bg-background border shadow-lg">
                                    {emojis.map(emoji => (
                                        <Button
                                            key={emoji}
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEmojiSelect(emoji)}
                                            className="text-2xl"
                                        >
                                            {emoji}
                                        </Button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                        <Button onClick={handleSendMessage} disabled={!newMessageContent.trim() && !newImage}>
                            <Send />
                        </Button>
                    </div>
=======
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
>>>>>>> parent of 0c1c661 (在私聊功能添加发送图片和emoji的功能)
                </div>
            </footer>
        </div>
    );
}

    