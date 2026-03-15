"use server"

import { ComfyMapping, ComfyWorkflowJson } from "@/types/comfy";

const COMFY_ICU_API_BASE = "https://comfy.icu/api/v1";
const API_KEY = process.env.COMFY_ICU_API_KEY;

export interface ComfyIcuRunResponse {
    id: string;
    workflow_id: string;
    status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
    output?: any[];
    outputs?: {
        [nodeId: string]: {
            images?: { url: string }[];
            gifs?: { url: string }[];
            videos?: { url: string }[];
            audio?: { url: string }[];
        };
    };
    error?: string;
}

/**
 * Dispara um workflow no ComfyICU com o prompt (API JSON) modificado.
 */
export async function runComfyIcuWorkflow(workflowId: string, prompt: ComfyWorkflowJson): Promise<ComfyIcuRunResponse> {
    if (!API_KEY) {
        throw new Error("COMFY_ICU_API_KEY não configurada no servidor.");
    }

    try {
        const response = await fetch(`${COMFY_ICU_API_BASE}/workflows/${workflowId}/runs`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ prompt })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || "Erro ao iniciar workflow no ComfyICU");
        }

        return await response.json();
    } catch (error: any) {
        console.error("Erro ComfyICU Run:", error);
        throw error;
    }
}

/**
 * Consulta o status de uma execução específica.
 */
export async function getComfyIcuRunStatus(workflowId: string, runId: string): Promise<ComfyIcuRunResponse> {
    if (!API_KEY) {
        throw new Error("API Key não configurada.");
    }

    try {
        const response = await fetch(`${COMFY_ICU_API_BASE}/workflows/${workflowId}/runs/${runId}`, {
            headers: {
                "Authorization": `Bearer ${API_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error("Erro ao consultar status da execução.");
        }

        const data = await response.json();
        console.log("Comfy Status Resp:", JSON.stringify(data, null, 2));
        return data;
    } catch (error: any) {
        console.error("Erro ComfyICU Status:", error);
        throw error;
    }
}
