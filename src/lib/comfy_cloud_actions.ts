"use server"

import { ComfyWorkflowJson } from "@/types/comfy";

const COMFY_CLOUD_API_BASE = "https://cloud.comfy.org/api";
const API_KEY = process.env.COMFY_CLOUD_API_KEY;

export interface ComfyCloudRunResponse {
    id: string;
    status: "pending" | "in_progress" | "completed" | "failed" | "cancelled";
    outputs?: Record<string, any>;
    error?: string;
}

/**
 * Dispara um workflow no Comfy Cloud (Official)
 */
export async function runComfyCloudWorkflow(prompt: ComfyWorkflowJson): Promise<ComfyCloudRunResponse> {
    if (!API_KEY) {
        throw new Error("COMFY_CLOUD_API_KEY não configurada no servidor.");
    }

    try {
        const response = await fetch(`${COMFY_CLOUD_API_BASE}/prompt`, {
            method: "POST",
            headers: {
                "X-API-Key": API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ prompt })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText || "Erro ao iniciar workflow no Comfy Cloud");
        }

        const data = await response.json();
        // Comfy Cloud retorna { prompt_id: "..." }
        return {
            id: data.prompt_id,
            status: "pending"
        };
    } catch (error: any) {
        console.error("Erro Comfy Cloud Run:", error);
        throw error;
    }
}

/**
 * Consulta o status e detalhes (incluindo outputs) de uma execução no Comfy Cloud
 */
export async function getComfyCloudRunStatus(promptId: string): Promise<ComfyCloudRunResponse> {
    if (!API_KEY) {
        throw new Error("API Key não configurada.");
    }

    try {
        // Usamos /api/jobs/{id} que retorna o objeto completo com status e outputs
        const response = await fetch(`${COMFY_CLOUD_API_BASE}/jobs/${promptId}`, {
            headers: {
                "X-API-Key": API_KEY
            }
        });

        if (!response.ok) {
            throw new Error(`Erro ao consultar detalhes do job ${promptId} no Comfy Cloud.`);
        }

        const data = await response.json();
        
        let outputs = data.outputs;

        // Se o job estiver completo e tiver outputs, precisamos converter os filenames em URLs acessíveis
        // O Comfy Cloud exige X-API-Key no endpoint /view e redireciona (302) para uma URL assinada.
        // Vamos tentar mapear esses outputs para URLs que o frontend possa exibir.
        if (data.status === "completed" && outputs) {
            for (const nodeId in outputs) {
                const nodeOutput = outputs[nodeId];
                // Percorrer todas as chaves do output do nó (images, video, gif, etc)
                for (const key in nodeOutput) {
                    if (Array.isArray(nodeOutput[key])) {
                        for (const fileObj of nodeOutput[key]) {
                            if (fileObj.filename && !fileObj.url) {
                                try {
                                    const viewUrl = `${COMFY_CLOUD_API_BASE}/view?filename=${fileObj.filename}&subfolder=${fileObj.subfolder || ""}&type=${fileObj.type || "output"}`;
                                    const viewResp = await fetch(viewUrl, {
                                        headers: { "X-API-Key": API_KEY },
                                        redirect: "manual"
                                    });

                                    if ([301, 302, 307, 308].includes(viewResp.status)) {
                                        fileObj.url = viewResp.headers.get("location");
                                    } else if (viewResp.ok) {
                                        fileObj.url = viewUrl;
                                    }
                                } catch (e) {
                                    console.error("Erro ao obter URL assinada para", fileObj.filename, e);
                                }
                            }
                        }
                    }
                }
            }
        }
        
        return {
            id: promptId,
            status: data.status,
            outputs: outputs,
            error: data.error || data.message
        };
    } catch (error: any) {
        console.error("Erro Comfy Cloud Details:", error);
        throw error;
    }
}
