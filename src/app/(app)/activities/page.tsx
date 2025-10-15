import Image from 'next/image';
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, User, Calendar } from "lucide-react";
import { PlaceHolderImages } from '@/lib/placeholder-images';

const activities = [
  {
    id: 1,
    title: "Hackathon 2024",
    category: "Technology",
    date: "Nov 15-17, 2024",
    participants: 128,
    imageId: "activity-1",
    description: "A 48-hour coding marathon to build innovative projects. Prizes, food, and fun guaranteed!"
  },
  {
    id: 2,
    title: "Campus Basketball Tournament",
    category: "Sports",
    date: "Every Saturday in November",
    participants: 64,
    imageId: "activity-2",
    description: "Form a team and compete for the championship title. All skill levels are welcome."
  },
  {
    id: 3,
    title: "Fall Music Fest",
    category: "Arts & Music",
    date: "Nov 22, 2024",
    participants: 500,
    imageId: "activity-3",
    description: "An evening of live music from student bands and local artists. Come and enjoy the vibe!"
  }
];

export default function ActivitiesPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Activities & Groups" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold font-headline">Find Your Community</h2>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Activity
          </Button>
        </div>
        <Tabs defaultValue="activities" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
          </TabsList>
          
          <TabsContent value="activities">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activities.map((item) => {
                 const image = PlaceHolderImages.find(img => img.id === item.imageId);
                 return(
                <Card key={item.id} className="flex flex-col overflow-hidden hover:shadow-xl transition-shadow duration-300">
                   {image && (
                     <div className="relative aspect-video w-full">
                        <Image
                            src={image.imageUrl}
                            alt={image.description}
                            fill
                            className="object-cover"
                            data-ai-hint={image.imageHint}
                        />
                    </div>
                  )}
                  <CardHeader>
                    <Badge variant="secondary" className="w-fit mb-2">{item.category}</Badge>
                    <CardTitle className="font-headline text-lg">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{item.date}</span>
                    </div>
                     <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{item.participants} participants</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full bg-accent hover:bg-accent/90">Join Activity</Button>
                  </CardFooter>
                </Card>
              )})}
            </div>
          </TabsContent>
          <TabsContent value="groups">
             <div className="text-center py-16">
                <p className="text-muted-foreground">Interest groups will be displayed here.</p>
                <p className="text-sm text-muted-foreground">e.g., "Photography Club", "Book Lovers Society", etc.</p>
             </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
