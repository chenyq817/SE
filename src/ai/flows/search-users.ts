'use server';
/**
 * @fileOverview A server-side flow to search for users.
 * This flow uses the Firebase Admin SDK to bypass client-side security rules,
 * allowing for a safe and efficient user search.
 *
 * - searchUsers - A function that handles the user search process.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const SearchUsersInputSchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty.'),
});

const UserSearchResultSchema = z.object({
    id: z.string(),
    displayName: z.string(),
    avatarId: z.string(),
    imageBase64: z.string().optional(),
});

const SearchUsersOutputSchema = z.object({
    users: z.array(UserSearchResultSchema)
});

export type SearchUsersOutput = z.infer<typeof SearchUsersOutputSchema>;

export async function searchUsers(query: string): Promise<SearchUsersOutput> {
  return searchUsersFlow({ query });
}

const searchUsersFlow = ai.defineFlow(
  {
    name: 'searchUsersFlow',
    inputSchema: SearchUsersInputSchema,
    outputSchema: SearchUsersOutputSchema,
  },
  async ({ query }) => {
    if (!query.trim()) {
        return { users: [] };
    }

    const usersRef = db.collection('users');
    const snapshot = await usersRef
        .where('displayName', '>=', query)
        .where('displayName', '<=', query + '\uf8ff')
        .limit(10)
        .get();

    if (snapshot.empty) {
        return { users: [] };
    }

    const users = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            displayName: data.displayName || '',
            avatarId: data.avatarId || '',
            imageBase64: data.imageBase64,
        };
    });
    
    return { users };
  }
);
