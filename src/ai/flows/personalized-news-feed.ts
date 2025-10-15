'use server';

/**
 * @fileOverview Generates a personalized news feed based on user role and interests.
 *
 * - generatePersonalizedNewsFeed - A function that generates the personalized news feed.
 * - PersonalizedNewsFeedInput - The input type for the generatePersonalizedNewsFeed function.
 * - PersonalizedNewsFeedOutput - The return type for the generatePersonalizedNewsFeed function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedNewsFeedInputSchema = z.object({
  userRole: z.enum(['student', 'faculty']).describe('The role of the user.'),
  interests: z.array(z.string()).describe('The interests of the user.'),
  newsItems: z.array(
    z.object({
      title: z.string().describe('The title of the news item.'),
      content: z.string().describe('The content of the news item.'),
      category: z.string().describe('The category of the news item.'),
      date: z.string().describe('The date of the news item.'),
    })
  ).describe('An array of news items to be filtered and prioritized.'),
});
export type PersonalizedNewsFeedInput = z.infer<typeof PersonalizedNewsFeedInputSchema>;

const PersonalizedNewsFeedOutputSchema = z.array(
  z.object({
    title: z.string().describe('The title of the news item.'),
    content: z.string().describe('The content of the news item.'),
    category: z.string().describe('The category of the news item.'),
    date: z.string().describe('The date of the news item.'),
    relevanceScore: z.number().describe('The relevance score of the news item for the user.'),
  })
);
export type PersonalizedNewsFeedOutput = z.infer<typeof PersonalizedNewsFeedOutputSchema>;

export async function generatePersonalizedNewsFeed(input: PersonalizedNewsFeedInput): Promise<PersonalizedNewsFeedOutput> {
  return personalizedNewsFeedFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedNewsFeedPrompt',
  input: {schema: PersonalizedNewsFeedInputSchema},
  output: {schema: PersonalizedNewsFeedOutputSchema},
  prompt: `You are a news personalization expert. Given a user's role ({{{userRole}}}) and interests ({{{interests}}}), and a list of news items, filter and prioritize the news items based on their relevance to the user.

News Items:
{{#each newsItems}}
Title: {{{this.title}}}
Content: {{{this.content}}}
Category: {{{this.category}}}
Date: {{{this.date}}}
---
{{/each}}

Return a list of news items, each with a relevance score (0-1) indicating how relevant the news item is to the user. The higher the score, the more relevant the news item is.

Output should be a JSON array of objects with the following fields:
- title: The title of the news item.
- content: The content of the news item.
- category: The category of the news item.
- date: The date of the news item.
- relevanceScore: The relevance score of the news item for the user (0-1).`,
});

const personalizedNewsFeedFlow = ai.defineFlow(
  {
    name: 'personalizedNewsFeedFlow',
    inputSchema: PersonalizedNewsFeedInputSchema,
    outputSchema: PersonalizedNewsFeedOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
