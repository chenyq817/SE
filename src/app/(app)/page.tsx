import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { PlayCircle, Newspaper, Calendar, ArrowRight, Rss, Anchor } from "lucide-react";
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function DashboardPage() {
  const newsImage = PlaceHolderImages.find(img => img.id === 'news-1');
  const activityImage = PlaceHolderImages.find(img => img.id === 'activity-1');

  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" />
      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-8">
        <section
          className="rounded-lg border bg-card text-card-foreground shadow-lg w-full p-6 md:p-8 bg-cover bg-center"
          style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${newsImage?.imageUrl})`}}
        >
          <div className="flex flex-col items-start text-white">
            <h2 className="text-3xl font-bold font-headline">Welcome to Yu Garden Echo</h2>
            <p className="mt-2 text-lg text-muted-foreground text-gray-200">Your all-in-one campus companion.</p>
            <Card className="mt-6 bg-background/20 backdrop-blur-sm border-gray-400 text-white">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Rss className="w-8 h-8 text-accent" />
                  <div>
                    <CardTitle className="font-headline text-white">"Hua Xiao Ke" Broadcast</CardTitle>
                    <CardDescription className="text-gray-300">Your daily campus news and greetings.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p>Stay connected with the heart of the campus. Catch today's updates!</p>
              </CardContent>
              <CardFooter>
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Play Today's Broadcast
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Newspaper className="w-6 h-6 text-primary" />
                <CardTitle className="font-headline">Latest News</CardTitle>
              </div>
              <CardDescription>Top stories from around the campus.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
               {newsImage && (
                <div className="relative aspect-video w-full">
                  <Image
                    src={newsImage.imageUrl}
                    alt={newsImage.description}
                    fill
                    className="rounded-md object-cover"
                    data-ai-hint={newsImage.imageHint}
                  />
                </div>
              )}
              <h3 className="font-semibold">Major Update to Campus Library Hours</h3>
              <p className="text-sm text-muted-foreground">Starting next month, the main library will extend its hours during the exam period...</p>
            </CardContent>
            <CardFooter>
              <Link href="/news" className="w-full" passHref>
                <Button variant="outline" className="w-full">
                  Read More News
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-primary" />
                <CardTitle className="font-headline">Upcoming Activities</CardTitle>
              </div>
              <CardDescription>Don't miss out on these events.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
              {activityImage && (
                <div className="relative aspect-video w-full">
                  <Image
                    src={activityImage.imageUrl}
                    alt={activityImage.description}
                    fill
                    className="rounded-md object-cover"
                    data-ai-hint={activityImage.imageHint}
                  />
                </div>
              )}
              <h3 className="font-semibold">Annual Tech Symposium</h3>
              <p className="text-sm text-muted-foreground">Join industry leaders and innovators for a day of insightful talks and networking...</p>
            </CardContent>
            <CardFooter>
              <Link href="/activities" className="w-full" passHref>
                <Button variant="outline" className="w-full">
                  Explore Activities
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card className="flex flex-col lg:col-span-1 md:col-span-2">
            <CardHeader>
                <div className="flex items-center gap-3">
                  <Anchor className="w-6 h-6 text-primary" />
                  <CardTitle className="font-headline">Community Hub</CardTitle>
                </div>
              <CardDescription>Connect with fellow students.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow grid grid-rows-2 gap-4">
              <Link href="/social" passHref>
                <div className="rounded-lg border p-4 hover:bg-accent/10 transition-colors h-full flex flex-col justify-center">
                  <h3 className="font-semibold text-center">Campus Social Circle</h3>
                  <p className="text-sm text-muted-foreground text-center">See what's happening right now.</p>
                </div>
              </Link>
               <Link href="/community" passHref>
                <div className="rounded-lg border p-4 hover:bg-accent/10 transition-colors h-full flex flex-col justify-center">
                  <h3 className="font-semibold text-center">Community Fun</h3>
                  <p className="text-sm text-muted-foreground text-center">Wall messages and more.</p>
                </div>
              </Link>
            </CardContent>
             <CardFooter>
                <Button variant="outline" className="w-full" disabled>
                    Manage Friends
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </CardFooter>
          </Card>
        </section>
      </main>
    </div>
  );
}
