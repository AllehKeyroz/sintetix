"use client"

import { db } from "@/lib/firebase";
import {
    doc,
    updateDoc,
    addDoc,
    collection,
    deleteDoc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    Timestamp,
    orderBy
} from "firebase/firestore";
import { ComfyWorkflow, ModelCategory } from "@/types/comfy";

/**
 * Salva ou atualiza um template de workflow global
 */
export async function saveWorkflowTemplate(template: Partial<ComfyWorkflow> & { isPublished?: boolean }) {
    const templatesRef = collection(db, "workflow_templates");

    const data = {
        ...template,
        updatedAt: Timestamp.now(),
        isPublished: template.isPublished ?? false
    };

    if (template.id) {
        const docRef = doc(db, "workflow_templates", template.id);
        // Usamos setDoc com merge para criar se não existir ou atualizar se já existir
        await setDoc(docRef, {
            ...data,
            // Garante que tenha um createdAt se for criação
            ...(template.createdAt ? {} : { createdAt: Timestamp.now() })
        }, { merge: true });
        return template.id;
    } else {
        const docRef = await addDoc(templatesRef, {
            ...data,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    }
}

/**
 * Deleta um template de workflow
 */
export async function deleteWorkflowTemplate(id: string) {
    const docRef = doc(db, "workflow_templates", id);
    await deleteDoc(docRef);
}

/**
 * Lista templates de workflow
 */
export async function listWorkflowTemplates(onlyPublished: boolean = true) {
    const templatesRef = collection(db, "workflow_templates");
    let q;

    if (onlyPublished) {
        q = query(templatesRef, where("isPublished", "==", true), orderBy("createdAt", "desc"));
    } else {
        q = query(templatesRef, orderBy("createdAt", "desc"));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as (ComfyWorkflow & { isPublished: boolean })[];
}

// --- CRUD CATEGORIAS DE MODELOS ---

/**
 * Salva ou atualiza uma categoria de modelo
 */
export async function saveModelCategory(category: Partial<ModelCategory>) {
    const categoriesRef = collection(db, "model_categories");

    const data = {
        name: category.name,
        icon: category.icon,
        order: category.order || 0,
        updatedAt: Timestamp.now()
    };

    if (category.id) {
        const docRef = doc(db, "model_categories", category.id);
        await setDoc(docRef, {
            ...data,
            ...(category.createdAt ? {} : { createdAt: Timestamp.now() })
        }, { merge: true });
        return category.id;
    } else {
        const docRef = await addDoc(categoriesRef, {
            ...data,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    }
}

/**
 * Deleta uma categoria de modelo
 */
export async function deleteModelCategory(id: string) {
    const docRef = doc(db, "model_categories", id);
    await deleteDoc(docRef);
}

/**
 * Lista categorias de modelos
 */
export async function listModelCategories() {
    const categoriesRef = collection(db, "model_categories");
    const q = query(categoriesRef, orderBy("order", "asc"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as ModelCategory[];
}

/**
 * Conta o total de agências (usuários não-admin)
 */
export async function countAgencies() {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("role", "==", "user"));
    const snapshot = await getDocs(q);
    return snapshot.size;
}

export interface CanvasWorkflowData {
    id: string;
    name: string;
    nodes: any[];
    edges: any[];
    createdAt?: any;
    updatedAt?: any;
}

export async function saveCanvasWorkflow(workflow: Partial<CanvasWorkflowData>) {
    const data = {
        ...workflow,
        updatedAt: Timestamp.now(),
    };

    if (workflow.id) {
        const docRef = doc(db, "canvas_workflows", workflow.id);
        await setDoc(docRef, {
            ...data,
            ...(workflow.createdAt ? {} : { createdAt: Timestamp.now() })
        }, { merge: true });
        return workflow.id;
    } else {
        const templatesRef = collection(db, "canvas_workflows");
        const docRef = await addDoc(templatesRef, {
            ...data,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    }
}

export async function listCanvasWorkflows(): Promise<CanvasWorkflowData[]> {
    const q = query(collection(db, "canvas_workflows"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    return snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as CanvasWorkflowData[];
}

export async function deleteCanvasWorkflow(id: string) {
    await deleteDoc(doc(db, "canvas_workflows", id));
}

// Configuração Global (Admin)
export async function getGlobalPrompt(): Promise<string> {
    const docRef = doc(db, "settings", "global_prompt");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        return snap.data()?.content || "";
    }
    return 'Você é o Sintetix AI, uma inteligência artificial assistente e gerente dentro de uma agência de criação voltada a influenciadores sintéticos e visuais baseados em IA. Como um "SaaS Assistant", você deve ajudar o gerente a estruturar workflows, construir personas virtuais, planejar conteúdo, criar descrições chamativas para marketing e gerar ideias de design com assertividade comercial e criatividade de ponta. Responda de maneira profissional, altamente tecnológica, direta e colaborativa.';
}

export async function saveGlobalPrompt(content: string) {
    const docRef = doc(db, "settings", "global_prompt");
    await setDoc(docRef, { content, updatedAt: Timestamp.now() }, { merge: true });
}
