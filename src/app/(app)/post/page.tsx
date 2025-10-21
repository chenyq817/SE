
'use client';

import { useState, useRef, useEffect } from 'react';
import Image from "next/image";
import Link from 'next/link';
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
import { ThumbsUp, MessageSquare, MapPin, ImagePlus, X, MoreHorizontal, Send, Smile } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, useDoc, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, arrayUnion, arrayRemove, doc, writeBatch, increment, getDocs, updateDoc } from 'firebase/firestore';
import type { WithId } from '@/firebase';
import { Separator } from '@/components/ui/separator';

// Types matching Firestore data
type Post = {
  authorId: string;
  authorName: string; 
  authorAvatarId?: string; 
  authorImageBase64?: string;
  content: string;
  location?: string;
  imageBase64?: string; 
  likeIds: string[];
  commentCount: number;
  createdAt: any; 
};

type Comment = {
    postId: string;
    authorId: string;
    authorName: string;
    authorAvatarId?: string;
    authorImageBase64?: string;
    content: string;
    createdAt: any;
};

type UserProfile = {
  displayName: string;
  avatarId: string;
  avatarUrl?: string; // For backward compatibility
  imageBase64?: string;
  bio?: string;
  age?: number;
  gender?: string;
  address?: string;
};

const formatTimestamp = (timestamp: any) => {
      if (!timestamp) return 'Just now';
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
};


function CommentCard({ comment }: { comment: WithId<Comment>}) {
    const authorAvatarSrc = comment.authorImageBase64 || PlaceHolderImages.find(img => img.id === comment.authorAvatarId)?.imageUrl;

    return (
        <div className="flex items-start gap-3">
            <Link href={`/profile/${comment.authorId}`} passHref>
                <Avatar className="h-9 w-9">
                    {authorAvatarSrc && <AvatarImage src={authorAvatarSrc} alt={comment.authorName} />}
                    <AvatarFallback>{comment.authorName.charAt(0)}</AvatarFallback>
                </Avatar>
            </Link>
            <div className="flex-grow bg-secondary/50 rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{comment.authorName}</p>
                    <p className="text-xs text-muted-foreground">{formatTimestamp(comment.createdAt)}</p>
                </div>
                <p className="text-sm">{comment.content}</p>
            </div>
        </div>
    )
}

