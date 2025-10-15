'use client';

import { useState, useRef } from 'react';
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
import { Input } from "@/components/ui/input";
import { ThumbsUp, MessageSquare, MapPin, ImagePlus, X, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, arrayUnion, arrayRemove, doc } from 'firebase/firestore';
import type { WithId } from '@/firebase';

// Types matching Firestore data
type Post = {
  authorId: string;
  authorName: string; // Denormalized for display
  authorAvatarId: string; // Denormalized for display
  content: string;
  location?: string;
  imageBase64?: string; // Storing image as Base64 data URI
  likeIds: string[];
  createdAt: any; // Firestore Timestamp
};


function SocialPostCard({ post }: { post: WithId<Post> }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const authorAvatar = PlaceHolderImages.find(img => img.id === post.authorAvatarId);
    
    const isLiked = user ? post.likeIds.includes(user.uid) : false;
    const isAuthor = user ? user.uid === post.authorId : false;

    const handleLike = () => {
        if (!user || !firestore) return;
        const postRef = doc(firestore, 'posts', post.id);
        updateDocumentNonBlocking(postRef, {
            likeIds: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
        });
    };

    const handleDelete = () => {
      if (!firestore) return;
      const postRef = doc(firestore, 'posts', post.id);
      deleteDocumentNonBlocking(postRef);
      setIsDeleteDialogOpen(false);
    }
    
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
                {isAuthor && (
                   <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">More options</span>
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                              </AlertDialogTrigger>
                          </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your post.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                   </AlertDialog>
                )}
            </CardHeader>
            <CardContent>
                <p className="mb-4">{post.content}</p>
                {post.imageBase64 && (
                    <div className="relative aspect-video w-full">
                        <Image
                            src={post.imageBase64}
                            alt="Social post image"
                            fill
                            className="rounded-md object-cover"
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
    const [newPostImage, setNewPostImage] = useState<string | null>(null);
    const [newPostLocation, setNewPostLocation] = useState('On Campus');
    const [tempLocation, setTempLocation] = useState('On Campus');
    const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);
  
    const postsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'posts'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: socialPosts, isLoading } = useCollection<Post>(postsQuery);

    const userAvatar = PlaceHolderImages.find(img => img.id === 'avatar-1');

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewPostImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleLocationSave = () => {
        setNewPostLocation(tempLocation);
        setIsLocationDialogOpen(false);
    }

    const handlePost = () => {
        if ((!newPostContent.trim() && !newPostImage) || !user || !firestore) return;

        const newPost: Omit<Post, 'id' | 'likeIds' | 'createdAt'> & { likeIds: string[], createdAt: any } = {
            authorId: user.uid,
            authorName: "Anonymous User", // In a real app, you'd have user profiles
            authorAvatarId: "avatar-1", // Placeholder
            content: newPostContent,
            location: newPostLocation,
            likeIds: [],
            createdAt: serverTimestamp(),
        };

        if (newPostImage) {
            newPost.imageBase64 = newPostImage;
        }

        addDocumentNonBlocking(collection(firestore, 'posts'), newPost);
        setNewPostContent('');
        setNewPostImage(null);
        setNewPostLocation('On Campus');
        setTempLocation('On Campus');
        if(imageInputRef.current) {
            imageInputRef.current.value = '';
        }
    };

    return (
        <div className="flex flex-col h-full">
            <Header title="Campus Social Circle" />
            <main className="flex-1 p-4 md:p-6 lg:p-8">
                <div className="max-w-2xl mx-auto space-y-6">
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-col items-start gap-4 p-4">
                            <div className="flex w-full gap-4">
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
                                </div>
                            </div>
                             {newPostImage && (
                                <div className="relative w-full pl-16">
                                    <Image src={newPostImage} alt="Preview" width={80} height={80} className="rounded-md object-cover" />
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-1 right-1 h-6 w-6"
                                        onClick={() => {
                                            setNewPostImage(null);
                                            if(imageInputRef.current) {
                                                imageInputRef.current.value = '';
                                            }
                                        }}
                                    >
                                        <X className="h-4 w-4"/>
                                    </Button>
                                </div>
                            )}
                            <div className="w-full flex justify-between items-center pl-16">
                                <div className="flex gap-2">
                                    <input
                                        type="file"
                                        ref={imageInputRef}
                                        onChange={handleImageChange}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                    <Button variant="ghost" size="icon" className="text-muted-foreground" disabled={!user} onClick={() => imageInputRef.current?.click()}>
                                        <ImagePlus className="w-5 h-5"/>
                                    </Button>
                                    <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-muted-foreground" disabled={!user}>
                                                <MapPin className="w-5 h-5"/>
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px]">
                                            <DialogHeader>
                                            <DialogTitle>Edit location</DialogTitle>
                                            <DialogDescription>
                                                Update your current location. This will be shown on your post.
                                            </DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="location" className="text-right">
                                                Location
                                                </Label>
                                                <Input
                                                id="location"
                                                value={tempLocation}
                                                onChange={(e) => setTempLocation(e.target.value)}
                                                className="col-span-3"
                                                />
                                            </div>
                                            </div>
                                            <DialogFooter>
                                                <Button type="submit" onClick={handleLocationSave}>Save changes</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                                <Button onClick={handlePost} disabled={(!newPostContent.trim() && !newPostImage) || !user}>Post</Button>
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
