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
  deleteDoc,
  addDoc,
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
  photo?: string; // data URL for the image
};

export type Recipient = {
  name: string;
  messageCount: number;
};

export type Feedback = {
  id: string;
  content: string;
  type: string;
  timestamp: any;
  senderId?: string;
};

export type Visit = {
    id: string;
    country: string;
    city: string;
    timestamp: any;
}

// This function is now designed to be called from the client
export function addMessage(
  content: string,
  recipient: string,
  senderId: string,
  photo?: string
): Promise<string> {
  const db = getDb();
  const messageId = uuidv4();
  const docRef = doc(db, 'public_messages', messageId);
  const messageData: Message = {
    id: messageId,
    content,
    recipient: recipient.toLowerCase().trim(),
    timestamp: serverTimestamp(),
    senderId: senderId,
  };

  if (photo) {
    messageData.photo = photo;
  }

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
    // orderBy('timestamp', 'desc') // This requires a composite index, so we sort on the client instead.
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
      photo: data.photo,
    });
  });
  
  // Sort messages by timestamp, latest first
  messages.sort((a, b) => b.timestamp - a.timestamp);

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
      photo: data.photo,
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

export async function deleteMessage(id: string): Promise<void> {
    const db = getDb();
    const docRef = doc(db, 'public_messages', id);
    try {
        await deleteDoc(docRef);
    } catch(e) {
        errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
              path: docRef.path,
              operation: 'delete',
            })
          );
        throw e;
    }
}

export async function addFeedback(content: string, type: string, senderId?: string): Promise<string> {
    const db = getDb();
    const feedbackCollection = collection(db, 'feedback');
    const feedbackData: Omit<Feedback, 'id'> = {
        content,
        type,
        timestamp: serverTimestamp(),
        senderId: senderId,
    };

    return new Promise((resolve, reject) => {
        addDoc(feedbackCollection, feedbackData).then(docRef => {
            resolve(docRef.id);
        }).catch(error => {
            errorEmitter.emit(
                'permission-error',
                new FirestorePermissionError({
                    path: 'feedback',
                    operation: 'create',
                    requestResourceData: feedbackData,
                })
            );
            reject(error);
        });
    });
}

export async function getFeedback(): Promise<Feedback[]> {
    const db = getDb();
    const q = query(collection(db, 'feedback'), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    const feedbackList: Feedback[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp as Timestamp;
        feedbackList.push({
            id: doc.id,
            content: data.content,
            type: data.type,
            timestamp: timestamp?.toDate(),
            senderId: data.senderId
        });
    });
    return feedbackList;
}


export async function addVisit(country: string, city: string): Promise<string> {
    const db = getDb();
    const visitCollection = collection(db, 'visits');
    const visitData = {
        country,
        city,
        timestamp: serverTimestamp(),
    };
     const docRef = await addDoc(visitCollection, visitData);
     return docRef.id;
}


export async function getVisits(): Promise<Visit[]> {
    const db = getDb();
    const q = query(collection(db, 'visits'), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    const visitList: Visit[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp as Timestamp;
        visitList.push({
            id: doc.id,
            country: data.country,
            city: data.city,
            timestamp: timestamp?.toDate(),
        });
    });
    return visitList;
}
