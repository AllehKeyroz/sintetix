"use client"

import { db } from "@/lib/firebase";
import {
    collectionGroup,
    getDocs,
    query,
    where,
    Timestamp,
    collection,
    getCountFromServer
} from "firebase/firestore";

export async function getDashboardMetrics(startDate: Date, endDate: Date, modelFilter?: string) {
    try {
        const startTimestamp = Timestamp.fromDate(startDate);
        const endTimestamp = Timestamp.fromDate(endDate);

        // 1. Modelos Ativos e Criados
        const templatesRef = collection(db, "workflow_templates");
        const allTemplatesCount = await getCountFromServer(query(templatesRef));
        const activeTemplatesCount = await getCountFromServer(query(templatesRef, where("isPublished", "==", true)));

        const totalModels = allTemplatesCount.data().count;
        const activeModels = activeTemplatesCount.data().count;

        // 2. Agências
        const usersRef = collection(db, "users");
        const agenciesCount = await getCountFromServer(query(usersRef, where("role", "==", "user")));
        const totalAgencies = agenciesCount.data().count;

        // 3. Influenciadores e Demografia
        const influencersRef = collection(db, "influencers");
        const influencersCount = await getCountFromServer(query(influencersRef));
        const totalInfluencers = influencersCount.data().count;

        // Para contagem específica de gênero, vamos buscar todos rapidamente (ou usar fallback)
        const influsSnap = await getDocs(influencersRef);
        let femaleInfluencers = 0;
        let maleInfluencers = 0;
        influsSnap.forEach(doc => {
            const data = doc.data();
            const g = (data.dossier?.sex || data.gender || "").toLowerCase();
            if (g === "feminino" || g === "female" || g === "mulher") femaleInfluencers++;
            else if (g === "masculino" || g === "male" || g === "homem" || g === "boy") maleInfluencers++;
        });

        // 4. Imagens/Vídeos Gerados (Collection Group) e Histórico 
        const moodboardRef = collectionGroup(db, "moodboard");
        let mediaDocs: any[] = [];
        try {
            const q = query(moodboardRef, where("created_at", ">=", startTimestamp), where("created_at", "<=", endTimestamp));
            const mediaSnap = await getDocs(q);
            mediaDocs = mediaSnap.docs.map(d => ({ ...d.data(), id: d.id, _path: d.ref.path }));
        } catch (idxError: any) {
            console.warn("Fallback de leitura do Moodboard ativado.");
            const fallbackSnap = await getDocs(moodboardRef);
            mediaDocs = fallbackSnap.docs.map(d => ({ ...d.data(), id: d.id, _path: d.ref.path })).filter((d: any) =>
                d.created_at && d.created_at >= startTimestamp && d.created_at <= endTimestamp
            );
        }

        // --- Limpeza de Lixo (Documentos órfãos ou sem URL) ---
        // Se o influenciador pai foi deletado, o doc no collectionGroup ainda pode existir.
        // Criamos um Set de influenciadores ativos para filtrar.
        const validInfluencerIds = new Set(influsSnap.docs.map(d => d.id));
        mediaDocs = mediaDocs.filter(m => {
            if (!m.url) return false;
            const pathParts = m._path?.split('/');
            if (!pathParts || pathParts.length < 2) return false;
            const influencerId = pathParts[1];
            return validInfluencerIds.has(influencerId);
        });

        // --- Aplicar Filtro Opcional de Modelo ---
        if (modelFilter && modelFilter !== "Todos") {
            mediaDocs = mediaDocs.filter(m => m.obs?.includes(modelFilter));
        }

        // --- Filtragem terminada, agora vamos calcular o real número de SOLICITAÇÕES ---
        // Heurística: Agrupar por Influenciador + Modelo + Janela de 10 segundos
        const allRequestsTracker = new Set<string>();
        mediaDocs.forEach((item: any) => {
            const influencerId = item._path ? item._path.split('/')[1] : 'unknown';
            const mName = (item.obs && item.obs.startsWith("Modelo: ")) ? item.obs.replace("Modelo: ", "").trim() : 'generic';
            const timeBucket = item.created_at ? Math.floor(item.created_at.seconds / 10) : Date.now();
            allRequestsTracker.add(`${influencerId}_${mName}_${timeBucket}`);
        });

        const totalGenerated = allRequestsTracker.size;
        const totalPhotos = mediaDocs.filter(m => !m.url?.endsWith(".mp4") && m.type !== "video").length;
        const totalVideos = mediaDocs.filter(m => m.url?.endsWith(".mp4") || m.type === "video").length;

        // --- Gráfico de Uso por Dia ---
        const usageMap: Record<string, number> = {};

        // Inicializar os dias no range
        const cursor = new Date(startDate);
        while (cursor <= endDate) {
            const dateStr = cursor.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
            usageMap[dateStr] = 0;
            cursor.setDate(cursor.getDate() + 1);
        }

        // --- Extrato de Modelos Mais Usados (Baseado em Solicitações) ---
        const modelsMap: Record<string, number> = {};
        const requestTracker = new Set<string>();
        const dailyRequestTracker = new Set<string>();

        mediaDocs.forEach((item: any) => {
            const influencerId = item._path ? item._path.split('/')[1] : 'unknown';
            const mNameFull = (item.obs && item.obs.startsWith("Modelo: ")) ? item.obs.replace("Modelo: ", "").trim() : 'generic';
            const timeBucket = item.created_at ? Math.floor(item.created_at.seconds / 10) : Date.now();
            const genRequestKey = `${influencerId}_${mNameFull}_${timeBucket}`;

            if (item.created_at) {
                const date = new Date(item.created_at.seconds * 1000);
                const dateStr = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
                if (usageMap[dateStr] !== undefined) {
                    const dailyKey = `${dateStr}_${genRequestKey}`;
                    if (!dailyRequestTracker.has(dailyKey)) {
                        dailyRequestTracker.add(dailyKey);
                        usageMap[dateStr] += 1;
                    }
                }
            }

            if (item.obs && item.obs.startsWith("Modelo: ")) {
                const mName = item.obs.replace("Modelo: ", "").trim();
                if (!requestTracker.has(genRequestKey)) {
                    requestTracker.add(genRequestKey);
                    modelsMap[mName] = (modelsMap[mName] || 0) + 1;
                }
            }
        });

        const usageChart = Object.keys(usageMap).map(key => ({
            date: key,
            count: usageMap[key]
        }));

        const topModels = Object.entries(modelsMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5) // Pega o Top 5
            .map(([name, count]) => ({ name, count }));

        return {
            totalModels,
            activeModels,
            totalAgencies,
            totalInfluencers,
            femaleInfluencers,
            maleInfluencers,
            totalGenerated,
            totalPhotos,
            totalVideos,
            usageChart,
            topModels
        };
    } catch (error) {
        console.error("Erro ao carregar métricas para Admin", error);
        throw error;
    }
}
