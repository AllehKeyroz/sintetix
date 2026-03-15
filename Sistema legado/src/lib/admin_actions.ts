"use client"

import { db } from "@/lib/firebase";
import {
    doc,
    updateDoc,
    addDoc,
    collection,
    deleteDoc,
    setDoc,
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
        await updateDoc(docRef, data);
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
        await updateDoc(docRef, data);
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
