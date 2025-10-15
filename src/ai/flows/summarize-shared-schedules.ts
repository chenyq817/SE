'use server';

/**
 * @fileOverview Summarizes shared schedules to find intersection points.
 *
 * - summarizeSharedSchedules - A function that summarizes shared schedules.
 * - SummarizeSharedSchedulesInput - The input type for the summarizeSharedSchedules function.
 * - SummarizeSharedSchedulesOutput - The return type for the summarizeSharedSchedules function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const ScheduleEntrySchema = z.object({
  day: z.string().describe('The day of the week (e.g., Monday, Tuesday).'),
  startTime: z.string().describe('The start time of the event (e.g., 9:00 AM).'),
  endTime: z.string().describe('The end time of the event (e.g., 10:00 AM).'),
  activity: z.string().describe('The name or description of the activity.'),
});

const UserScheduleSchema = z.object({
  userId: z.string().describe('The unique identifier of the user.'),
  schedule: z.array(ScheduleEntrySchema).describe('The user schedule.'),
});

const SummarizeSharedSchedulesInputSchema = z.object({
  userSchedules: z
    .array(UserScheduleSchema)
    .describe('An array of user schedules to compare.'),
});
export type SummarizeSharedSchedulesInput = z.infer<
  typeof SummarizeSharedSchedulesInputSchema
>;

const SharedTimeSchema = z.object({
  day: z.string().describe('The day of the week when the schedules intersect.'),
  startTime: z.string().describe('The start time of the intersection.'),
  endTime: z.string().describe('The end time of the intersection.'),
  users: z
    .array(z.string())
    .describe('The user IDs who share this time slot.'),
  activitySummary: z
    .string()
    .describe(
      'A summary of what activities the users are doing during this shared time.'
    ),
});

const SummarizeSharedSchedulesOutputSchema = z.object({
  sharedTimes: z
    .array(SharedTimeSchema)
    .describe('An array of shared time slots between users.'),
});
export type SummarizeSharedSchedulesOutput = z.infer<
  typeof SummarizeSharedSchedulesOutputSchema
>;

export async function summarizeSharedSchedules(
  input: SummarizeSharedSchedulesInput
): Promise<SummarizeSharedSchedulesOutput> {
  return summarizeSharedSchedulesFlow(input);
}

const summarizeSharedSchedulesPrompt = ai.definePrompt({
  name: 'summarizeSharedSchedulesPrompt',
  input: {schema: SummarizeSharedSchedulesInputSchema},
  output: {schema: SummarizeSharedSchedulesOutputSchema},
  model: googleAI.model('gemini-1.5-flash'),
  prompt: `You are a helpful assistant designed to summarize the overlapping schedules of multiple users.

Given the following user schedules, identify and summarize any shared time slots where users are available at the same time. For each shared time slot, provide the day, start time, end time, the list of users sharing the time, and a brief summary of the activities they are engaged in during that time.

User Schedules:
{{#each userSchedules}}
  User ID: {{this.userId}}
  Schedule:
  {{#each this.schedule}}
    - {{this.day}}: {{this.startTime}} - {{this.endTime}} ({{this.activity}})
  {{/each}}
{{/each}}


Output the shared times in a structured format.
`,
});

const summarizeSharedSchedulesFlow = ai.defineFlow(
  {
    name: 'summarizeSharedSchedulesFlow',
    inputSchema: SummarizeSharedSchedulesInputSchema,
    outputSchema: SummarizeSharedSchedulesOutputSchema,
  },
  async input => {
    const {output} = await summarizeSharedSchedulesPrompt(input);
    return output!;
  }
);
