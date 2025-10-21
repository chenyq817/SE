
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { PlayCircle, PauseCircle, Loader2 } from 'lucide-react';
import { generateBroadcast } from '@/ai/flows/broadcast-flow';
import { useToast } from '@/hooks/use-toast';

interface BroadcastPlayerProps {
  text: string;
}

export function BroadcastPlayer({ text }: BroadcastPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const handlePlayPause = async () => {
    if (isLoading) return;

    // If already playing, pause it.
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    // If paused, resume playing.
    if (!isPlaying && audioSrc && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    // If no audio is loaded yet, generate and play it.
    if (!audioSrc) {
      setIsLoading(true);
      try {
        const newAudioSrc = await generateBroadcast(text);
        setAudioSrc(newAudioSrc);
        setIsPlaying(true);
      } catch (error) {
        console.error('Error generating broadcast:', error);
        toast({
          variant: 'destructive',
          title: 'Broadcast Error',
          description: 'Failed to generate audio. Please try again.',
        });
        setIsPlaying(false);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div>
      <Button
        className="bg-accent hover:bg-accent/90 text-accent-foreground"
        onClick={handlePlayPause}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : isPlaying ? (
          <PauseCircle className="mr-2 h-5 w-5" />
        ) : (
          <PlayCircle className="mr-2 h-5 w-5" />
        )}
        {isLoading ? 'Generating...' : isPlaying ? 'Pause Broadcast' : 'Play Today\'s Broadcast'}
      </Button>

      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          autoPlay
          onEnded={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="hidden"
        />
      )}
    </div>
  );
}
