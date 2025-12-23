
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
  DocumentData,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { initializeFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { getAuth, deleteUser } from 'firebase/auth';


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

export type Review = {
    id: string;
    rating: number;
    content: string;
    senderId: string;
    senderName: string;
    timestamp: any;
};

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

  const messageData: Message = {
    id: messageId,
    content,
    recipient: recipientId,
    timestamp: serverTimestamp(),
  };

  // Only add senderId if the user is not anonymous
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

export async function getMessagesPaginated(
  pageSize: number,
  lastDoc?: DocumentData | null,
  searchTerm?: string
): Promise<{ messages: Message[]; lastVisible: DocumentData | null }> {
  const db = getDb();
  const messagesRef = collection(db, 'public_messages');
  let q;

  if (searchTerm) {
    const lowercasedTerm = searchTerm.toLowerCase();
    // Simplified query for searching: filter only.
    q = query(
      messagesRef,
      where('recipient', '>=', lowercasedTerm),
      where('recipient', '<=', lowercasedTerm + '\uf8ff'),
      limit(pageSize)
    );
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
  } else {
    // Original query for browsing, with ordering.
    q = query(messagesRef, orderBy('timestamp', 'desc'), limit(pageSize));
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
  }

  const querySnapshot = await getDocs(q);

  const messages = querySnapshot.docs.map((doc) => {
    const data = doc.data();
    const timestamp = data.timestamp as Timestamp;
    return {
      id: doc.id,
      content: data.content,
      recipient: data.recipient,
      timestamp: timestamp?.toDate(),
      photo: data.photo,
      spotifyTrackId: data.spotifyTrackId,
    } as Message;
  });

  // If searching, sort results on the client-side
  if (searchTerm) {
    messages.sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
  }

  const newLastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null;

  return { messages, lastVisible: newLastVisible };
}


export async function getRecipientsByFallback(searchTerm?: string): Promise<Recipient[]> {
  const db = getDb();
  let messagesQuery;

  if (searchTerm) {
    const lowercasedTerm = searchTerm.toLowerCase();
    // Query for recipients starting with the search term.
    messagesQuery = query(
      collection(db, 'public_messages'),
      where('recipient', '>=', lowercasedTerm),
      where('recipient', '<=', lowercasedTerm + '\uf8ff')
    );
  } else {
    // Default browse view: fetch the latest 100 messages for performance.
    messagesQuery = query(
      collection(db, 'public_messages'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
  }
  
  const querySnapshot = await getDocs(messagesQuery);

  const recipientMap = new Map<string, { count: number; latestTimestamp: any }>();

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const recipientName = data.recipient; // Already lowercase
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
    lastMessageTimestamp: data.lastMessageTimestamp,
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

  return { recipients, lastVisible: newLastVisible as DocumentData | null };
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

export async function editMessage(id: string, newContent: string): Promise<boolean> {
    const db = getDb();
    const docRef = doc(db, 'public_messages', id);
    try {
        await updateDoc(docRef, {
            content: newContent
        });
        return true;
    } catch(e) {
        errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
                path: docRef.path,
                operation: 'update',
                requestResourceData: { content: newContent }
            })
        );
        console.error(e); // Added for debugging
        return false;
    }
}

export async function getMessagesForUser(userId: string): Promise<Message[]> {
    const db = getDb();
    const messagesRef = collection(db, 'public_messages');
    
    // This query no longer needs a composite index.
    const q = query(
        messagesRef,
        where('senderId', '==', userId),
    );
    
    const querySnapshot = await getDocs(q);

    const messages: Message[] = [];
    
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const timestamp = (data.timestamp as Timestamp)?.toDate();
        
        messages.push({
            id: doc.id,
            content: data.content,
            recipient: data.recipient,
            timestamp: timestamp,
            photo: data.photo,
            senderId: data.senderId,
            spotifyTrackId: data.spotifyTrackId,
        });
    });
    
    // Sort on the client side after fetching
    messages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return messages;
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

export async function addReview(rating: number, content: string, senderId: string, senderName: string): Promise<string> {
    const db = getDb();
    const reviewId = uuidv4();
    const reviewDocRef = doc(db, 'reviews', reviewId);
    
    const reviewData = {
        id: reviewId,
        rating,
        content,
        senderId,
        senderName,
        timestamp: serverTimestamp(),
    };

    try {
        await setDoc(reviewDocRef, reviewData);
        return reviewId;
    } catch (error) {
        errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
                path: reviewDocRef.path,
                operation: 'create',
                requestResourceData: reviewData,
            })
        );
        throw error;
    }
}

export async function getReviews(): Promise<Review[]> {
    const db = getDb();
    const q = query(collection(db, 'reviews'), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    const reviews: Review[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp as Timestamp;
        reviews.push({
            id: doc.id,
            rating: data.rating,
            content: data.content,
            senderId: data.senderId,
            senderName: data.senderName,
            timestamp: timestamp?.toDate(),
        });
    });
    return reviews;
}

export async function deleteUserAndData(uid: string): Promise<boolean> {
    const db = getDb();
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user || user.uid !== uid) {
        console.error("User not authenticated or UID mismatch.");
        return false;
    }
    
    try {
        const batch = writeBatch(db);

        // Delete user's document from the 'users' collection
        const userDocRef = doc(db, 'users', uid);
        batch.delete(userDocRef);

        // Find and delete all messages sent by the user
        const messagesQuery = query(collection(db, 'public_messages'), where('senderId', '==', uid));
        const messagesSnapshot = await getDocs(messagesQuery);
        messagesSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Commit the batch delete
        await batch.commit();

        // Finally, delete the user from Firebase Authentication
        await deleteUser(user);

        return true;
    } catch (error) {
        console.error("Error deleting user and data:", error);
        return false;
    }
}
