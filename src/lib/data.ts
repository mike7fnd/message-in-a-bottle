'use client'; // IMPORTANT: This file now contains client-side logic

import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { initializeFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';

// This function now returns a client-side firestore instance
function getDb() {
  return initializeFirebase().firestore;
}

export type Message = {
  id: string;
  content: string;
  recipient: string;
  timestamp: any; // Can be Date, or Firebase Timestamp
  senderId?: string;
  isPolished?: boolean;
};

export type Recipient = {
  name: string;
  messageCount: number;
};

// This function is now designed to be called from the client
export function addMessage(
  content: string,
  recipient: string,
  senderId: string
): Promise<string> {
  const db = getDb();
  const messageId = uuidv4();
  const docRef = doc(db, 'public_messages', messageId);
  const messageData = {
    id: messageId,
    content,
    recipient: recipient.toLowerCase().trim(),
    timestamp: serverTimestamp(),
    senderId: senderId,
  };

  return new Promise((resolve, reject) => {
    setDoc(docRef, messageData)
      .then(() => {
        resolve(messageId);
      })
      .catch((error) => {
        // Emit a contextual error for the UI to catch
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: docRef.path,
            operation: 'create',
            requestResourceData: messageData,
          })
        );
        // Reject the promise with the original error
        reject(error);
      });
  });
}


// These functions are now intended for client-side usage.
export async function getMessagesForRecipient(
  recipient: string
): Promise<Message[]> {
  const db = getDb();
  const q = query(
    collection(db, 'public_messages'),
    where('recipient', '==', recipient.toLowerCase().trim())
    // Temporarily removed orderBy('timestamp', 'desc') to avoid needing an index
  );
  const querySnapshot = await getDocs(q);
  const messages: Message[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const timestamp = data.timestamp as Timestamp;
    messages.push({
      id: doc.id,
      content: data.content,
      recipient: data.recipient,
      timestamp: timestamp?.toDate(),
    });
  });
  return messages;
}

export async function getMessageById(id: string): Promise<Message | undefined> {
  const db = getDb();
  const docRef = doc(db, 'public_messages', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    const timestamp = data.timestamp as Timestamp;
    return {
      id: docSnap.id,
      content: data.content,
      recipient: data.recipient,
      timestamp: timestamp?.toDate(),
    };
  } else {
    return undefined;
  }
}

export async function getRecipients(): Promise<Recipient[]> {
  const db = getDb();
  const querySnapshot = await getDocs(collection(db, 'public_messages'));
  const recipientMap = new Map<string, number>();

  querySnapshot.forEach((doc) => {
    const recipient = doc.data().recipient;
    if (recipient) {
      recipientMap.set(recipient, (recipientMap.get(recipient) || 0) + 1);
    }
  });

  return Array.from(recipientMap.entries()).map(([name, messageCount]) => ({
    name,
    messageCount,
  }));
}
