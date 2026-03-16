"use server"

import { ComfyEngine, ComfyWorkflowJson } from "@/types/comfy";
import { runComfyIcuWorkflow, getComfyIcuRunStatus } from "./comfy_icu_actions";
import { runComfyCloudWorkflow, getComfyCloudRunStatus } from "./comfy_cloud_actions";
import { runFalAiWorkflow, getFalAiRunStatus } from "./fal_ai_actions";

export interface UnifiedRunResponse {
    id: string;
    engine: ComfyEngine;
    status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
    outputs?: any;
    error?: string;
}

export async function dispatchComfyRun(
    engine: ComfyEngine = "comfy_icu", 
    workflowId: string, 
    prompt: ComfyWorkflowJson
): Promise<UnifiedRunResponse> {
    if (engine === "comfy_cloud") {
        const resp = await runComfyCloudWorkflow(prompt);
        return {
            id: resp.id,
            engine: "comfy_cloud",
            status: "PENDING"
        };
    } else if (engine === "fal_ai") {
        const resp = await runFalAiWorkflow(prompt);
        return {
            id: resp.id,
            engine: "fal_ai",
            status: "PENDING"
        };
    } else {
        const resp = await runComfyIcuWorkflow(workflowId, prompt);
        return {
            id: resp.id,
            engine: "comfy_icu",
            status: "PENDING"
        };
    }
}

export async function dispatchComfyStatus(
    engine: ComfyEngine = "comfy_icu",
    workflowId: string,
    runId: string
): Promise<UnifiedRunResponse> {
    if (engine === "comfy_cloud") {
        const resp = await getComfyCloudRunStatus(runId);
        
        // Mapear status do Comfy Cloud para o unificado
        const statusMap: Record<string, UnifiedRunResponse["status"]> = {
            "pending": "PENDING",
            "in_progress": "RUNNING",
            "completed": "COMPLETED",
            "failed": "FAILED",
            "cancelled": "CANCELLED"
        };

        return {
            id: runId,
            engine: "comfy_cloud",
            status: statusMap[resp.status] || "PENDING",
            outputs: resp.outputs,
            error: resp.error
        };
    } else if (engine === "fal_ai") {
        const resp = await getFalAiRunStatus(runId);
        return {
            id: runId,
            engine: "fal_ai",
            status: resp.status,
            outputs: resp.outputs,
            error: resp.error
        };
    } else {
        const resp = await getComfyIcuRunStatus(workflowId, runId);
        
        // Mapear status do Comfy ICU para o unificado
        const statusMap: Record<string, UnifiedRunResponse["status"]> = {
            "QUEUED": "PENDING",
            "RUNNING": "RUNNING",
            "COMPLETED": "COMPLETED",
            "FAILED": "FAILED",
            "CANCELLED": "CANCELLED"
        };

        return {
            id: runId,
            engine: "comfy_icu",
            status: statusMap[resp.status] || "PENDING",
            outputs: resp.output || resp.outputs,
            error: resp.error
        };
    }
}
