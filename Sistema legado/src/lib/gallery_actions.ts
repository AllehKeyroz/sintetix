"use client"

import { db, storage } from "@/lib/firebase";
import {
    doc,
    addDoc,
    collection,
    deleteDoc,
    Timestamp,
    updateDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Adicionar imagem direta da internet (salvando localmente no Firebase Storage também se preferir) ou só o link
export async function addGeneratedImageToGallery(influencerId: string, item: {
    title: string,
    url: string,
    prompt: string,
    model_info: string,
    type: string, // "studio" / "wardrobe" etc
    agencyName?: string
}) {
    const moodboardRef = collection(db, "influencers", influencerId, "moodboard");
    await addDoc(moodboardRef, {
        title: item.title,
        type: item.type,
        url: item.url,
        prompt: item.prompt,
        obs: `Modelo: ${item.model_info}${item.agencyName ? ` | Agência: ${item.agencyName}` : ''}`,
        albumId: null,
        categoryId: null,
        created_at: Timestamp.now()
    });
}
