
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
import { Newspaper, ArrowRight, Rss, Anchor, Users } from "lucide-react";
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { BroadcastPlayer } from "@/components/broadcast-player";

export default function DashboardPage() {
  const newsImage = PlaceHolderImages.find(img => img.id === 'news-1');
  const broadcastText = "各位同学，老师们，大家好！欢迎收听今天的豫园回声校园广播。在这里，我们为您带来最新的校园动态、温馨的祝福和有趣的故事。无论您是匆忙赶往下一堂课，还是在图书馆里稍作休憩，希望我们的声音能为您带来片刻的轻松与愉悦。让我们一起感受校园的脉搏，分享生活中的点滴美好。";

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
                <BroadcastPlayer text={broadcastText} />
              </CardFooter>
            </Card>
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
                <div className="rounded-lg border p-4 hover:bg-accent/10 transition-colors h-full flex flex-col justify-center">
                  <h3 className="font-semibold text-center">Campus Posts</h3>
                  <p className="text-sm text-muted-foreground text-center">See what's happening right now.</p>
                </div>
              </Link>
               <Link href="/social" passHref>
                <div className="rounded-lg border p-4 hover:bg-accent/10 transition-colors h-full flex flex-col justify-center">
                  <h3 className="font-semibold text-center">Social Hub</h3>
                  <p className="text-sm text-muted-foreground text-center">Find friends and connect.</p>
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
