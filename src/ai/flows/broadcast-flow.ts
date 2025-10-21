
'use server';

/**
 * @fileOverview A Genkit flow for generating audio from text using TTS.
 *
 * - generateBroadcast - A function that handles the text-to-speech conversion.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';
import { googleAI } from '@genkit-ai/google-genai';

// Define the schema for the output, which will be a base64 encoded audio string.
const AudioResponseSchema = z.object({
  audio: z.string().describe('Base64-encoded WAV audio data as a data URI.'),
});

// The main function that will be called from the client.
export async function generateBroadcast(text: string): Promise<string> {
  const response = await broadcastFlow(text);
  return response.audio;
}

// Helper function to convert PCM audio buffer to a base64 WAV string.
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => bufs.push(d));
    writer.on('end', () => {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

// Define the Genkit flow for text-to-speech.
const broadcastFlow = ai.defineFlow(
  {
    name: 'broadcastFlow',
    inputSchema: z.string(),
    outputSchema: AudioResponseSchema,
  },
  async (query) => {
    // Generate audio using the specified TTS model.
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' }, // Choose a voice
          },
        },
      },
      prompt: query,
    });

    if (!media) {
      throw new Error('No audio media was returned from the TTS model.');
    }

    // The media URL is a base64 data URI for the PCM data. We need to extract it.
    const pcmBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    // Convert the raw PCM data to a WAV file format (as a base64 string).
    const wavBase64 = await toWav(pcmBuffer);

    // Return the WAV data as a data URI.
    return {
      audio: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);
