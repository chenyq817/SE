import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Waves, Columns, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const WallMessage = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={`p-4 bg-yellow-200 dark:bg-yellow-700 dark:text-yellow-100 rounded-lg shadow-md transform -rotate-1 hover:rotate-0 hover:scale-105 transition-transform ${className}`}>
        <p className="font-serif">{children}</p>
    </div>
)

export default function CommunityPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Community Fun" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="grid gap-8 lg:grid-cols-2">
            
          <Card className="hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Waves className="w-8 h-8 text-primary" />
                    <div>
                        <CardTitle className="font-headline text-2xl">HUST Bottle</CardTitle>
                        <CardDescription>Send a message into the digital sea, or find one from a stranger.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="text-center space-y-4">
                <p className="text-6xl">🌊</p>
                <p className="text-muted-foreground">The tide is calm. What will you do?</p>
                <div className="flex gap-4 justify-center">
                    <Button size="lg">Throw a Bottle</Button>
                    <Button size="lg" variant="outline">Pick One Up</Button>
                </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
                 <div className="flex items-center gap-3">
                    <Columns className="w-8 h-8 text-primary" />
                    <div>
                        <CardTitle className="font-headline text-2xl">WeChat on the Wall</CardTitle>
                        <CardDescription>Leave a public message for everyone to see.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 bg-secondary/50 rounded-lg h-72 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-4">
                    <WallMessage>Good luck on finals everyone! ✨</WallMessage>
                    <WallMessage>Lost a blue water bottle near the gym. Has anyone seen it?</WallMessage>
                    <WallMessage className="rotate-2">CS study group tonight, 7pm, Library room 301. Join us! 💻</WallMessage>
                    <WallMessage>The autumn leaves on campus are gorgeous right now. 🍂</WallMessage>
                     <WallMessage className="rotate-1">Remember to take breaks and care for your mental health. You got this! ❤️</WallMessage>
                </div>
                 <div className="flex gap-2">
                    <Textarea placeholder="Write on the wall..." />
                    <Button size="icon" aria-label="Post message"><Send/></Button>
                 </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