function CommentSection({ post }: { post: WithId<Post>}) {
    const firestore = useFirestore();
    const { user } = useUser();
    const [newCommentContent, setNewCommentContent] = useState('');

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
    
    const commentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'posts', post.id, 'comments'), orderBy('createdAt', 'asc'));
    }, [firestore, post.id]);

    const { data: comments, isLoading } = useCollection<Comment>(commentsQuery);

    const handleComment = async () => {
        if (!newCommentContent.trim() || !firestore || !user || !userProfile) return;

        const postRef = doc(firestore, 'posts', post.id);
        const commentsColRef = collection(firestore, 'posts', post.id, 'comments');
        
        const commentData: Comment = {
            postId: post.id,
            authorId: user.uid,
            authorName: userProfile.displayName,
            authorImageBase64: userProfile.imageBase64 || "",
            authorAvatarId: userProfile.avatarId || "avatar-4",
            content: newCommentContent,
            createdAt: serverTimestamp(),
        };

        addDocumentNonBlocking(commentsColRef, commentData);
        updateDocumentNonBlocking(postRef, { commentCount: increment(1) });
        
        setNewCommentContent('');
    };
    
    const userAvatarSrc = userProfile?.imageBase64 || PlaceHolderImages.find(img => img.id === userProfile?.avatarId)?.imageUrl;

    return (
        <div className="pt-4 space-y-4 px-6 pb-4">
            <Separator />
            <div className="space-y-4">
                {isLoading && <p className="text-sm text-muted-foreground">Loading comments...</p>}
                {comments?.map(comment => <CommentCard key={comment.id} comment={comment} />)}
            </div>

            <div className="flex items-start gap-3 pt-4">
                {user && userProfile && (
                <Link href="/profile" passHref>
                    <Avatar className="h-9 w-9">
                        {userAvatarSrc && <AvatarImage src={userAvatarSrc} alt={userProfile.displayName} />}
                        <AvatarFallback>{userProfile.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                </Link>
                )}
                <div className="flex-grow flex items-center gap-2">
                    <Textarea 
                        placeholder="Write a comment..." 
                        className="min-h-0 h-10"
                        value={newCommentContent}
                        onChange={(e) => setNewCommentContent(e.target.value)}
                        disabled={!user}
                    />
                    <Button size="icon" onClick={handleComment} disabled={!newCommentContent.trim() || !user}>
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

function SocialPostCard({ post }: { post: WithId<Post> }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isCommentSectionOpen, setIsCommentSectionOpen] = useState(false);
    
    const authorAvatarSrc = post.authorImageBase64 || PlaceHolderImages.find(img => img.id === post.authorAvatarId)?.imageUrl;
    
    const isLiked = user ? post.likeIds.includes(user.uid) : false;
    const isAdmin = user?.email === 'admin@111.com';
    const isAuthor = user ? user.uid === post.authorId : false;
    const canDelete = isAdmin || isAuthor;

    const handleLike = () => {
        if (!firestore || !user || isLiked) return;
        const postRef = doc(firestore, 'posts', post.id);
        const data = {
            likeIds: arrayUnion(user.uid)
        };
        updateDocumentNonBlocking(postRef, data);
    };

    const handleDelete = () => {
      if (!firestore) return;
      const postRef = doc(firestore, 'posts', post.id);
      const commentsRef = collection(firestore, 'posts', post.id, 'comments');
      
      const batchPromise = getDocs(commentsRef).then(querySnapshot => {
        const batch = writeBatch(firestore);
        querySnapshot.forEach(commentDoc => {
          batch.delete(commentDoc.ref);
        });
        batch.delete(postRef);
        return batch.commit();
      });
  
      batchPromise.catch(error => {
        const contextualError = new FirestorePermissionError({
          operation: 'delete',
          path: postRef.path,
        });
        errorEmitter.emit('permission-error', contextualError);
      });
  
      setIsDeleteDialogOpen(false);
    }
    
    return (
        <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-start gap-4">
                <Link href={`/profile/${post.authorId}`} passHref>
                    <Avatar>
                        {authorAvatarSrc && <AvatarImage src={authorAvatarSrc} alt={post.authorName} />}
                        <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
                    </Avatar>
                </Link>
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
                {canDelete && (
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
                            This action cannot be undone. This will permanently delete your post and all its comments.
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
                <p className="mb-4 whitespace-pre-wrap">{post.content}</p>
                {post.imageBase64 && (
                     <Dialog>
                        <DialogTrigger asChild>
                           <div className="relative aspect-video w-full rounded-md overflow-hidden cursor-pointer">
                                <Image
                                    src={post.imageBase64}
                                    alt="Social post image"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl h-auto p-0">
                            <DialogHeader>
                                <DialogTitle className="sr-only">Enlarged Post Image</DialogTitle>
                            </DialogHeader>
                           <div className="relative aspect-video">
                                <Image
                                    src={post.imageBase64}
                                    alt="Social post image enlarged"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
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
                  disabled={!user || isLiked}
              >
                  <ThumbsUp className={cn("w-5 h-5", isLiked && "fill-current")} /> {post.likeIds.length}
              </Button>
              <Button 
                  variant="ghost" 
                  className="flex items-center gap-2 text-muted-foreground"
                  onClick={() => setIsCommentSectionOpen(prev => !prev)}
              >
                  <MessageSquare className="w-5 h-5" /> {post.commentCount || 0}
              </Button>
            </CardFooter>
            {isCommentSectionOpen && <CommentSection post={post} />}
        </Card>
    );
}

const emojis = ['😀', '😂', '😍', '🤔', '👍', '❤️', '🔥', '🎉', '😊', '🙏', '💯', '🙌'];

export default function PostPage() {
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

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

    const userAvatarSrc = userProfile?.imageBase64 || PlaceHolderImages.find(img => img.id === userProfile?.avatarId)?.imageUrl;

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
    };
    
    const handleEmojiSelect = (emoji: string) => {
        setNewPostContent(prev => prev + emoji);
    };

    const handlePost = () => {
        if ((!newPostContent.trim() && !newPostImage) || !user || !firestore || !userProfile) return;

        const postData: Partial<Post> = {
            authorId: user.uid,
            authorName: userProfile.displayName,
            content: newPostContent,
            likeIds: [],
            commentCount: 0,
            createdAt: serverTimestamp(),
        };
        
        if (userProfile.imageBase64) {
            postData.authorImageBase64 = userProfile.imageBase64;
        } else {
            postData.authorAvatarId = userProfile.avatarId || "avatar-4";
        }

        if (newPostLocation && newPostLocation.trim() && newPostLocation !== 'On Campus') {
            postData.location = newPostLocation;
        }

        if (newPostImage) {
            postData.imageBase64 = newPostImage;
        }
        
        addDocumentNonBlocking(collection(firestore, 'posts'), postData);

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
            <Header title="Campus Posts" />
            <main className="flex-1 p-4 md:p-6 lg:p-8">
                <div className="max-w-2xl mx-auto space-y-6">
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-col items-start gap-4 p-4">
                            <div className="flex w-full gap-4">
                                {user && userProfile && (
                                <Link href="/profile" passHref>
                                    <Avatar>
                                        {userAvatarSrc && <AvatarImage src={userAvatarSrc} alt="Your avatar" />}
                                        <AvatarFallback>{userProfile?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                                    </Avatar>
                                </Link>
                                )}
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
                                                imageInputRef.current.value = ''
                                            }
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </CardHeader>
                        <CardFooter className="flex justify-between items-center p-4 border-t">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="gap-2" disabled={!user}>
                                            <MapPin className="w-4 h-4"/>
                                            <span className="text-sm truncate max-w-[120px]">{newPostLocation}</span>
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Set Location</DialogTitle>
                                            <DialogDescription>Where are you posting from?</DialogDescription>
                                        </DialogHeader>
                                        <Input 
                                            value={tempLocation} 
                                            onChange={(e) => setTempLocation(e.target.value)}
                                            placeholder="e.g. Main Library"
                                        />
                                        <DialogFooter>
                                            <Button onClick={handleLocationSave}>Save</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                                <Button variant="ghost" size="icon" onClick={() => imageInputRef.current?.click()} disabled={!user}>
                                    <ImagePlus className="w-5 h-5"/>
                                </Button>
                                 <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="ghost" size="icon" disabled={!user}>
                                            <Smile className="w-5 h-5"/>
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
                                <input
                                    type="file"
                                    ref={imageInputRef}
                                    onChange={handleImageChange}
                                    className="hidden"
                                    accept="image/png, image/jpeg, image/gif"
                                />
                            </div>
                            <Button 
                                onClick={handlePost} 
                                disabled={(!newPostContent.trim() && !newPostImage) || !user}
                            >
                                Post
                            </Button>
                        </CardFooter>
                    </Card>

                    {isLoading ? (
                        <div className="space-y-4">
                            <Card><CardHeader><div className="h-20 w-full bg-muted animate-pulse rounded-md"></div></CardHeader></Card>
                            <Card><CardHeader><div className="h-20 w-full bg-muted animate-pulse rounded-md"></div></CardHeader></Card>
                        </div>
                    ) : socialPosts && socialPosts.length > 0 ? (
                         <div className="space-y-4">
                            {socialPosts.map(post => (
                                <SocialPostCard key={post.id} post={post} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <p className="text-muted-foreground">No posts yet.</p>
                            <p className="text-sm text-muted-foreground">Be the first to share something!</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

    

    

    
