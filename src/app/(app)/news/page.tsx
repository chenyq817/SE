import Image from 'next/image';
import Link from 'next/link';
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { newsItems } from '@/lib/news-data';
import { ArrowRight } from 'lucide-react';

const NewsCard = ({ item }: { item: typeof newsItems[0] }) => {
  const image = PlaceHolderImages.find(img => img.id === item.imageId);
  return (
    <Card className="flex flex-col overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <Link href={`/news/${item.id}`} className="flex flex-col flex-grow">
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
          <CardTitle className="font-headline text-lg">{item.title}</CardTitle>
          <Badge variant="secondary" className="w-fit">{item.category}</Badge>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-muted-foreground line-clamp-2">{item.excerpt}</p>
        </CardContent>
        <CardFooter className="flex justify-between items-center mt-auto">
          <p className="text-sm text-muted-foreground">{item.date}</p>
          <div className="flex items-center text-primary font-semibold text-sm">
            Read More <ArrowRight className="ml-2 w-4 h-4" />
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
};

export default function NewsPage() {
  const academicNews = newsItems.filter(item => item.category === 'Academics');
  const sportsNews = newsItems.filter(item => item.category === 'Sports');
  const campusLifeNews = newsItems.filter(item => item.category === 'Campus Life' || item.category === "Arts & Culture");

  return (
    <div className="flex flex-col h-full">
      <Header title="Smart News Feed" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <Tabs defaultValue="academics" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="academics">Academics</TabsTrigger>
            <TabsTrigger value="sports">Sports</TabsTrigger>
            <TabsTrigger value="campus-life">Campus Life</TabsTrigger>
          </TabsList>
          
          <TabsContent value="academics">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {academicNews.length > 0 ? academicNews.map((item) => <NewsCard key={item.id} item={item} />) : <p className="text-center text-muted-foreground col-span-full">No academic news available.</p>}
            </div>
          </TabsContent>
          <TabsContent value="sports">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sportsNews.length > 0 ? sportsNews.map((item) => <NewsCard key={item.id} item={item} />) : <p className="text-center text-muted-foreground col-span-full">No sports news available.</p>}
            </div>
          </TabsContent>
          <TabsContent value="campus-life">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {campusLifeNews.length > 0 ? campusLifeNews.map((item) => <NewsCard key={item.id} item={item} />) : <p className="text-center text-muted-foreground col-span-full">No campus life news available.</p>}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
