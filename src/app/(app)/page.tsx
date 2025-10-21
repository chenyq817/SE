
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
import { Newspaper, ArrowRight, Rss, Anchor, Users, MessageSquare, FileText } from "lucide-react";
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function DashboardPage() {
  const newsImage = PlaceHolderImages.find(img => img.id === 'news-1');
  const campusImage = PlaceHolderImages.find(img => img.id === 'news-2');

  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" />
      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-8">
        <section
          className="rounded-lg border bg-card text-card-foreground shadow-lg w-full p-6 md:p-8 bg-cover bg-center"
          style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${campusImage?.imageUrl})`}}
        >
          <div className="flex flex-col items-start text-white">
            <h2 className="text-3xl font-bold font-headline">Welcome to I know hust</h2>
            <p className="mt-2 text-lg text-muted-foreground text-gray-200">明德厚学，求是创新</p>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
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
                  <Anchor className="w-6 h-6 text-primary" />
                  <CardTitle className="font-headline">Community Hub</CardTitle>
                </div>
              <CardDescription>Connect with fellow students.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow grid grid-cols-1 gap-4">
              <Link href="/post" passHref>
                <div className="rounded-lg border p-4 hover:bg-accent/10 transition-colors h-full flex flex-col justify-center items-center gap-2">
                  <FileText className="w-8 h-8 text-primary"/>
                  <h3 className="font-semibold">Campus Posts</h3>
                  <p className="text-sm text-muted-foreground text-center">See what's happening right now.</p>
                </div>
              </Link>
               <Link href="/social" passHref>
                <div className="rounded-lg border p-4 hover:bg-accent/10 transition-colors h-full flex flex-col justify-center items-center gap-2">
                  <Users className="w-8 h-8 text-primary"/>
                  <h3 className="font-semibold">Social Hub</h3>
                  <p className="text-sm text-muted-foreground text-center">Find friends and connect.</p>
                </div>
              </Link>
               <Link href="/community" passHref>
                <div className="rounded-lg border p-4 hover:bg-accent/10 transition-colors h-full flex flex-col justify-center items-center gap-2">
                  <MessageSquare className="w-8 h-8 text-primary"/>
                  <h3 className="font-semibold">Community Wall</h3>
                  <p className="text-sm text-muted-foreground text-center">Leave a message for everyone.</p>
                </div>
              </Link>
            </CardContent>
             <CardFooter>
                <Link href="/social" className="w-full" passHref>
                  <Button variant="outline" className="w-full">
                      Manage Friends
                      <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
            </CardFooter>
          </Card>
        </section>
      </main>
    </div>
  );
}
