
'use server';
/**
 * @fileOverview A Genkit flow for creating a new news article and updating the source code.
 *
 * This flow takes news article data (title, content, category, and an image),
 * and generates the updated content for `news-data.ts` and `placeholder-images.json`.
 *
 * It is designed to be called from a client-side form. The client is then
 * responsible for taking the returned file contents and applying them.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { v4 as uuidv4 } from 'uuid';

// We can't read files directly in this environment, so we pass the content as strings.
import newsDataContent from '!!raw-loader!@/lib/news-data.ts';
import placeholderImagesContent from '!!raw-loader!@/lib/placeholder-images.json';

// Define the input schema for the flow
const CreateNewsInputSchema = z.object({
  title: z.string().describe('The title of the news article.'),
  content: z.string().describe('The main content of the news article.'),
  category: z.enum(['学术', '体育', '校园生活', '其他']).describe('The category of the news article.'),
  imageBase64: z.string().describe("A Base64 encoded image for the article, as a data URI including MIME type. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type CreateNewsInput = z.infer<typeof CreateNewsInputSchema>;

// Define the output schema for the flow, which will be the content of the modified files.
const CreateNewsOutputSchema = z.object({
  newsDataTs: z.string().describe('The full, updated content of the `src/lib/news-data.ts` file.'),
  placeholderImagesJson: z.string().describe('The full, updated content of the `src/lib/placeholder-images.json` file.'),
});
export type CreateNewsOutput = z.infer<typeof CreateNewsOutputSchema>;


/**
 * The main exported function that clients will call.
 * This is a simple wrapper around the Genkit flow.
 */
export async function createNews(input: CreateNewsInput): Promise<CreateNewsOutput> {
  return createNewsFlow(input);
}


// Define the Genkit flow
const createNewsFlow = ai.defineFlow(
  {
    name: 'createNewsFlow',
    inputSchema: CreateNewsInputSchema,
    outputSchema: CreateNewsOutputSchema,
  },
  async (input: CreateNewsInput) => {

    // 1. Generate unique IDs for the new content
    const newsId = uuidv4().substring(0, 8); // A shorter ID for news
    const imageId = `news-${newsId}`;

    // 2. Process `placeholder-images.json`
    const imagesJson = JSON.parse(placeholderImagesContent);
    const newImageEntry = {
      id: imageId,
      description: input.title, // Use news title as description
      imageUrl: input.imageBase64,
      imageHint: "custom upload"
    };
    // Add the new image to the start of the array
    imagesJson.placeholderImages.unshift(newImageEntry);
    const updatedImagesJsonString = JSON.stringify(imagesJson, null, 2);

    // 3. Process `news-data.ts`
    // Create the new news item object
    const newNewsItem = {
      id: newsId,
      title: input.title,
      category: input.category,
      excerpt: input.content.substring(0, 100).replace(/\n/g, ' ') + '...',
      content: input.content,
      imageId: imageId,
      date: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD
    };
    
    // This is a bit of a hack to add the new object to the TS file.
    // We find the start of the array and insert the new object string.
    const newsArrayRegex = /export const newsItems = \[/s;
    const match = newsDataContent.match(newsArrayRegex);

    if (!match || typeof match.index === 'undefined') {
      throw new Error('Could not find `export const newsItems = [` in news-data.ts');
    }

    const insertionIndex = match.index + match[0].length;
    const newNewsItemString = `\n  ${JSON.stringify(newNewsItem, null, 2)},`;

    const updatedNewsDataTsString =
      newsDataContent.slice(0, insertionIndex) +
      newNewsItemString +
      newsDataContent.slice(insertionIndex);
      
    // 4. Return the updated file contents
    return {
      newsDataTs: updatedNewsDataTsString,
      placeholderImagesJson: updatedImagesJsonString,
    };
  }
);
