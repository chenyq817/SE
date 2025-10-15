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
import { ThumbsUp, MessageSquare, MapPin, ImagePlus } from "lucide-react";
import { PlaceHolderImages } from '@/lib/placeholder-images';

const socialPosts = [
  {
    id: 1,
    author: "Alice Johnson",
    avatarId: "avatar-1",
    timestamp: "2 hours ago",
    location: "Main Library",
    content: "Beautiful sunset view from the 5th floor of the library today! Perfect study break. 🌇 #campuslife",
    imageId: "social-1",
    likes: 42,
    comments: 5,
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
    comments: 12,
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
    comments: 23,
  },
];

export default function SocialPage() {
  const userAvatar = PlaceHolderImages.find(img => img.id === 'avatar-1');
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
                <Textarea placeholder="What's on your mind?" className="mb-2" />
                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="text-muted-foreground"><ImagePlus className="w-5 h-5"/></Button>
                        <Button variant="ghost" size="icon" className="text-muted-foreground"><MapPin className="w-5 h-5"/></Button>
                    </div>
                    <Button>Post</Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="space-y-6">
            {socialPosts.map((post) => {
              const authorAvatar = PlaceHolderImages.find(img => img.id === post.avatarId);
              const postImage = PlaceHolderImages.find(img => img.id === post.imageId);
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
                  <Button variant="ghost" className="flex items-center gap-2 text-muted-foreground">
                    <ThumbsUp className="w-5 h-5" /> {post.likes}
                  </Button>
                  <Button variant="ghost" className="flex items-center gap-2 text-muted-foreground">
                    <MessageSquare className="w-5 h-5" /> {post.comments}
                  </Button>
                </CardFooter>
              </Card>
            )})}
          </div>
        </div>
      </main>
    </div>
  );
}
