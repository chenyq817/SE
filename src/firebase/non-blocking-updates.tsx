'use client';
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
  SetOptions,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import {FirestorePermissionError} from '@/firebase/errors';

/**
 * Initiates a setDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options: SetOptions) {
  setDoc(docRef, data, options).catch(error => {
    console.error("Error in setDocumentNonBlocking: ", error);
    // Instead of always creating a permission error, we could inspect the error code
    // For now, let's re-throw to see the actual error in the console.
    throw error;
  })
  // Execution continues immediately
}


/**
 * Initiates an addDoc operation for a collection reference.
 * Does NOT await the write operation internally.
 * Returns the Promise for the new doc ref, but typically not awaited by caller.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  // This function now re-throws any error it catches.
  // This will allow us to see the *actual* error in the Next.js overlay
  // instead of being misled by the FirestorePermissionError wrapper.
  addDoc(colRef, data)
    .catch(error => {
      console.error("Error in addDocumentNonBlocking: ", error);
      throw error; // Re-throw the original error
    });
}


/**
 * Initiates an updateDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  updateDoc(docRef, data)
    .catch(error => {
       console.error("Error in updateDocumentNonBlocking: ", error);
       throw error;
    });
}


/**
 * Initiates a deleteDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  deleteDoc(docRef)
    .catch(error => {
      console.error("Error in deleteDocumentNonBlocking: ", error);
      throw error;
    });
}
