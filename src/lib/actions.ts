"use client"

import { db, storage } from "@/lib/firebase";
import {
    doc,
    updateDoc,
    addDoc,
    collection,
    deleteDoc,
    setDoc,
    Timestamp
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// --- TIPOS ---
export type ModuleType = "identity" | "gallery" | "wardrobe" | "calendar" | "crm" | "settings"

// --- CRUD ÁLBUNS ---

/**
 * Cria um novo álbum para organizar as fotos
 */
export async function createAlbum(influencerId: string, album: { name: string, description: string }) {
    const albumsRef = collection(db, "influencers", influencerId, "albums");
    const docRef = await addDoc(albumsRef, {
        ...album,
        created_at: Timestamp.now()
    });
    return docRef.id;
}

/**
 * Deleta um álbum
 */
export async function deleteAlbum(influencerId: string, albumId: string) {
    const docRef = doc(db, "influencers", influencerId, "albums", albumId);
    await deleteDoc(docRef);
}

// --- CRUD INFLUENCIADOR ---

/**
 * Atualiza os dados principais do influenciador (Bio, Persona, Dicionário)
 */
export async function updateInfluencer(id: string, data: any, imageFile?: File | null) {
    const docRef = doc(db, "influencers", id);

    let imageUrl = data.image;

    if (imageFile) {
        const storageRef = ref(storage, `influencers/avatars/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
    }

    await updateDoc(docRef, {
        ...data,
        image: imageUrl,
        updated_at: Timestamp.now()
    });
}

/**
 * Cria um novo influenciador com perfil básico
 */
export async function createInfluencer(name: string, imageFile?: File) {
    let imageUrl = "https://via.placeholder.com/150";

    if (imageFile) {
        const storageRef = ref(storage, `influencers/avatars/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
    }

    const docRef = await addDoc(collection(db, "influencers"), {
        name,
        image: imageUrl,
        date_of_birth: "",
        base_city: "",
        backstory: "",
        socials: {
            instagram: "",
            tiktok: "",
            twitter: ""
        },
        short_bio: "",
        dossier: {
            sex: "",
            faith: "",
            career: "",
            education: "",
            origins: "",
            goals: ""
        },
        expression_dictionary: {
            grammar_rules: "",
            regionalisms: [],
            forbidden_terms: []
        },
        personality: {
            archetype: "",
            scales: { intro_extra: 50, logic_emot: 50 }
        },
        created_at: Timestamp.now()
    });

    return docRef.id;
}

// --- CRUD MOODBOARD (CLOSET / POSTS / ANCHORS) ---

/**
 * Adiciona um item ao moodboard (foto + prompt + obs)
 */
export async function addMoodboardItem(influencerId: string, item: {
    title: string,
    type: 'anchor' | 'wardrobe' | 'post' | 'highlight',
    imageFile: File,
    prompt: string,
    obs: string,
    albumId?: string | null
}) {
    // 1. Upload da imagem para o Storage
    const path = `influencers/${influencerId}/moodboard/${item.type}/${Date.now()}_${item.imageFile.name}`;
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, item.imageFile);
    const imageUrl = await getDownloadURL(snapshot.ref);

    // 2. Salva os metadados no Firestore
    const moodboardRef = collection(db, "influencers", influencerId, "moodboard");
    await addDoc(moodboardRef, {
        title: item.title,
        type: item.type,
        url: imageUrl,
        prompt: item.prompt,
        obs: item.obs,
        albumId: item.albumId || null,
        created_at: Timestamp.now()
    });
}

/**
 * Deleta um item do moodboard
 */
export async function deleteMoodboardItem(influencerId: string, itemId: string) {
    const docRef = doc(db, "influencers", influencerId, "moodboard", itemId);
    await deleteDoc(docRef);
}

// --- CRUD DICIONÁRIO ---

/**
 * Atualiza especificamente o dicionário de expressões
 */
export async function updateDictionary(influencerId: string, dictionary: {
    grammar_rules: string,
    regionalisms: string[],
    forbidden_terms: string[]
}) {
    const docRef = doc(db, "influencers", influencerId);
    await updateDoc(docRef, {
        expression_dictionary: dictionary,
        updated_at: Timestamp.now()
    });
}

// --- CRUD CALENDÁRIO SOCIAL ---

/**
 * Cria um novo rascunho de post agendado
 */
export async function createPost(influencerId: string, post: {
    title: string,
    scheduled_at: Date,
    platform: 'instagram' | 'tiktok' | 'twitter',
    status: 'draft' | 'ready' | 'posted'
}) {
    const postsRef = collection(db, "influencers", influencerId, "posts");
    const docRef = await addDoc(postsRef, {
        ...post,
        scheduled_at: Timestamp.fromDate(post.scheduled_at),
        created_at: Timestamp.now()
    });
    return docRef.id;
}

/**
 * Atualiza um post existente (legenda, imagem, status)
 */
export async function updatePost(influencerId: string, postId: string, data: any) {
    const docRef = doc(db, "influencers", influencerId, "posts", postId);
    if (data.scheduled_at instanceof Date) {
        data.scheduled_at = Timestamp.fromDate(data.scheduled_at);
    }
    await updateDoc(docRef, {
        ...data,
        updated_at: Timestamp.now()
    });
}

/**
 * Deleta um post
 */
export async function deletePost(influencerId: string, postId: string) {
    const docRef = doc(db, "influencers", influencerId, "posts", postId);
    await deleteDoc(docRef);
}
