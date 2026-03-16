"use server"

import { fal } from "@fal-ai/client";
import { ComfyWorkflowJson } from "@/types/comfy";

/**
 * Nota: O fal extrai a chave automaticamente de process.env.FAL_KEY
 */

export interface FalAiRunResponse {
    id: string;
    status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
    outputs?: any;
    error?: string;
}

/**
 * Dispara um workflow no Fal.ai usando o endpoint especializado em ComfyUI
 */
export async function runFalAiWorkflow(prompt: ComfyWorkflowJson): Promise<FalAiRunResponse> {
    if (!process.env.FAL_KEY) {
        throw new Error("FAL_KEY não configurada no servidor.");
    }

    try {
        // Usamos a fila (queue) para bater com o modelo de polling do resto do app
        const result = await fal.queue.submit("fal-ai/comfy-ui", {
            input: {
                workflow_json: JSON.stringify(prompt)
            },
        });

        return {
            id: result.request_id,
            status: "PENDING"
        };
    } catch (error: any) {
        console.error("Erro Fal.ai Run:", error);
        throw error;
    }
}

/**
 * Consulta o status de uma execução no Fal.ai
 */
export async function getFalAiRunStatus(requestId: string): Promise<FalAiRunResponse> {
    if (!process.env.FAL_KEY) {
        throw new Error("FAL_KEY não configurada.");
    }

    try {
        const status = await fal.queue.status("fal-ai/comfy-ui", {
            requestId: requestId,
            logs: true // Ativar logs pode ser útil para debug futuro
        });

        // Mapeamento de status do Fal para o unificado
        const statusMap: Record<string, FalAiRunResponse["status"]> = {
            "IN_PROGRESS": "RUNNING",
            "IN_QUEUE": "PENDING",
            "COMPLETED": "COMPLETED",
            "FAILED": "FAILED",
            "CANCELLED": "CANCELLED"
        };

        const unifiedStatus = statusMap[status.status] || "PENDING";

        // Se estiver completo, buscamos o resultado
        let outputs = null;
        if (status.status === "COMPLETED") {
            const result: any = await fal.queue.result("fal-ai/comfy-ui", {
                requestId: requestId
            });
            
            // O Fal.ai retorna os outputs do ComfyUI dentro do campo 'outputs' ou similar
            // Dependendo de como o workflow foi construído. 
            // Geralmente ele espelha a estrutura do Comfy Cloud.
            outputs = result.outputs || result;
        }

        return {
            id: requestId,
            status: unifiedStatus,
            outputs: outputs,
            error: (status as any).error
        };
    } catch (error: any) {
        console.error("Erro Fal.ai Status:", error);
        throw error;
    }
}
