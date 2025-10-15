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
import { ThumbsUp, MessageSquare, Ghost } from "lucide-react";
import { PlaceHolderImages } from '@/lib/placeholder-images';

const confessions = [
  {
    id: 1,
    timestamp: "30 minutes ago",
    content: "I'm a senior and I'm really scared about graduating and what comes next. It feels like everyone else has it figured out.",
    likes: 112,
    comments: 18,
  },
  {
    id: 2,
    timestamp: "2 hours ago",
    content: "I have a crush on someone in my chemistry class but I'm too shy to say anything. They have the cutest smile.",
    likes: 256,
    comments: 45,
  },
  {
    id: 3,
    timestamp: "8 hours ago",
    content: "Feeling really homesick this week. To everyone else feeling the same, you're not alone. We can get through this.",
    likes: 301,
    comments: 32,
  },
];

export default function ConfessionsPage() {
  const anonymousAvatar = PlaceHolderImages.find(img => img.id === 'avatar-4');
  return (
    <div className="flex flex-col h-full bg-secondary/30 dark:bg-background">
      <Header title="Anonymous Confession" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="shadow-sm border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Ghost className="w-6 h-6 text-primary" />
                <h2 className="text-lg font-semibold font-headline">Share a secret</h2>
              </div>
            </CardHeader>
            <CardContent>
                <Textarea placeholder="Share your feelings, seek advice... Your post is anonymous." className="mb-2" />
                <div className="flex justify-end">
                    <Button>Post Anonymously</Button>
                </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {confessions.map((post) => (
              <Card key={post.id} className="bg-background/80 backdrop-blur-sm hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="flex flex-row items-start gap-4">
                  {anonymousAvatar && <Avatar>
                    <AvatarImage src={anonymousAvatar.imageUrl} alt="Anonymous" data-ai-hint={anonymousAvatar.imageHint} />
                    <AvatarFallback>
                        <Ghost className="w-5 h-5"/>
                    </AvatarFallback>
                  </Avatar>}
                  <div className="flex-grow">
                    <p className="font-semibold text-muted-foreground">Anonymous</p>
                    <p className="text-xs text-muted-foreground">{post.timestamp}</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-lg">{post.content}</p>
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
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
