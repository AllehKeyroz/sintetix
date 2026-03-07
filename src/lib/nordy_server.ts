import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

/**
 * Recupera os cookies do Nordy salvos no Firestore (Versão Servidor)
 * Agências usam apenas seus próprios cookies. 
 * O módulo Admin (Testes) usa o cookie selecionado no Painel.
 */
export async function getNordyCookiesServer(targetId: string): Promise<string | null> {
    try {
        // 1. Se for uma Agência (não-admin), busca EXCLUSIVAMENTE o cookie dela
        if (targetId && targetId !== "admin") {
            const docRef = doc(db, "settings", `nordy_${targetId}`);
            const snap = await getDoc(docRef);

            if (snap.exists() && snap.data().cookies) {
                console.log(`[Nordy Server] Agência ${targetId} usando cookies próprios.`);
                return snap.data().cookies as string;
            }
            console.warn(`[Nordy Server] Agência ${targetId} tentando gerar sem cookies configurados.`);
            return null;
        }

        // 2. Se for o módulo ADMIN (Studio de Testes), busca o cookie selecionado no Gerenciador
        const globalRef = doc(db, "settings", "global_config");
        const globalSnap = await getDoc(globalRef);

        let selectedId = "admin";
        if (globalSnap.exists()) {
            selectedId = globalSnap.data().master_nordy_targetId || "admin";
        }

        const adminDocRef = doc(db, "settings", `nordy_${selectedId}`);
        const adminSnap = await getDoc(adminDocRef);

        if (adminSnap.exists() && adminSnap.data().cookies) {
            console.log(`[Nordy Server] Módulo Admin usando cookie selecionado de: ${selectedId}`);
            return adminSnap.data().cookies as string;
        }
    } catch (e) {
        console.error("Erro ao buscar cookies do Nordy no Firestore:", e);
    }
    return null;
}
