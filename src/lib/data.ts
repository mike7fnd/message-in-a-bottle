
'use client'; // IMPORTANT: This file now contains client-side logic

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
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
  spotifyTrackId?: string;
};

export type Recipient = {
  name: string;
  messageCount: number;
  lastMessageTimestamp: any;
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
export async function addMessage(
  content: string,
  recipient: string,
  senderId?: string, // senderId is now optional for anonymous users
  photo?: string,
  spotifyTrackId?: string,
): Promise<string> {
  const db = getDb();
  const recipientId = recipient.toLowerCase().trim();
  const messageId = uuidv4();
  
  const messageDocRef = doc(db, 'public_messages', messageId);

  const messageData: Partial<Message> = {
    id: messageId,
    content,
    recipient: recipientId,
    timestamp: serverTimestamp(),
  };

  if (senderId) {
    messageData.senderId = senderId;
  }

  if (photo) {
    messageData.photo = photo;
  }

  if (spotifyTrackId) {
    messageData.spotifyTrackId = spotifyTrackId;
  }

  try {
    // CRITICAL FIX: No more transaction. Just set the message document directly.
    // This avoids the permission error caused by trying to write to the 'recipients' collection.
    await setDoc(messageDocRef, messageData);
    return messageId;
  } catch (error) {
     // Emit a contextual error for the UI to catch
     errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: messageDocRef.path,
        operation: 'create',
        requestResourceData: messageData,
      })
    );
    // Reject the promise with the original error
    throw error;
  }
}

// These functions are now intended for client-side usage.
export async function getMessagesForRecipient(
  recipient: string
): Promise<Message[]> {
  const db = getDb();
  // Removed orderBy from the query to avoid needing a composite index.
  const q = query(
    collection(db, 'public_messages'),
    where('recipient', '==', recipient.toLowerCase().trim())
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
      spotifyTrackId: data.spotifyTrackId,
    });
  });

  // Perform the sorting on the client-side.
  messages.sort((a, b) => {
    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return timeB - timeA;
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
      photo: data.photo,
      spotifyTrackId: data.spotifyTrackId,
    };
  } else {
    return undefined;
  }
}

export async function getRecipientsByFallback(): Promise<Recipient[]> {
  const db = getDb();
  // Fetch ALL messages to build a complete and accurate recipient list.
  const q = query(
    collection(db, 'public_messages'), 
    orderBy('timestamp', 'desc')
  );
  const querySnapshot = await getDocs(q);

  const recipientMap = new Map<string, { count: number; latestTimestamp: any }>();

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const recipientName = data.recipient.toLowerCase().trim();
    const timestamp = data.timestamp;

    const current = recipientMap.get(recipientName) || { count: 0, latestTimestamp: new Date(0) };
    
    let currentTimestamp = new Date(0);
    if(timestamp && typeof timestamp.toDate === 'function') {
        currentTimestamp = timestamp.toDate();
    }
    
    let latestTimestamp = current.latestTimestamp;
    if (current.latestTimestamp && typeof current.latestTimestamp.toDate === 'function') {
        latestTimestamp = current.latestTimestamp.toDate();
    }

    recipientMap.set(recipientName, {
      count: current.count + 1,
      latestTimestamp: currentTimestamp > latestTimestamp ? data.timestamp : current.latestTimestamp,
    });
  });

  const recipients: Recipient[] = Array.from(recipientMap.entries()).map(([name, data]) => ({
    name,
    messageCount: data.count,
    lastMessageTimestamp: data.latestTimestamp,
  }));

  recipients.sort((a, b) => {
    const timeA = a.lastMessageTimestamp?.toDate ? a.lastMessageTimestamp.toDate().getTime() : 0;
    const timeB = b.lastMessageTimestamp?.toDate ? b.lastMessageTimestamp.toDate().getTime() : 0;
    return timeB - timeA;
  });
  
  return recipients;
}


// Kept for potential future use or if the backend function is ever implemented,
// but it is no longer used by the RecipientContext.
export async function getRecipients(
  batchSize: number = 8,
  lastVisible?: Document | null
): Promise<{ recipients: Recipient[]; lastVisible: Document | null }> {
  const db = getDb();
  
  let q;
  if (lastVisible) {
      q = query(
          collection(db, "recipients"),
          orderBy("lastMessageTimestamp", "desc"),
          startAfter(lastVisible),
          limit(batchSize)
      );
  } else {
      q = query(
          collection(db, "recipients"),
          orderBy("lastMessageTimestamp", "desc"),
          limit(batchSize)
      );
  }

  const querySnapshot = await getDocs(q);
  
  const recipients: Recipient[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    recipients.push({
      name: data.name,
      messageCount: data.messageCount,
      lastMessageTimestamp: data.lastMessageTimestamp,
    });
  });
  
  const newLastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null;

  return { recipients, lastVisible: newLastVisible };
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
    const feedbackData: Omit<Feedback, 'id' | 'timestamp'> & { senderId?: string, timestamp: any } = {
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

    