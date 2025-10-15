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

const initialSocialPosts = [
  {
    id: 1,
    author: "Alice Johnson",
    avatarId: "avatar-1",
    timestamp: "2 hours ago",
    location: "Main Library",
    content: "Beautiful sunset view from the 5th floor of the library today! Perfect study break. 🌇 #campuslife",
    imageId: "social-1",
    likes: 42,
    comments: 2,
    isLiked: false,
    showComments: false,
    commentsData: [
        { id: 1, author: "Bob Smith", avatarId: "avatar-2", content: "Wow, amazing shot!" },
        { id: 2, author: "Charlie Brown", avatarId: "avatar-3", content: "I was just there! Missed this view." }
    ]
  },
  {
    id: 2,
    author: "Bob Smith",
    avatarId: "avatar-2",
    timestamp: "5 hours ago",
    location: "Campus Cafe",
    content: "Finally tried the new seasonal latte at the campus cafe. 10/10 would recommend! ☕️",
    imageId: "social-2",
    likes: 78,
    comments: 1,
    isLiked: true,
    showComments: false,
    commentsData: [
        { id: 1, author: "Alice Johnson", avatarId: "avatar-1", content: "I need to try that!" }
    ]
  },
  {
    id: 3,
    author: "Charlie Brown",
    avatarId: "avatar-3",
    timestamp: "1 day ago",
    location: "Engineering Building",
    content: "Late night grind on our final year project. Wish us luck! 💻🔬",
    imageId: null,
    likes: 105,
    comments: 0,
    isLiked: false,
    showComments: false,
    commentsData: []
  },
];

type Comment = {
  id: number;
  author: string;
  avatarId: string;
  content: string;
};

type SocialPost = (typeof initialSocialPosts)[0];


function CommentSection({ 
    post,
    onPostComment 
}: { 
    post: SocialPost,
    onPostComment: (postId: number, commentText: string) => void 
}) {
    const [commentText, setCommentText] = useState('');
    const userAvatar = PlaceHolderImages.find(img => img.id === 'avatar-1');

    const handleCommentSubmit = () => {
        if (!commentText.trim()) return;
        onPostComment(post.id, commentText);
        setCommentText('');
    };

    return (
        <div className="px-6 pb-4 space-y-4">
            <Separator />
            <div className="space-y-4">
                {post.commentsData.map(comment => {
                    const commentAvatar = PlaceHolderImages.find(img => img.id === comment.avatarId);
                    return (
                        <div key={comment.id} className="flex items-start gap-3">
                            {commentAvatar && <Avatar className="w-8 h-8">
                                <AvatarImage src={commentAvatar.imageUrl} alt={comment.author} data-ai-hint={commentAvatar.imageHint} />
                                <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
                            </Avatar>}
                            <div className="flex-grow bg-secondary/50 rounded-lg px-3 py-2">
                                <p className="font-semibold text-sm">{comment.author}</p>
                                <p className="text-sm text-foreground">{comment.content}</p>
                            </div>
                        </div>
                    )
                })}
            </div>
            <div className="flex items-center gap-2">
                {userAvatar && <Avatar className="w-8 h-8">
                    <AvatarImage src={userAvatar.imageUrl} alt="Your avatar" data-ai-hint={userAvatar.imageHint} />
                    <AvatarFallback>U</AvatarFallback>
                </Avatar>}
                <Input 
                    placeholder="Write a comment..." 
                    value={commentText} 
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit()}
                />
                <Button size="icon" onClick={handleCommentSubmit} disabled={!commentText.trim()}>
                    <Send className="w-4 h-4"/>
                </Button>
            </div>
        </div>
    );
}


export default function SocialPage() {
  const [socialPosts, setSocialPosts] = useState(initialSocialPosts);
  const [newPostContent, setNewPostContent] = useState('');
  
  const userAvatar = PlaceHolderImages.find(img => img.id === 'avatar-1');

  const handlePost = () => {
    if (!newPostContent.trim()) return;

    const newPost: SocialPost = {
      id: Date.now(),
      author: "Alice Johnson", // Assuming the current user is Alice
      avatarId: "avatar-1",
      timestamp: "Just now",
      location: "On Campus",
      content: newPostContent,
      imageId: null,
      likes: 0,
      comments: 0,
      isLiked: false,
      showComments: false,
      commentsData: [],
    };

    setSocialPosts([newPost, ...socialPosts]);
    setNewPostContent('');
  };

  const handleLike = (postId: number) => {
    setSocialPosts(posts =>
      posts.map(post => {
        if (post.id === postId) {
          return { 
            ...post, 
            likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            isLiked: !post.isLiked,
          };
        }
        return post;
      })
    );
  };

  const handleComment = (postId: number) => {
    setSocialPosts(posts =>
      posts.map(post =>
        post.id === postId ? { ...post, showComments: !post.showComments } : post
      )
    );
  };

  const handlePostComment = (postId: number, commentText: string) => {
    const newComment: Comment = {
        id: Date.now(),
        author: "Alice Johnson",
        avatarId: 'avatar-1',
        content: commentText,
    };

    setSocialPosts(posts => posts.map(post => {
        if (post.id === postId) {
            return {
                ...post,
                comments: post.comments + 1,
                commentsData: [...post.commentsData, newComment],
            };
        }
        return post;
    }));
  };


  return (
    <div className="flex flex-col h-full">
      <Header title="Campus Social Circle" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-start gap-4 p-4">
              {userAvatar && <Avatar>
                <AvatarImage src={userAvatar.imageUrl} alt="Your avatar" data-ai-hint={userAvatar.imageHint} />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>}
              <div className="flex-grow">
                <Textarea 
                  placeholder="What's on your mind?" 
                  className="mb-2" 
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                />
                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="text-muted-foreground"><ImagePlus className="w-5 h-5"/></Button>
                        <Button variant="ghost" size="icon" className="text-muted-foreground"><MapPin className="w-5 h-5"/></Button>
                    </div>
                    <Button onClick={handlePost}>Post</Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="space-y-6">
            {socialPosts.map((post) => {
              const authorAvatar = PlaceHolderImages.find(img => img.id === post.avatarId);
              const postImage = post.imageId ? PlaceHolderImages.find(img => img.id === post.imageId) : null;
              return (
              <Card key={post.id} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="flex flex-row items-start gap-4">
                  {authorAvatar && <Avatar>
                    <AvatarImage src={authorAvatar.imageUrl} alt={post.author} data-ai-hint={authorAvatar.imageHint} />
                    <AvatarFallback>{post.author.charAt(0)}</AvatarFallback>
                  </Avatar>}
                  <div className="flex-grow">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{post.author}</p>
                      <p className="text-xs text-muted-foreground">{post.timestamp}</p>
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
                        post.isLiked ? "text-primary" : "text-muted-foreground"
                    )} 
                    onClick={() => handleLike(post.id)}
                  >
                    <ThumbsUp className={cn("w-5 h-5", post.isLiked && "fill-current")} /> {post.likes}
                  </Button>
                  <Button variant="ghost" className="flex items-center gap-2 text-muted-foreground" onClick={() => handleComment(post.id)}>
                    <MessageSquare className="w-5 h-5" /> {post.comments}
                  </Button>
                </CardFooter>
                 {post.showComments && <CommentSection post={post} onPostComment={handlePostComment} />}
              </Card>
            )})}
          </div>
        </div>
      </main>
    </div>
  );
}
