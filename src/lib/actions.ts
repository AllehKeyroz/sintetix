"use client"

import { db, storage } from "@/lib/firebase";
import {
    doc,
    updateDoc,
    addDoc,
    collection,
    getDocs,
    getDoc,
    deleteDoc,
    setDoc,
    Timestamp
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// --- TIPOS ---
export type ModuleType = "dashboard" | "identity" | "gallery" | "wardrobe" | "studio" | "calendar" | "crm" | "settings" | "admin_dashboard" | "admin_models" | "admin_studio" | "admin_gallery" | "admin_cookies" | "agent_chat"

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
 * Atualiza o perfil do usuário (ex: nome da agência)
 */
export async function updateUserProfile(uid: string, data: any) {
    const docRef = doc(db, "users", uid);
    await updateDoc(docRef, {
        ...data,
        updated_at: Timestamp.now()
    });
}

/**
 * Deleta um influenciador definitivamente
 */
export async function deleteInfluencer(id: string) {
    const docRef = doc(db, "influencers", id);
    await deleteDoc(docRef);
}

/**
 * Cria um novo influenciador com perfil básico
 */
export async function createInfluencer(name: string, agencyId: string, gender: string, imageFile?: File) {
    let imageUrl = null; // Removida a URL placeholder para evitar imagem quebrada

    if (imageFile) {
        const storageRef = ref(storage, `influencers/avatars/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
    }

    const docRef = await addDoc(collection(db, "influencers"), {
        name,
        agencyId,
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
            sex: gender, // Define o sexo aqui
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

// --- CRUD CATEGORIAS DE GUARDA-ROUPA ---

/**
 * Cria uma nova categoria de guarda-roupa
 */
export async function createWardrobeCategory(influencerId: string, category: { label: string, iconName: string }) {
    const categoriesRef = collection(db, "influencers", influencerId, "wardrobe_categories");
    const docRef = await addDoc(categoriesRef, {
        ...category,
        created_at: Timestamp.now()
    });
    return docRef.id;
}

/**
 * Deleta uma categoria de guarda-roupa
 */
export async function deleteWardrobeCategory(influencerId: string, categoryId: string) {
    const docRef = doc(db, "influencers", influencerId, "wardrobe_categories", categoryId);
    await deleteDoc(docRef);
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
    albumId?: string | null,
    categoryId?: string | null
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
        categoryId: item.categoryId || null,
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

// --- GEMINI KEY & AGENTS ---

/**
 * Salva a chave do Gemini (só admin)
 */
export async function saveGeminiKey(key: string) {
    const docRef = doc(db, "settings", "keys");
    await setDoc(docRef, { geminiKey: key }, { merge: true });
}

export async function createAgent(agent: { name: string, systemPrompt: string, modelId: string, isPublished: boolean }) {
    const agentsRef = collection(db, "agents");
    const docRef = await addDoc(agentsRef, {
        ...agent,
        created_at: Timestamp.now()
    });
    return docRef.id;
}

export async function updateAgent(id: string, agent: Partial<{ name: string, systemPrompt: string, modelId: string, isPublished: boolean }>) {
    const docRef = doc(db, "agents", id);
    await updateDoc(docRef, {
        ...agent,
        updated_at: Timestamp.now()
    });
}

export async function deleteAgent(id: string) {
    const docRef = doc(db, "agents", id);
    await deleteDoc(docRef);
}

// --- CHAT SESSIONS ---

export async function createChatSession(userId: string, data: { agentId: string; messages: any[]; title: string; }) {
    const chatsRef = collection(db, "users", userId, "chats");
    const docRef = await addDoc(chatsRef, {
        ...data,
        updated_at: Timestamp.now(),
        created_at: Timestamp.now()
    });
    return docRef.id;
}

export async function updateChatSession(userId: string, chatId: string, messages: any[]) {
    const docRef = doc(db, "users", userId, "chats", chatId);
    await updateDoc(docRef, {
        messages,
        updated_at: Timestamp.now()
    });
}

export async function deleteChatSession(userId: string, chatId: string) {
    const docRef = doc(db, "users", userId, "chats", chatId);
    await deleteDoc(docRef);
}

/**
 * Salva os cookies do Nordy para uma agência ou admin
 * @param targetId O agencyId ou "admin"
 * @param cookies String de cookies vinda da extensão
 * @param meta Dados opcionais como cota e label
 */
export async function saveNordyCookies(targetId: string, cookies: string, meta?: { quota_total?: number, quota_used?: number, label?: string, email?: string | null }) {
    const docRef = doc(db, "settings", `nordy_${targetId}`);

    // Normalização básica de cookies
    let normalizedCookies = cookies;
    if (typeof cookies === "string" && !cookies.includes("=")) {
        normalizedCookies = `nordy-auth=${cookies}`;
    }

    await setDoc(docRef, {
        cookies: normalizedCookies,
        ...meta,
        targetId,
        updated_at: Timestamp.now()
    }, { merge: true });
}

/**
 * Lista todos os cookies salvos, enriquecendo com o nome da agência vindo do perfil
 */
export async function listNordyCookies() {
    const settingsRef = collection(db, "settings");
    const querySnapshot = await getDocs(settingsRef);

    const cookies = await Promise.all(querySnapshot.docs
        .filter((doc: any) => doc.id.startsWith("nordy_"))
        .map(async (docSnap: any) => {
            const data = docSnap.data();
            const targetId = docSnap.id.replace("nordy_", "");

            // Tenta buscar o nome amigável da agência no perfil do usuário
            let nameFromProfile = null;
            if (targetId !== "admin") {
                try {
                    const userRef = doc(db, "users", targetId);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        nameFromProfile = userSnap.data().agencyName;
                    }
                } catch (e) { }
            }

            return {
                id: docSnap.id,
                targetId,
                ...data,
                agencyName: nameFromProfile || data.agencyName // Fallback para o que tiver no doc do cookie
            };
        }));

    const globalRef = doc(db, "settings", "global_config");
    const globalSnap = await getDoc(globalRef);
    const activeMaster = globalSnap.exists() ? globalSnap.data().master_nordy_targetId : "admin";

    return {
        cookies: cookies.sort((a: any, b: any) => (b.updated_at?.seconds || 0) - (a.updated_at?.seconds || 0)),
        activeMaster
    };
}

/**
 * Deleta cookies de uma agência
 */
export async function deleteNordyCookie(targetId: string) {
    const docRef = doc(db, "settings", `nordy_${targetId}`);
    await deleteDoc(docRef);
}

/**
 * Define qual cookie será o "Ativo Global" (usado como fallback master)
 */
export async function setActiveNordyCookie(targetId: string) {
    const docRef = doc(db, "settings", "global_config");
    await setDoc(docRef, {
        master_nordy_targetId: targetId,
        updated_at: Timestamp.now()
    }, { merge: true });
}

/**
 * Recupera os cookies do Nordy salvos no Firestore
 */
export async function getNordyCookies(targetId: string): Promise<string | null> {
    const docRef = doc(db, "settings", `nordy_${targetId}`);
    const { getDoc } = await import("firebase/firestore");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        return snap.data().cookies as string;
    }
    return null;
}
