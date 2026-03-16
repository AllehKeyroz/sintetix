export interface ComfyNodeOutput {
    [key: string]: any;
}

export interface ComfyNode {
    inputs: Record<string, any>;
    class_type: string;
    _meta?: {
        title: string;
    };
}

export interface ComfyWorkflowJson {
    [nodeId: string]: ComfyNode;
}

export interface ComfyParameter {
    nodeId: string;
    field: string;
    label: string;
    type: "text" | "number" | "boolean" | "select";
    options?: string[]; // Para selects
    defaultValue?: any;
}

export interface ComfyMapping {
    positivePromptNodeId?: string;
    negativePromptNodeId?: string;
    widthNodeId?: string;
    heightNodeId?: string;
    baseImageNodeId?: string;
    outputNodeId?: string; // NOVO: ID do node que salva a imagem final
    promptRequired?: boolean;
    promptPlaceholder?: string;
    imageInputs?: { label: string, nodeId: string }[];
    parameterInputs?: ComfyParameter[];
}

export type WorkflowType = "generate" | "outfit" | "pose" | "scenario";
export type ComfyEngine = "comfy_icu" | "comfy_cloud" | "fal_ai";

export interface ModelCategory {
    id: string;
    name: string;
    icon: string; // Nome do ícone do lucide-react
    order?: number;
    createdAt?: any;
    updatedAt?: any;
}

export interface ComfyWorkflow {
    id: string;
    name: string;
    type: WorkflowType;
    categoryId?: string; // ID da categoria dinâmica
    rawJson: string; // the JSON string
    providerType?: "workflow" | "api"; // Tipo de motor por tras
    engine?: ComfyEngine; // NOVO: Motor de execução
    mapping: ComfyMapping;
    coverImageUrl?: string; // Capa do modelo (URL)
    createdAt?: any;
    updatedAt?: any;
}
