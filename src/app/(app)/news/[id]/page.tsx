'use client'

import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { newsItems } from '@/lib/news-data';
import { ArrowLeft } from 'lucide-react';

export default function NewsDetailPage({ params }: { params: { id: string } }) {
  const newsItem = newsItems.find(item => item.id.toString() === params.id);

  if (!newsItem) {
    notFound();
  }

  const image = PlaceHolderImages.find(img => img.id === newsItem.imageId);

  return (
    <div className="flex flex-col h-full">
      <Header title={newsItem.title} />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Button asChild variant="outline" className="mb-6">
            <Link href="/news">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to News
            </Link>
          </Button>

          <article className="bg-card rounded-lg shadow-sm border p-6 md:p-8">
            <header className="mb-6">
              <h1 className="text-3xl md:text-4xl font-bold font-headline mb-2">{newsItem.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{newsItem.date}</span>
                <Badge variant="secondary">{newsItem.category}</Badge>
              </div>
            </header>
            
            {image && (
              <div className="relative aspect-video w-full mb-6 rounded-lg overflow-hidden">
                <Image
                  src={image.imageUrl}
                  alt={image.description}
                  fill
                  className="object-cover"
                  data-ai-hint={image.imageHint}
                />
              </div>
            )}
            
            <div className="prose dark:prose-invert max-w-none text-lg">
              <p>{newsItem.excerpt}</p>
              <p>This is where the full content of the news article would be displayed. For this demo, we'll just add some placeholder text to illustrate the layout.</p>
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. Duis semper. Duis arcu massa, scelerisque vitae, consequat in, pretium a, enim. Pellentesque congue.</p>
              <p>Curabitur et ligula. Ut molestie a, ultricies porta urna. Vestibulum commodo volutpat a, convallis ac, laoreet enim. Phasellus fermentum in, dolor. Pellentesque facilisis. Nulla imperdiet sit amet magna. Vestibulum dapibus, mauris nec malesuada fames ac turpis velit, rhoncus eu, luctus et interdum adipiscing wisi. Aliquam erat ac ipsum. Integer aliquam purus. Quisque lorem tortor fringilla sed, vestibulum id, eleifend justo vel bibendum sapien massa ac turpis faucibus orci luctus non, consectetuer lobortis quis, varius in, purus. Integer ultrices posuere cubilia Curae; Duis lobortis massa id nisl.</p>
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}
