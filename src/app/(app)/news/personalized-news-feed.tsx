'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ArrowRight, Loader2 } from 'lucide-react';
import { generatePersonalizedNewsFeed, PersonalizedNewsFeedInput, PersonalizedNewsFeedOutput } from '@/ai/flows/personalized-news-feed';

// This would typically come from a user session or profile
const MOCK_USER_DATA = {
  userRole: 'student' as const,
  interests: ['Academics', 'Technology', 'Campus Life'],
};

// The raw news items to be personalized
const newsItems = [
  {
    id: 1,
    title: "University Announces New AI Research Center",
    category: "Academics",
    content: "The new center will focus on machine learning and data science, fostering collaboration between departments and positioning the university at the forefront of technological innovation.",
    imageId: "news-1",
    date: "2024-10-26",
  },
  {
    id: 2,
    title: "Basketball Team Wins Championship",
    category: "Sports",
    content: "A thrilling final match concludes with a victory for the home team, securing the national title after an intense season. The final score was 88-85.",
    imageId: "news-4",
    date: "2024-10-25",
  },
  {
    id: 3,
    title: "Student Art Exhibition Opens at Gallery",
    category: "Arts & Culture",
    content: "Featuring works from over 50 student artists, the exhibition explores themes of identity and modernity through various media including painting, sculpture, and digital art.",
    imageId: "news-2",
    date: "2024-10-24",
  },
  {
    id: 4,
    title: "Career Fair Connects Students with Top Employers",
    category: "Campus Life",
    content: "Hundreds of students attended the annual career fair, with major tech and finance companies recruiting for internships and full-time positions. The event was a major success.",
    imageId: "news-3",
    date: "2024-10-23",
  },
   {
    id: 5,
    title: "Volunteering Initiative for Local Community Launched",
    category: "Campus Life",
    content: "A new student-led program aims to provide support and resources to local shelters and community centers, encouraging students to give back to the community.",
    imageId: "news-1",
    date: "2024-10-22",
  },
  {
    id: 6,
    title: "Debate Club Hosts Panel on Modern Politics",
    category: "Academics",
    content: "Experts and students engaged in a lively discussion on the future of global political landscapes, covering topics from international relations to domestic policy.",
    imageId: "news-2",
    date: "2024-10-21",
  },
];


const NewsCard = ({ item }: { item: any }) => {
  const image = PlaceHolderImages.find(img => img.id === item.imageId);
  const excerpt = item.content.substring(0, 100) + '...';

  return (
    <Card className="flex flex-col overflow-hidden hover:shadow-xl transition-shadow duration-300">
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
        <div className="flex justify-between items-start">
          <CardTitle className="font-headline text-lg">{item.title}</CardTitle>
        </div>
        <Badge variant="secondary" className="w-fit">{item.category}</Badge>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-muted-foreground"><span className="text-primary font-bold">Relevance: {(item.relevanceScore * 100).toFixed(0)}% | </span>{excerpt}</p>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{item.date}</p>
        <Button variant="ghost" size="sm">Read More <ArrowRight className="ml-2 w-4 h-4" /></Button>
      </CardFooter>
    </Card>
  );
};


export function PersonalizedNewsFeed() {
  const [personalizedNews, setPersonalizedNews] = useState<(PersonalizedNewsFeedOutput[0] & {id: number | string; imageId: string; })[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPersonalizedNews = async () => {
      try {
        setLoading(true);
        const input: PersonalizedNewsFeedInput = {
          ...MOCK_USER_DATA,
          newsItems: newsItems.map(item => ({...item})),
        };
        const result = await generatePersonalizedNewsFeed(input);
        
        const resultWithImagesAndIds = result.map(news => {
          const original = newsItems.find(item => item.title === news.title);
          return {
            ...news,
            id: original?.id || Math.random(),
            imageId: original?.imageId || 'news-1',
          }
        });

        resultWithImagesAndIds.sort((a, b) => b.relevanceScore - a.relevanceScore);
        
        setPersonalizedNews(resultWithImagesAndIds);
      } catch (e) {
        setError('Failed to generate personalized news feed. Please try again later.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchPersonalizedNews();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Personalizing your news feed...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 text-destructive-foreground bg-destructive/80 rounded-lg">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {personalizedNews?.map((item) => (
        <NewsCard key={item.id} item={item} />
      ))}
    </div>
  );
}
