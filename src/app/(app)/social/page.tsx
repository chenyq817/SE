'use client';

import { useState, useMemo } from 'react';
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
import { useCollection, useFirebase, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
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

type Comment = {
  postId: string;
  authorId: string;
  authorName: string; // Denormalized for display
  authorAvatarId: string; // Denormalized for display
  content: string;
  createdAt: any; // Firestore Timestamp
};

function CommentSection({ postId }: { postId: string }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const [commentText, setCommentText] = useState('');

    const commentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'comments'), where('postId', '==', postId), orderBy('createdAt', 'asc'));
    }, [firestore, postId]);
    
    const { data: comments, isLoading } = useCollection<Comment>(commentsQuery);

    const userAvatar = PlaceHolderImages.find(img => img.id === 'avatar-1'); // Placeholder for current user

    const handlePostComment = () => {
        if (!commentText.trim() || !user || !firestore) return;

        const newComment: Omit<Comment, 'id'> = {
            postId,
            authorId: user.uid,
            authorName: "You", // In a real app, this would be the user's actual name
            authorAvatarId: 'avatar-1', // Placeholder
            content: commentText,
            createdAt: serverTimestamp(),
        };

        addDocumentNonBlocking(collection(firestore, 'comments'), newComment);
        setCommentText('');
    };

    return (
        <div className="px-6 pb-4 space-y-4">
            <Separator />
            <div className="space-y-4">
                {isLoading && <p>Loading comments...</p>}
                {comments?.map(comment => {
                    const commentAvatar = PlaceHolderImages.find(img => img.id === comment.authorAvatarId);
                    return (
                        <div key={comment.id} className="flex items-start gap-3">
                            {commentAvatar && <Avatar className="w-8 h-8">
                                <AvatarImage src={commentAvatar.imageUrl} alt={comment.authorName} data-ai-hint={commentAvatar.imageHint} />
                                <AvatarFallback>{comment.authorName.charAt(0)}</AvatarFallback>
                            </Avatar>}
                            <div className="flex-grow bg-secondary/50 rounded-lg px-3 py-2">
                                <p className="font-semibold text-sm">{comment.authorName}</p>
                                <p className="text-sm text-foreground">{comment.content}</p>
                            </div>
                        </div>
                    )
                })}
            </div>
            <div className="flex items-center gap-2">
                {userAvatar && user && <Avatar className="w-8 h-8">
                    <AvatarImage src={userAvatar.imageUrl} alt="Your avatar" data-ai-hint={userAvatar.imageHint} />
                    <AvatarFallback>Y</AvatarFallback>
                </Avatar>}
                <Input 
                    placeholder="Write a comment..." 
                    value={commentText} 
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handlePostComment()}
                    disabled={!user}
                />
                <Button size="icon" onClick={handlePostComment} disabled={!commentText.trim() || !user}>
                    <Send className="w-4 h-4"/>
                </Button>
            </div>
        </div>
    );
}

function SocialPostCard({ post }: { post: WithId<Post> }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const [showComments, setShowComments] = useState(false);

    const commentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'comments'), where('postId', '==', post.id));
    }, [firestore, post.id]);
    
    const { data: comments } = useCollection<Comment>(commentsQuery);

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

    const handleCommentToggle = () => setShowComments(prev => !prev);
    
    const formatTimestamp = (timestamp: any) => {
      if (!timestamp) return 'Just now';
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
                <Button variant="ghost" className="flex items-center gap-2 text-muted-foreground" onClick={handleCommentToggle}>
                    <MessageSquare className="w-5 h-5" /> {comments?.length ?? 0}
                </Button>
            </CardFooter>
            {showComments && <CommentSection postId={post.id} />}
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

        const newPost: Omit<Post, 'id'> = {
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
                        {isLoading && <p>Loading posts...</p>}
                        {socialPosts?.map((post) => (
                            <SocialPostCard key={post.id} post={post} />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
