"use client"

import { db } from "@/lib/firebase";
import {
    doc,
    getDoc,
    addDoc,
    collection,
    deleteDoc,
    Timestamp,
    updateDoc
} from "firebase/firestore";

export async function createStudioChat(influencerId: string, title: string) {
    const chatRef = collection(db, "influencers", influencerId, "studio_chats");
    const docRef = await addDoc(chatRef, {
        title,
        history: [],
        created_at: Timestamp.now()
    });
    return docRef.id;
}

export async function getStudioChat(influencerId: string, chatId: string) {
    const docRef = doc(db, "influencers", influencerId, "studio_chats", chatId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        const data = snap.data();
        return { id: snap.id, ...data };
    }
    return null;
}

export async function updateStudioChat(influencerId: string, chatId: string, history: any[]) {
    const docRef = doc(db, "influencers", influencerId, "studio_chats", chatId);
    await updateDoc(docRef, {
        history,
        updated_at: Timestamp.now()
    });
}

export async function deleteStudioChat(influencerId: string, chatId: string) {
    const docRef = doc(db, "influencers", influencerId, "studio_chats", chatId);
    await deleteDoc(docRef);
}
