"use client"

import { db } from "@/lib/firebase";
import {
    collection,
    onSnapshot,
    query,
    addDoc,
    doc,
    Timestamp,
    where
} from "firebase/firestore";
import { useState, useEffect } from "react";

// Hook para buscar influenciadores
export function useInfluencers() {
    const [influencers, setInfluencers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const q = query(collection(db, "influencers"));
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
    }, []);

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
