'use client';

import { useState } from 'react';
import Image from "next/image";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, MessageSquare, MapPin, ImagePlus, Send } from "lucide-react";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useCollection, useFirestore, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, orderBy, serverTimestamp, arrayUnion, arrayRemove, doc } from 'firebase/firestore';
import type { WithId } from '@/firebase';

// Types matching Firestore data
type Post = {
  authorId: string;
  authorName: string; // Denormalized for display
  authorAvatarId: string; // Denormalized for display
  content: string;
  location?: string;
  imageId?: string;
  likeIds: string[];
  createdAt: any; // Firestore Timestamp
};


function SocialPostCard({ post }: { post: WithId<Post> }) {
    const firestore = useFirestore();
    const { user } = useUser();

    const authorAvatar = PlaceHolderImages.find(img => img.id === post.authorAvatarId);
    const postImage = post.imageId ? PlaceHolderImages.find(img => img.id === post.imageId) : null;
    
    const isLiked = user ? post.likeIds.includes(user.uid) : false;

    const handleLike = () => {
        if (!user || !firestore) return;
        const postRef = doc(firestore, 'posts', post.id);
        updateDocumentNonBlocking(postRef, {
            likeIds: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
        });
    };
    
    const formatTimestamp = (timestamp: any) => {
      if (!timestamp) return 'Just now';
      // Firestore Timestamps can be null before they are committed to the backend
      if (typeof timestamp.toDate !== 'function') {
        return 'Posting...';
      }
      const date = timestamp.toDate();
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
      if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      return 'Just now';
    }


    return (
        <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-start gap-4">
                {authorAvatar && <Avatar>
                    <AvatarImage src={authorAvatar.imageUrl} alt={post.authorName} data-ai-hint={authorAvatar.imageHint} />
                    <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
                </Avatar>}
                <div className="flex-grow">
                    <div className="flex items-center gap-2">
                        <p className="font-semibold">{post.authorName}</p>
                        <p className="text-xs text-muted-foreground">{formatTimestamp(post.createdAt)}</p>
                    </div>
                    {post.location && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span>{post.location}</span>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <p className="mb-4">{post.content}</p>
                {postImage && (
                    <div className="relative aspect-video w-full">
                        <Image
                            src={postImage.imageUrl}
                            alt="Social post image"
                            fill
                            className="rounded-md object-cover"
                            data-ai-hint={postImage.imageHint}
                        />
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-start gap-4 border-t pt-4">
                <Button 
                    variant="ghost" 
                    className={cn(
                        "flex items-center gap-2",
                        isLiked ? "text-primary" : "text-muted-foreground"
                    )} 
                    onClick={handleLike}
                    disabled={!user}
                >
                    <ThumbsUp className={cn("w-5 h-5", isLiked && "fill-current")} /> {post.likeIds.length}
                </Button>
                <Button variant="ghost" className="flex items-center gap-2 text-muted-foreground" disabled>
                    <MessageSquare className="w-5 h-5" /> 0
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function SocialPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const [newPostContent, setNewPostContent] = useState('');
  
    const postsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'posts'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: socialPosts, isLoading } = useCollection<Post>(postsQuery);

    const userAvatar = PlaceHolderImages.find(img => img.id === 'avatar-1');

    const handlePost = () => {
        if (!newPostContent.trim() || !user || !firestore) return;

        const newPost: Omit<Post, 'id' | 'likeIds' | 'createdAt'> & { likeIds: string[], createdAt: any } = {
            authorId: user.uid,
            authorName: "Anonymous User", // In a real app, you'd have user profiles
            authorAvatarId: "avatar-1", // Placeholder
            content: newPostContent,
            location: "On Campus",
            likeIds: [],
            createdAt: serverTimestamp(),
        };

        addDocumentNonBlocking(collection(firestore, 'posts'), newPost);
        setNewPostContent('');
    };

    return (
        <div className="flex flex-col h-full">
            <Header title="Campus Social Circle" />
            <main className="flex-1 p-4 md:p-6 lg:p-8">
                <div className="max-w-2xl mx-auto space-y-6">
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-start gap-4 p-4">
                            {userAvatar && user && <Avatar>
                                <AvatarImage src={userAvatar.imageUrl} alt="Your avatar" data-ai-hint={userAvatar.imageHint} />
                                <AvatarFallback>U</AvatarFallback>
                            </Avatar>}
                            <div className="flex-grow">
                                <Textarea 
                                    placeholder="What's on your mind?" 
                                    className="mb-2" 
                                    value={newPostContent}
                                    onChange={(e) => setNewPostContent(e.target.value)}
                                    disabled={!user}
                                />
                                <div className="flex justify-between items-center">
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="icon" className="text-muted-foreground" disabled={!user}><ImagePlus className="w-5 h-5"/></Button>
                                        <Button variant="ghost" size="icon" className="text-muted-foreground" disabled={!user}><MapPin className="w-5 h-5"/></Button>
                                    </div>
                                    <Button onClick={handlePost} disabled={!newPostContent.trim() || !user}>Post</Button>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    <div className="space-y-6">
                        {isLoading && <p className="text-center text-muted-foreground">Loading posts...</p>}
                        {socialPosts?.map((post) => (
                            <SocialPostCard key={post.id} post={post} />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
