"use client"

import { db } from "@/lib/firebase";
import {
    collection,
    onSnapshot,
    query,
    addDoc,
    doc,
    Timestamp,
    where,
    orderBy
} from "firebase/firestore";
import { useState, useEffect } from "react";

// Hook para buscar influenciadores
export function useInfluencers(agencyId?: string) {
    const [influencers, setInfluencers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!agencyId) {
            setInfluencers([]);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, "influencers"),
            where("agencyId", "==", agencyId)
        );

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setInfluencers(data);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error("Erro ao buscar influenciadores:", err);
                setError(err.message);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, [agencyId]);

    return { influencers, loading, error };
}

// Hook para buscar um único influenciado publicamente (sem onSnapshot se preferir, ou com ele)
export function usePublicInfluencer(id: string) {
    const [influencer, setInfluencer] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        const docRef = doc(db, "influencers", id);
        const unsubscribe = onSnapshot(docRef,
            (docSnap) => {
                if (docSnap.exists()) {
                    setInfluencer({ id: docSnap.id, ...docSnap.data() });
                } else {
                    setError("Influenciador não encontrado.");
                }
                setLoading(false);
            },
            (err) => {
                setError(err.message);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, [id]);

    return { influencer, loading, error };
}

// Hook para buscar o Moodboard de um influenciador
export function useMoodboard(influencerId: string, filters: { type?: string } = {}) {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!influencerId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        let q = query(collection(db, "influencers", influencerId, "moodboard"));

        if (filters.type) {
            q = query(q, where("type", "==", filters.type));
        }

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setItems(data);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error("Erro ao buscar moodboard:", err);
                setError(err.message);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, [influencerId]);

    return { items, loading, error };
}

// Hook para buscar os chats do Studio de um influenciador
export function useStudioChats(influencerId: string) {
    const [chats, setChats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!influencerId) {
            setChats([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const q = query(
            collection(db, "influencers", influencerId, "studio_chats")
        );

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })).sort((a: any, b: any) => {
                    const timeA = (a.updated_at || a.created_at)?.toMillis() || 0;
                    const timeB = (b.updated_at || b.created_at)?.toMillis() || 0;
                    return timeB - timeA; // Descending order
                });
                setChats(data);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error("Erro ao buscar studio chats:", err);
                setError(err.message);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, [influencerId]);

    return { chats, loading, error };
}

// Função para sementear dados iniciais (Seed)
export async function seedInitialData() {
    const influencersRef = collection(db, "influencers");
    const bellaRef = await addDoc(influencersRef, {
        name: "Bella AI",
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80",
        backstory: "Nascida em um ambiente digital futurista...",
        expression_dictionary: {
            grammar_rules: "Usar Plural Reduzido",
            regionalisms: ["Uai", "Trem"],
            forbidden_terms: ["Todavia"]
        },
        created_at: Timestamp.now()
    });

    const moodboardRef = collection(db, "influencers", bellaRef.id, "moodboard");
    await addDoc(moodboardRef, {
        type: "anchor",
        title: "Rosto Oficial",
        url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
        prompt: "high quality face, 8k",
        obs: "Referência principal",
        created_at: Timestamp.now()
    });
}

// Hook para buscar a chave salva pelo admin
export function useGeminiKey(isAdmin: boolean) {
    const [key, setKey] = useState<string>("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const docRef = doc(db, "settings", "keys");
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists() && docSnap.data().geminiKey) {
                setKey(docSnap.data().geminiKey);
            } else {
                setKey("");
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isAdmin]);

    return { key, setKey, loading };
}

// Hook para buscar os agentes
export function useAgents(isAdmin: boolean) {
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let q = collection(db, "agents");

        // Se nao for admin, so ve agentes publicados
        if (!isAdmin) {
            // Precisamos contornar erro de index caso queries complexas, 
            // entao filtramos localmente para evitar precisar aprovar index no Firebase Console
            // porem eh melhor tentar query e dar fallback
        }

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                let data: any[] = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data() as any
                }));

                // Filtro local client-side pra nao capotar por falta de index do Firestore
                if (!isAdmin) {
                    data = data.filter((d: any) => d.isPublished === true);
                }

                // @ts-ignore
                data.sort((a, b) => b.created_at?.toMillis() - a.created_at?.toMillis());

                setAgents(data);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error("Erro ao buscar agentes:", err);
                setError(err.message);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, [isAdmin]);

    return { agents, loading, error };
}

// Hook para buscar histórico de chats do usuário
export function useChats(userId: string | undefined) {
    const [chats, setChats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const q = collection(db, "users", userId, "chats");
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
            data.sort((a, b) => b.updated_at?.toMillis() - a.updated_at?.toMillis());
            setChats(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    return { chats, loading };
}
