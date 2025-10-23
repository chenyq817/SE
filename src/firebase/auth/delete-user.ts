
'use server';

import { getFirestore, doc, collection, query, where, getDocs, writeBatch, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase-admin/auth';
import { initializeAdminApp } from '@/firebase/admin-config';

/**
 * Deletes the current user's account and all associated data from Firestore and Firebase Authentication.
 * This is a server action and requires admin privileges to perform all operations.
 *
 * @param uid The UID of the user to delete.
 * @returns A promise that resolves to an object indicating success or failure.
 */
export async function deleteCurrentUser(uid: string): Promise<{ success: boolean; error?: string }> {
  try {
    const adminApp = initializeAdminApp();
    const adminAuth = getAuth(adminApp);
    const adminFirestore = getFirestore(adminApp);

    const batch = writeBatch(adminFirestore);

    // 1. Delete user's profile document
    const userRef = doc(adminFirestore, 'users', uid);
    batch.delete(userRef);

    // 2. Find and delete all posts by the user, and their sub-collections (comments)
    const postsQuery = query(collection(adminFirestore, 'posts'), where('authorId', '==', uid));
    const postsSnapshot = await getDocs(postsQuery);
    
    for (const postDoc of postsSnapshot.docs) {
      // Delete comments sub-collection for each post
      const commentsRef = collection(adminFirestore, 'posts', postDoc.id, 'comments');
      const commentsSnapshot = await getDocs(commentsRef);
      for (const commentDoc of commentsSnapshot.docs) {
        batch.delete(commentDoc.ref);
      }
      // Delete the post itself
      batch.delete(postDoc.ref);
    }
    
    // 3. Find and delete all wall messages by the user
    const wallMessagesQuery = query(collection(adminFirestore, 'wallMessages'), where('authorId', '==', uid));
    const wallMessagesSnapshot = await getDocs(wallMessagesQuery);
    wallMessagesSnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });

    // 4. (Optional but good practice) Handle chats: remove user from participant lists and participantInfo
    // This is more complex as it might involve leaving chats empty or notifying other users.
    // For this implementation, we will simply remove their data from chats they are in.
    const chatsQuery = query(collection(adminFirestore, 'chats'), where('participantIds', 'array-contains', uid));
    const chatsSnapshot = await getDocs(chatsQuery);
    for (const chatDoc of chatsSnapshot.docs) {
        const chatData = chatDoc.data();
        const updates: { [key: string]: any } = {};
        
        // Remove from participantIds
        updates.participantIds = chatData.participantIds.filter((id: string) => id !== uid);
        
        // Remove from participantInfo
        delete chatData.participantInfo[uid];
        updates.participantInfo = chatData.participantInfo;
        
        // If the chat becomes empty, delete it. Otherwise, update it.
        if (updates.participantIds.length === 0) {
            batch.delete(chatDoc.ref);
        } else {
            batch.update(chatDoc.ref, updates);
        }
    }


    // Commit all Firestore deletions
    await batch.commit();

    // 5. Finally, delete the user from Firebase Authentication
    await adminAuth.deleteUser(uid);

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    // Provide a more specific error message if possible
    let errorMessage = 'An unknown error occurred while deleting the account.';
    if (error.code === 'auth/requires-recent-login') {
      errorMessage = 'This operation is sensitive and requires recent authentication. Please log in again before retrying.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}
