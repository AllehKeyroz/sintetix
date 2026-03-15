"use client"

import React, { useState, useCallback, useEffect, useRef, createContext, useContext } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import {
    ReactFlow,
    Handle,
    Position,
    useNodesState,
    useEdgesState,
    addEdge,
    Background,
    Controls,
    Node,
    NodeProps,
    Connection,
    ReactFlowInstance,
    useReactFlow,
    Panel,
    Edge,
    BaseEdge,
    EdgeProps,
    EdgeLabelRenderer,
    getSmoothStepPath,
    NodeResizeControl,
    reconnectEdge
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Zap, Sparkles, Trash2, Plus, Box, Play, Layers, Search, X, ChevronDown, Type, ImageIcon, ChevronRight, Loader2, AlertCircle, Download, ExternalLink, MousePointer2, Image, Save, FolderOpen, FileDown, FileUp, Send, ArrowRight } from "lucide-react"
import { ComfyWorkflow, ModelCategory, ComfyWorkflowJson } from "@/types/comfy"
import { cn } from "@/lib/utils"
import { listModelCategories, listWorkflowTemplates, saveCanvasWorkflow, listCanvasWorkflows, deleteCanvasWorkflow, CanvasWorkflowData, saveWorkflowTemplate } from "@/lib/admin_actions"
import { dispatchComfyRun, dispatchComfyStatus } from "@/lib/comfy_dispatcher"
import { addMoodboardItem, listAgents } from "@/lib/actions"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/context/AuthContext"

// --- CONSTANTS ---
const nodeContainerStyle = "bg-[#121214] border border-white/10 rounded-xl p-5 shadow-2xl min-w-[200px] transition-all group relative";
const labelStyle = "text-[9px] uppercase font-black text-white/30 tracking-[0.2em] mb-2 block ml-1";
const inputStyle = "w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2.5 text-xs text-white/90 outline-none focus:border-primary/50 transition-all appearance-none";

// --- CONTEXT: Para alcançar as funções de execução a partir dos nós internos ---
const CanvasContext = createContext<{
    onPlayNode: (id: string, e: React.MouseEvent) => void,
    onEdgeClick?: (e: React.MouseEvent, id: string) => void,
    onRemoveNode: (id: string) => void,
    takeSnapshot: () => void
} | null>(null);

// --- CUSTOM NODE: INPUT TEXT ---
const TextNode = ({ id, data }: NodeProps) => {
    const { setNodes } = useReactFlow()
    const ctx = useContext(CanvasContext)
    const [text, setText] = useState(data.text as string || "")

    const handleChange = (val: string) => {
        setText(val)
        setNodes((nds) => nds.map((node) => node.id === id ? { ...node, data: { ...node.data, text: val } } : node))
    }

    return (
        <div className={cn(nodeContainerStyle, "min-w-[220px] h-full !p-0 hover:border-emerald-500/30 flex flex-col group/textnode relative")}>
            {/* Handle Target (Input) */}
            <div className="absolute left-[-38px] top-1/2 -translate-y-1/2 flex items-center group/h-in z-50">
                <div className="w-3.5 h-3.5 bg-emerald-500 border-2 border-[#1a1a1d] shadow-[0_0_10px_rgba(16,185,129,0.3)] rounded-full relative group-hover/h-in:scale-110 transition-all flex items-center justify-center">
                    <Handle type="target" position={Position.Left} className="!w-full !h-full !bg-transparent !border-none cursor-crosshair !m-0 !absolute !inset-0" />
                </div>
                <div className="w-7 h-7 rounded-lg bg-[#111113] border border-white/10 flex items-center justify-center text-emerald-500/40 group-hover/h-in:text-emerald-500 group-hover/h-in:border-emerald-500/30 group-hover/h-in:bg-emerald-500/10 transition-all shadow-2xl ml-1.5">
                    <Type className="w-3.5 h-3.5 pointer-events-none" />
                </div>
            </div>

            {/* Handle Source (Output) */}
            <div className="absolute right-[-38px] top-1/2 -translate-y-1/2 flex items-center group/h-out z-50">
                <div className="w-7 h-7 rounded-lg bg-[#111113] border border-white/10 flex items-center justify-center text-emerald-500/40 group-hover/h-out:text-emerald-500 group-hover/h-out:border-emerald-500/30 group-hover/h-out:bg-emerald-500/10 transition-all shadow-2xl mr-1.5">
                    <Type className="w-3.5 h-3.5 pointer-events-none" />
                </div>
                <div className="w-3.5 h-3.5 bg-emerald-500 border-2 border-[#1a1a1d] shadow-[0_0_10px_rgba(16,185,129,0.3)] rounded-full relative group-hover/h-out:scale-110 transition-all flex items-center justify-center">
                    <Handle type="source" position={Position.Right} className="!w-full !h-full !bg-transparent !border-none cursor-crosshair !m-0 !absolute !inset-0" />
                </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-black/20 border-b border-white/5 rounded-t-2xl">
                <div className="flex items-center gap-2.5">
                    <Type className="w-3.5 h-3.5 text-emerald-500/70" />
                    <h4 className="text-[10px] font-bold text-white/90 uppercase tracking-widest">Input Texto</h4>
                </div>
                <button onClick={() => { ctx?.takeSnapshot(); ctx?.onRemoveNode(id); }} className="opacity-0 group-hover/textnode:opacity-100 transition-opacity p-1 text-white/20 hover:text-red-500">
                    <X className="w-3 h-3" />
                </button>
            </div>

            <NodeResizeControl
                minWidth={220}
                minHeight={150}
                onResizeStart={() => ctx?.takeSnapshot()}
                className="!bg-transparent !border-none !w-6 !h-6 !bottom-0 !right-0 !flex !items-end !justify-end cursor-nwse-resize z-10"
            >
                <div className="opacity-20 group-hover/textnode:opacity-50 transition-opacity pointer-events-none mb-1 mr-1">
                    <ChevronRight className="w-4 h-4 rotate-45" />
                </div>
            </NodeResizeControl>

            <div className="grow p-3 flex flex-col relative overflow-hidden">
                <textarea
                    value={text}
                    onChange={(e) => handleChange(e.target.value)}
                    placeholder="Insira o conteúdo..."
                    className="w-full grow bg-transparent text-xs text-white/70 outline-none resize-none no-scrollbar leading-relaxed"
                />
            </div>
        </div>
    )
}

// --- CUSTOM NODE: TOOL ---
const ToolNode = ({ id, data }: NodeProps) => {
    const category = data.category as ModelCategory
    const workflows = (data.workflows as ComfyWorkflow[]) || []
    const { setNodes } = useReactFlow()
    const ctx = useContext(CanvasContext)

    const [selectedWfId, setSelectedWfId] = useState<string>(data.selectedWorkflowId || (workflows.length > 0 ? workflows[0].id : ""))
    const currentWf = workflows.find(w => w.id === selectedWfId)

    // Status de Execução
    const status = data.status || "idle" // idle, running, success, error
    const resultUrl = data.resultUrl

    const handleWfChange = (newId: string) => {
        setSelectedWfId(newId)
        setNodes((nds) => nds.map((node) => node.id === id ? { ...node, data: { ...node.data, selectedWorkflowId: newId } } : node))
    }

    return (
        <div className={cn(nodeContainerStyle, "h-full flex flex-col",
            status === "running" && "border-primary shadow-[0_0_30px_rgba(139,92,246,0.1)]",
            status === "success" && "border-emerald-500/50",
            status === "error" && "border-red-500/50"
        )}>
            {/* IO Handles: DYNAMIC TARGETS */}
            <div className="absolute left-[-18px] top-4 bottom-4 flex flex-col justify-around py-4 z-50">
                {currentWf?.mapping?.positivePromptNodeId && (
                    <div className="relative group/handle flex items-center nodrag mb-4" title="Positive Prompt (Text)">
                        <div className="w-7 h-7 rounded-lg bg-[#1a1a1d] border border-white/20 flex items-center justify-center text-white/40 group-hover/handle:text-primary group-hover/handle:border-primary/50 group-hover/handle:bg-primary/10 transition-all pointer-events-none shadow-2xl relative">
                            <Type className="w-3.5 h-3.5" />
                        </div>
                        <Handle
                            type="target"
                            id="positive_prompt"
                            position={Position.Left}
                            className="!w-3 !h-3 !bg-primary !border-2 !border-[#1a1a1d] !absolute !left-[-6px] !top-1/2 !-translate-y-1/2 !m-0 !cursor-crosshair !rounded-full !shadow-[0_0_10px_rgba(139,92,246,0.6)] !z-[60] !flex !items-center !justify-center"
                        >
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-transparent cursor-crosshair" />
                        </Handle>
                        {/* Tooltip */}
                        <div className="absolute left-10 opacity-0 group-hover/handle:opacity-100 transition-opacity bg-black border border-white/10 px-3 py-2 rounded-xl text-[8px] font-bold text-white/70 whitespace-nowrap pointer-events-none z-[100] shadow-2xl">Texto: Positive Prompt</div>
                    </div>
                )}
                {currentWf?.mapping?.negativePromptNodeId && (
                    <div className="relative group/handle flex items-center nodrag mb-4" title="Negative Prompt (Text)">
                        <div className="w-7 h-7 rounded-lg bg-[#1a1a1d] border border-white/20 flex items-center justify-center text-white/40 group-hover/handle:text-red-500 group-hover/handle:border-red-500/50 group-hover/handle:bg-red-500/10 transition-all pointer-events-none shadow-2xl relative">
                            <Type className="w-3.5 h-3.5" />
                        </div>
                        <Handle
                            type="target"
                            id="negative_prompt"
                            position={Position.Left}
                            className="!w-3 !h-3 !bg-red-500 !border-2 !border-[#1a1a1d] !absolute !left-[-6px] !top-1/2 !-translate-y-1/2 !m-0 !cursor-crosshair !rounded-full !shadow-[0_0_10px_rgba(239,68,68,0.6)] !z-[60] !flex !items-center !justify-center"
                        >
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-transparent cursor-crosshair" />
                        </Handle>
                        {/* Tooltip */}
                        <div className="absolute left-10 opacity-0 group-hover/handle:opacity-100 transition-opacity bg-black border border-white/10 px-3 py-2 rounded-xl text-[8px] font-bold text-white/70 whitespace-nowrap pointer-events-none z-[100] shadow-2xl">Texto: Negative Prompt</div>
                    </div>
                )}
                {currentWf?.mapping?.imageInputs?.map((input: any, idx: number) => (
                    <div key={idx} className="relative group/handle flex items-center nodrag mb-4" title={`${input.label} (Image)`}>
                        <div className="w-7 h-7 rounded-lg bg-[#1a1a1d] border border-white/20 flex items-center justify-center text-white/40 group-hover/handle:text-amber-500 group-hover/handle:border-amber-500/50 group-hover/handle:bg-amber-500/10 transition-all pointer-events-none shadow-2xl relative">
                            <ImageIcon className="w-3.5 h-3.5" />
                        </div>
                        <Handle
                            type="target"
                            id={`img_${input.nodeId}`}
                            position={Position.Left}
                            className="!w-3 !h-3 !bg-amber-500 !border-2 !border-[#1a1a1d] !absolute !left-[-6px] !top-1/2 !-translate-y-1/2 !m-0 !cursor-crosshair !rounded-full !shadow-[0_0_10px_rgba(245,158,11,0.6)] !z-[60] !flex !items-center !justify-center"
                        >
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-transparent cursor-crosshair" />
                        </Handle>
                        {/* Tooltip */}
                        <div className="absolute left-10 opacity-0 group-hover/handle:opacity-100 transition-opacity bg-black border border-white/10 px-3 py-2 rounded-xl text-[8px] font-bold text-white/70 whitespace-nowrap pointer-events-none z-[100] shadow-2xl">Imagem: {input.label}</div>
                    </div>
                ))}
            </div>

            <div className="absolute right-[-18px] top-1/2 -translate-y-1/2 group/handle flex items-center nodrag z-50" title="Saída de Imagem">
                <div className="w-7 h-7 rounded-lg bg-[#1a1a1d] border border-white/20 flex items-center justify-center text-white/40 group-hover/handle:text-primary group-hover/handle:border-primary/50 group-hover/handle:bg-primary/10 transition-all pointer-events-none shadow-2xl relative">
                    <ImageIcon className="w-3.5 h-3.5" />
                </div>
                <Handle
                    type="source"
                    position={Position.Right}
                    className="!w-3 !h-3 !bg-primary !border-2 !border-[#1a1a1d] !absolute !right-[-6px] !top-1/2 !-translate-y-1/2 !m-0 !cursor-crosshair !rounded-full !shadow-[0_0_10px_rgba(139,92,246,0.6)] !z-[60] !flex !items-center !justify-center"
                >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-transparent cursor-crosshair" />
                </Handle>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-2.5">
                    {status === "running" ? (
                        <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                    ) : (
                        <Box className="w-3.5 h-3.5 text-primary/70" />
                    )}
                    <h4 className="text-[10px] font-bold text-white/90 uppercase tracking-widest">{category?.name || "Tool"}</h4>
                </div>
                <div className="flex items-center gap-1.5">
                    {status !== "running" && (
                        <button onClick={(e) => ctx?.onPlayNode(id, e)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-white/20 hover:text-emerald-500 bg-white/5 rounded flex bg-black/50" title="Play apenas este nó">
                            <Play className="w-3 h-3" />
                        </button>
                    )}
                    <button onClick={() => { ctx?.takeSnapshot(); ctx?.onRemoveNode(id); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-white/20 hover:text-red-500 rounded bg-white/5 bg-black/50">
                        <X className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Result Preview if success */}
            {
                status === "success" && resultUrl && (
                    <div className="mb-4 relative group/img overflow-hidden rounded-md border border-white/5 aspect-square bg-black/40">
                        <img src={resultUrl} alt="Result" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 text-white transition-all"><Download className="w-3.5 h-3.5" /></button>
                            <a href={resultUrl} target="_blank" className="p-2 bg-white/10 rounded-lg hover:bg-white/20 text-white transition-all"><ExternalLink className="w-3.5 h-3.5" /></a>
                        </div>
                    </div>
                )
            }

            {/* Error Message */}
            {
                status === "error" && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md flex items-start gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-[8px] font-bold text-red-500/80 uppercase">Erro na Geração</p>
                    </div>
                )
            }

            {/* Selector - Refined UI */}
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2 group/select hover:bg-white/[0.05] transition-all">
                <label className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em] mb-1 block">Mecanismo Ativo</label>
                <div className="relative">
                    <select
                        value={selectedWfId}
                        onChange={(e) => handleWfChange(e.target.value)}
                        className="w-full bg-transparent text-[10px] font-bold text-white/70 outline-none cursor-pointer appearance-none pr-6"
                        disabled={status === "running"}
                    >
                        {workflows.map(wf => <option key={wf.id} value={wf.id} className="bg-[#1a1a1d]">{wf.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20 pointer-events-none group-hover/select:text-primary transition-colors" />
                </div>
            </div>

            <div className="flex items-center justify-between mt-auto shrink-0 pt-3 border-t border-white/5">
                <div className="text-[6px] font-bold text-white/10 uppercase tracking-widest font-mono">ID: {id.split('_')[1]?.slice(-4) || "0000"}</div>
                {status === "running" && (
                    <span className="text-[6px] font-bold text-primary uppercase tracking-widest animate-pulse">Processando...</span>
                )}
            </div>

            <NodeResizeControl
                minWidth={200}
                minHeight={100}
                onResizeStart={() => ctx?.takeSnapshot()}
                className="!bg-transparent !border-none !w-6 !h-6 !bottom-0 !right-0 !flex !items-end !justify-end cursor-nwse-resize"
            >
                <div className="opacity-20 group-hover:opacity-50 transition-opacity pointer-events-none mb-1 mr-1">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <line x1="1" y1="7" x2="7" y2="1" stroke="white" strokeWidth="1" strokeLinecap="round" />
                        <line x1="4" y1="7" x2="7" y2="4" stroke="white" strokeWidth="1" strokeLinecap="round" />
                        <line x1="6" y1="7" x2="7" y2="6" stroke="white" strokeWidth="1" strokeLinecap="round" />
                    </svg>
                </div>
            </NodeResizeControl>
        </div >
    )
}

// --- CUSTOM NODE: IMAGE PREVIEW ---
const PreviewNode = ({ id, data }: NodeProps) => {
    const imageUrl = data.imageUrl as string
    const ctx = useContext(CanvasContext)

    return (
        <div className={cn(nodeContainerStyle, "min-w-[240px] border-emerald-500/20 shadow-emerald-500/5")}>
            <div className="absolute left-[-18px] top-1/2 -translate-y-1/2 group/handle flex items-center nodrag z-50" title="Entrada de Imagem / Vídeo">
                <div className="w-7 h-7 rounded-lg bg-[#1a1a1d] border border-white/20 flex items-center justify-center text-white/40 group-hover/handle:text-emerald-500 group-hover/handle:border-emerald-500/50 group-hover/handle:bg-emerald-500/10 transition-all pointer-events-none shadow-2xl relative">
                    <ImageIcon className="w-3.5 h-3.5" />
                </div>
                <Handle
                    type="target"
                    position={Position.Left}
                    className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-[#1a1a1d] !absolute !left-[-6px] !top-1/2 !-translate-y-1/2 !m-0 !cursor-crosshair !rounded-full !shadow-[0_0_10px_rgba(16,185,129,0.6)] !z-[60] !flex !items-center !justify-center"
                >
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-transparent cursor-crosshair" />
                </Handle>
            </div>

            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <Image className="w-3.5 h-3.5 text-emerald-500" />
                    <h4 className="text-[10px] font-bold text-white/90 uppercase tracking-widest">Image Preview</h4>
                </div>
                <button onClick={() => { ctx?.takeSnapshot(); ctx?.onRemoveNode(id); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-white/20 hover:text-red-500">
                    <X className="w-3 h-3" />
                </button>
            </div>

            <div className="aspect-square w-full rounded-lg overflow-hidden bg-black/40 border border-white/5 flex items-center justify-center relative group/preview transition-all hover:border-emerald-500/30 font-mono">
                {imageUrl ? (
                    <>
                        {imageUrl.toLowerCase().includes('.mp4') ? (
                            <video src={imageUrl} autoPlay loop muted playsInline className="w-full h-full object-contain" />
                        ) : (
                            <img src={imageUrl} alt="Final Result" className="w-full h-full object-contain" />
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 text-white transition-all"><Download className="w-4 h-4" /></button>
                            <a href={imageUrl} target="_blank" className="p-2 bg-white/10 rounded-lg hover:bg-white/20 text-white transition-all"><ExternalLink className="w-4 h-4" /></a>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-2 opacity-20">
                        <Image className="w-8 h-8" />
                        <span className="text-[8px] uppercase font-black tracking-widest">Aguardando...</span>
                    </div>
                )}
            </div>
        </div>
    )
}

// --- CUSTOM EDGE: INSERT NODE ---
const InsertEdgeNode = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd, selected }: any) => {
    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX, sourceY, sourcePosition,
        targetX, targetY, targetPosition,
        borderRadius: 20
    })
    const ctx = useContext(CanvasContext)

    return (
        <g className="group/edge">
            <BaseEdge
                id={id}
                path={edgePath}
                style={{
                    ...style,
                    strokeWidth: selected ? 3 : 2,
                    stroke: selected ? '#8b5cf6' : style?.stroke || '#8b5cf6',
                    filter: selected ? 'drop-shadow(0 0 8px rgba(139,92,246,0.5))' : 'none',
                    transition: 'all 0.2s ease'
                }}
                markerEnd={markerEnd}
            />
            <EdgeLabelRenderer>
                <div
                    style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`, pointerEvents: 'all' }}
                    className="opacity-0 group-hover/edge:opacity-100 w-6 h-6 flex items-center justify-center bg-[#1a1a1d] hover:bg-primary transition-all border border-white/10 hover:border-white/50 rounded-full cursor-pointer z-50 text-white/50 hover:text-white shadow-2xl scale-75 group-hover/edge:scale-100"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (ctx?.onEdgeClick) ctx.onEdgeClick(e, id);
                    }}
                >
                    <Plus className="w-3.5 h-3.5" />
                </div>
            </EdgeLabelRenderer>
        </g>
    )
}

// --- CUSTOM NODE: ASSISTANT IA ---
const AssistantNode = ({ id, data }: NodeProps) => {
    const { setNodes } = useReactFlow()
    const ctx = useContext(CanvasContext)
    const agents = data.agents || []
    const status = data.status || "idle"
    const response = data.response || ""
    const selectedAgentId = data.selectedAgentId || ""
    const selectedModelId = data.selectedModelId || "gemini-1.5-flash"
    const [promptText, setPromptText] = useState(data.promptText as string || "")

    const GEMINI_MODELS = [
        { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash (Padrão)" },
        { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro (Avançado)" },
        { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash (Rápido)" },
        { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash-Lite (Mini)" }
    ]

    const handleAgentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value
        setNodes((nds) => nds.map((node) => node.id === id ? { ...node, data: { ...node.data, selectedAgentId: val } } : node))
    }

    const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value
        setNodes((nds) => nds.map((node) => node.id === id ? { ...node, data: { ...node.data, selectedModelId: val } } : node))
    }

    const handlePromptChange = (val: string) => {
        setPromptText(val)
        setNodes((nds) => nds.map((node) => node.id === id ? { ...node, data: { ...node.data, promptText: val } } : node))
    }

    return (
        <div className={cn(nodeContainerStyle, "min-w-[260px] h-full flex flex-col group/assistant transition-all shadow-xl",
            status === "running" && "border-primary shadow-[0_0_30px_rgba(139,92,246,0.1)]",
            status === "success" && "border-emerald-500/50",
            status === "error" && "border-red-500/50"
        )}>
            {/* Handle Target (Input) */}
            <div className="absolute left-[-38px] top-1/2 -translate-y-1/2 flex items-center group/h-in z-50">
                <div className="w-3.5 h-3.5 bg-primary border-2 border-[#1a1a1d] shadow-[0_0_10px_rgba(139,92,246,0.3)] rounded-full relative group-hover/h-in:scale-110 transition-all flex items-center justify-center">
                    <Handle type="target" id="prompt" position={Position.Left} className="!w-full !h-full !bg-transparent !border-none cursor-crosshair !m-0 !absolute !inset-0" />
                </div>
                <div className="w-7 h-7 rounded-lg bg-[#111113] border border-white/10 flex items-center justify-center text-primary/40 group-hover/h-in:text-primary group-hover/h-in:border-primary/30 group-hover/h-in:bg-primary/10 transition-all shadow-2xl ml-1.5">
                    <Type className="w-3.5 h-3.5 pointer-events-none" />
                </div>
            </div>

            {/* Handle Source (Output) */}
            <div className="absolute right-[-38px] top-1/2 -translate-y-1/2 flex items-center group/h-out z-50">
                <div className="w-7 h-7 rounded-lg bg-[#111113] border border-white/10 flex items-center justify-center text-primary/40 group-hover/h-out:text-primary group-hover/h-out:border-primary/30 group-hover/h-out:bg-primary/10 transition-all shadow-2xl mr-1.5">
                    <Type className="w-3.5 h-3.5 pointer-events-none" />
                </div>
                <div className="w-3.5 h-3.5 bg-primary border-2 border-[#1a1a1d] shadow-[0_0_10px_rgba(139,92,246,0.3)] rounded-full relative group-hover/h-out:scale-110 transition-all flex items-center justify-center">
                    <Handle type="source" position={Position.Right} className="!w-full !h-full !bg-transparent !border-none cursor-crosshair !m-0 !absolute !inset-0" />
                </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-black/20 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <h4 className="text-[10px] font-bold text-white/90 uppercase tracking-widest">IA Assistant</h4>
                </div>
                <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-lg border border-white/5">
                    <button onClick={() => { ctx?.takeSnapshot(); ctx?.onRemoveNode(id); }} className="p-1 text-white/20 hover:text-red-500 transition-colors" title="Remover">
                        <X className="w-3 h-3" />
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-4 grow overflow-hidden p-4 pt-5">
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5 min-w-0">
                        <label className={labelStyle}>Personagem</label>
                        <div className="relative group/select">
                            <select value={selectedAgentId} onChange={handleAgentChange} className={cn(inputStyle, "pr-8 truncate bg-[#1a1a1d] hover:bg-black/60 cursor-pointer")} disabled={status === "running"}>
                                <option value="" className="bg-[#1a1a1d]">Selecione...</option>
                                {agents.map((a: any) => <option key={a.id} value={a.id} className="bg-[#1a1a1d]">{a.name}</option>)}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 pointer-events-none group-hover/select:text-primary transition-colors" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5 min-w-0">
                        <label className={labelStyle}>Cérebro (Modelo)</label>
                        <div className="relative group/select">
                            <select value={selectedModelId} onChange={handleModelChange} className={cn(inputStyle, "pr-8 truncate bg-[#1a1a1d] hover:bg-black/60 cursor-pointer")} disabled={status === "running"}>
                                {GEMINI_MODELS.map((m) => <option key={m.id} value={m.id} className="bg-[#1a1a1d]">{m.name}</option>)}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 pointer-events-none group-hover/select:text-primary transition-colors" />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-1.5 relative grow overflow-hidden">
                    <label className={labelStyle}>Instruções do Prompt</label>
                    <div className="relative grow flex flex-col min-h-0 bg-black/40 border border-white/5 rounded-xl overflow-hidden focus-within:border-primary/50 transition-all">
                        <textarea
                            value={promptText}
                            onChange={(e) => handlePromptChange(e.target.value)}
                            placeholder="Digite instruções adicionais aqui..."
                            className="w-full grow bg-transparent p-3 text-[10px] text-white/70 outline-none resize-none no-scrollbar leading-relaxed"
                            disabled={status === "running"}
                        />
                        <div className="p-2 flex items-center justify-end bg-gradient-to-t from-black/20 to-transparent">
                            {status === "running" ? (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5 text-[9px] font-bold text-white/40 uppercase tracking-widest">
                                    <Loader2 className="w-3 h-3 animate-spin text-primary" />
                                    <span>Gerando...</span>
                                </div>
                            ) : (
                                <button
                                    onClick={(e) => ctx?.onPlayNode(id, e)}
                                    className="flex items-center gap-2 px-4 py-1.5 bg-primary/20 hover:bg-primary text-primary hover:text-white rounded-lg transition-all text-[9px] font-bold uppercase tracking-widest group"
                                >
                                    <Send className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                    <span>Executar</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {response && (
                    <div className="mt-2 shrink-0 max-h-[100px] flex flex-col overflow-hidden">
                        <label className={labelStyle}>Resposta Recente</label>
                        <div className="p-3 bg-white/5 border border-white/5 rounded-lg text-[9px] text-white/50 leading-relaxed overflow-y-auto no-scrollbar italic whitespace-pre-wrap">
                            {response}
                        </div>
                    </div>
                )}
            </div>

            <NodeResizeControl
                minWidth={260}
                minHeight={150}
                onResizeStart={() => ctx?.takeSnapshot()}
                className="!bg-transparent !border-none !w-6 !h-6 !bottom-0 !right-0 !flex !items-end !justify-end cursor-nwse-resize"
            >
                <div className="opacity-20 group-hover/assistant:opacity-50 transition-opacity pointer-events-none mb-1 mr-1">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <line x1="1" y1="7" x2="7" y2="1" stroke="white" strokeWidth="1" strokeLinecap="round" />
                        <line x1="4" y1="7" x2="7" y2="4" stroke="white" strokeWidth="1" strokeLinecap="round" />
                        <line x1="6" y1="7" x2="7" y2="6" stroke="white" strokeWidth="1" strokeLinecap="round" />
                    </svg>
                </div>
            </NodeResizeControl>

            <div className="absolute right-[-18px] top-1/2 -translate-y-1/2 group/handle flex items-center nodrag z-50" title="Resposta (Texto)">
                <div className="w-7 h-7 rounded-lg bg-[#1a1a1d] border border-white/20 flex items-center justify-center text-white/40 group-hover/handle:text-emerald-500 group-hover/handle:border-emerald-500/50 group-hover/handle:bg-emerald-500/10 transition-all pointer-events-none shadow-2xl relative">
                    <Type className="w-3.5 h-3.5" />
                </div>
                <Handle
                    type="source"
                    id="response"
                    position={Position.Right}
                    className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-[#1a1a1d] !absolute !right-[-6px] !top-1/2 !-translate-y-1/2 !m-0 !cursor-crosshair !rounded-full !shadow-[0_0_10px_rgba(16,185,129,0.6)] !z-[60] !flex !items-center !justify-center"
                >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-transparent cursor-crosshair" />
                </Handle>
            </div>
        </div>
    )
}

const nodeTypes = {
    tool: ToolNode,
    text_input: TextNode,
    preview: PreviewNode,
    assistant: AssistantNode
} as any

const edgeTypes = {
    insertNode: InsertEdgeNode
} as any

// --- TOOL PALETTE ---
const ToolPalette = ({ categories, workflows, onSelectTool, onSelectInput, onClose, position }: any) => {
    const [search, setSearch] = useState("");

    const onDragStart = (event: React.DragEvent, type: string, payload: string) => {
        event.dataTransfer.setData('application/reactflow', `${type}|${payload}`);
        event.dataTransfer.effectAllowed = 'move';
    };

    const filteredCats = categories.filter((c: any) =>
        (c.name.toLowerCase().includes(search.toLowerCase()) ||
            workflows.some((w: any) => (w.categoryId === c.id || w.type === c.id) && w.name.toLowerCase().includes(search.toLowerCase()))) &&
        workflows.some((w: any) => w.categoryId === c.id || w.type === c.id)
    );

    return (
        <div
            className={cn(
                "fixed z-[200] w-[260px] bg-[#1a1a1d] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] py-4 flex flex-col animate-in slide-in-from-left-4 fade-in duration-200",
                position.y ? "max-h-[80vh]" : ""
            )}
            style={{
                left: position.x || 0,
                top: position.y || 0,
                bottom: position.y ? 'auto' : 0,
                height: position.y ? 'auto' : '100%',
                borderRadius: position.y ? '0.75rem' : '0'
            }}
        >
            <div className="px-5 mb-4 border-b border-white/5 pb-4 flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-bold text-white/40 uppercase tracking-[0.4em]">Node Library</span>
                    <span className="text-[10px] font-medium text-white/60">Arraste para o fluxo</span>
                </div>
                {onClose && <button onClick={onClose} className="text-white/20 hover:text-white transition-colors bg-white/5 p-1.5 rounded-md"><X className="w-3 h-3" /></button>}
            </div>

            <div className="px-4 mb-4">
                <div className="relative">
                    <Search className="w-3.5 h-3.5 text-white/30 absolute left-3 top-2.5" />
                    <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar nodes..."
                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-primary/50 transition-colors"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                <div className="px-5 mb-2 mt-2 text-[7px] font-bold text-white/20 uppercase tracking-[0.3em]">AI Generation</div>
                <div className="space-y-0.5 px-2">
                    {filteredCats.map((cat: any) => (
                        <div
                            key={cat.id}
                            draggable={true}
                            onDragStart={(e) => onDragStart(e, 'tool', cat.id)}
                            onClick={() => { onSelectTool(cat); if (onClose) onClose(); }}
                            className="select-none w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-lg transition-all group flex items-center justify-between cursor-grab active:cursor-grabbing border border-transparent hover:border-white/5"
                        >
                            <div className="flex items-center gap-3 pointer-events-none">
                                <Box className="w-3.5 h-3.5 text-primary/50 group-hover:text-primary transition-colors" />
                                <span className="text-[11px] font-medium text-white/60 group-hover:text-white transition-colors tracking-tight">{cat.name}</span>
                            </div>
                        </div>
                    ))}
                    {filteredCats.length === 0 && <div className="px-3 py-4 text-center text-xs text-white/30">Nenhum encontrado</div>}
                </div>

                <div className="px-5 mb-2 mt-6 text-[7px] font-bold text-white/20 uppercase tracking-[0.3em]">Inputs & Outputs</div>
                <div className="space-y-0.5 mb-2 px-2">
                    <div
                        draggable={true}
                        onDragStart={(e) => onDragStart(e, 'input', 'text_input')}
                        onClick={() => { onSelectInput("text_input"); if (onClose) onClose(); }}
                        className="select-none w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-lg transition-all group flex items-center justify-between cursor-grab active:cursor-grabbing border border-transparent hover:border-white/5"
                    >
                        <div className="flex items-center gap-3 pointer-events-none">
                            <Type className="w-3.5 h-3.5 text-emerald-500/50 group-hover:text-emerald-500 transition-colors" />
                            <span className="text-[11px] font-medium text-white/60 group-hover:text-white transition-colors tracking-tight">Image Prompt</span>
                        </div>
                    </div>
                    <div
                        draggable={true}
                        onDragStart={(e) => onDragStart(e, 'input', 'preview')}
                        onClick={() => { onSelectInput("preview"); if (onClose) onClose(); }}
                        className="select-none w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-lg transition-all group flex items-center justify-between cursor-grab active:cursor-grabbing border border-transparent hover:border-white/5"
                    >
                        <div className="flex items-center gap-3 pointer-events-none">
                            <Image className="w-3.5 h-3.5 text-blue-500/50 group-hover:text-blue-500 transition-colors" />
                            <span className="text-[11px] font-medium text-white/60 group-hover:text-white transition-colors tracking-tight">Preview Output</span>
                        </div>
                    </div>
                    <div
                        draggable={true}
                        onDragStart={(e) => onDragStart(e, 'input', 'assistant')}
                        onClick={() => { onSelectInput("assistant"); if (onClose) onClose(); }}
                        className="select-none w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-lg transition-all group flex items-center justify-between cursor-grab active:cursor-grabbing border border-transparent hover:border-white/5"
                    >
                        <div className="flex items-center gap-3 pointer-events-none">
                            <Sparkles className="w-3.5 h-3.5 text-primary/50 group-hover:text-primary transition-colors" />
                            <span className="text-[11px] font-medium text-white/60 group-hover:text-white transition-colors tracking-tight">IA Assistant</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// --- MAIN CANVAS ---
export function AIGeneratorCanvas({ influencerId }: { influencerId: string | null }) {
    const { profile } = useAuth()
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
    const [categories, setCategories] = useState<ModelCategory[]>([])
    const [workflows, setWorkflows] = useState<ComfyWorkflow[]>([])
    const [agents, setAgents] = useState<any[]>([])
    const [palette, setPalette] = useState({ isOpen: false, x: 0, y: 0, targetEdge: undefined as string | undefined })
    const [isLibraryOpen, setIsLibraryOpen] = useState(true)
    const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null)
    const [isExecuting, setIsExecuting] = useState(false)

    // History (Undo/Redo)
    const historyRef = useRef<{ past: { nodes: Node[], edges: Edge[] }[], future: { nodes: Node[], edges: Edge[] }[] }>({ past: [], future: [] });

    const takeSnapshot = useCallback(() => {
        if (!rfInstance) return;
        historyRef.current.past.push({ nodes: rfInstance.getNodes(), edges: rfInstance.getEdges() });
        historyRef.current.future = [];
        if (historyRef.current.past.length > 30) historyRef.current.past.shift();
    }, [rfInstance]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (e.shiftKey) { // Redo
                    if (historyRef.current.future.length > 0) {
                        const next = historyRef.current.future.shift();
                        if (!rfInstance || !next) return;
                        historyRef.current.past.push({ nodes: rfInstance.getNodes(), edges: rfInstance.getEdges() });
                        setNodes(next.nodes); setEdges(next.edges);
                    }
                } else { // Undo
                    if (historyRef.current.past.length > 0) {
                        const prev = historyRef.current.past.pop();
                        if (!rfInstance || !prev) return;
                        historyRef.current.future.unshift({ nodes: rfInstance.getNodes(), edges: rfInstance.getEdges() });
                        setNodes(prev.nodes); setEdges(prev.edges);
                    }
                }
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                e.preventDefault(); // Redo Ctrl+Y
                if (historyRef.current.future.length > 0) {
                    const next = historyRef.current.future.shift();
                    if (!rfInstance || !next) return;
                    historyRef.current.past.push({ nodes: rfInstance.getNodes(), edges: rfInstance.getEdges() });
                    setNodes(next.nodes); setEdges(next.edges);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [rfInstance, setNodes, setEdges]);

    // Navbar states
    const [savedCanvas, setSavedCanvas] = useState<CanvasWorkflowData[]>([]);
    const [currentCanvasId, setCurrentCanvasId] = useState<string | null>(null);
    const [canvasName, setCanvasName] = useState("Meu Workflow");
    const [isSaving, setIsSaving] = useState(false);
    const [isGlobalModalOpen, setIsGlobalModalOpen] = useState(false);

    const onReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
        takeSnapshot();
        setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
    }, [setEdges, takeSnapshot]);

    const handleSaveAsGlobal = async (templateData: any) => {
        setIsSaving(true);
        try {
            await saveWorkflowTemplate({
                name: templateData.name,
                description: templateData.description,
                categoryId: templateData.categoryId,
                type: templateData.categoryId, // Fallback
                coverImageUrl: templateData.coverImageUrl,
                isPublished: true,
                // Aqui salvamos os dados do canvas como "rawJson" ou um campo específico
                // Para manter compatibilidade, vamos colocar um placeholder no rawJson
                // e os dados reais no nodes/edges se quisermos rodar o canvas depois.
                // Mas o AdminModels espera um JSON decifrável. 
                // Por enquanto salvamos como um Template do tipo "canvas"
                rawJson: JSON.stringify({ nodes, edges }),
                provider: "canvas"
            });
            alert("Workflow publicado como Modelo Global!");
            setIsGlobalModalOpen(false);
        } catch (err) {
            console.error(err);
            alert("Erro ao publicar como modelo");
        } finally {
            setIsSaving(false);
        }
    }
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isRestored, setIsRestored] = useState(false);

    // --- PERSISTÊNCIA NA SESSÃO ---
    useEffect(() => {
        const stored = localStorage.getItem('sintetix_last_canvas');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed?.nodes?.length > 0) {
                    setNodes(parsed.nodes);
                    setEdges(parsed.edges || []);
                    setCurrentCanvasId(parsed.currentCanvasId || null);
                    setCanvasName(parsed.canvasName || "Meu Workflow");
                }
            } catch (e) {
                console.error("Erro ao restaurar canvas:", e);
            }
        }
        setIsRestored(true);
    }, []);

    useEffect(() => {
        if (isRestored && nodes.length > 0) {
            const timer = setTimeout(() => {
                localStorage.setItem('sintetix_last_canvas', JSON.stringify({ nodes, edges, currentCanvasId, canvasName }));
            }, 1000);
            return () => clearTimeout(timer);
        } else if (isRestored && nodes.length === 0) {
            localStorage.removeItem('sintetix_last_canvas');
        }
    }, [nodes, edges, currentCanvasId, canvasName, isRestored]);

    useEffect(() => {
        async function loadData() {
            try {
                const cats = await listModelCategories()
                const cloudWorkflows = await listWorkflowTemplates(profile?.role !== "admin")
                const canvasWfs = await listCanvasWorkflows()
                const dbAgents = await listAgents()
                setCategories(cats)
                setWorkflows(cloudWorkflows)
                setSavedCanvas(canvasWfs)
                setAgents(dbAgents)

                // Sincronizar agentes com os nodes já existentes
                setNodes(nds => nds.map(n => n.type === "assistant" ? { ...n, data: { ...n.data, agents: dbAgents } } : n))
            } catch (err) {
                console.error("Erro ao carregar dados do Canvas:", err)
            }
        }
        loadData()
    }, [profile])

    const handleSaveCanvas = async () => {
        setIsSaving(true);
        try {
            const id = await saveCanvasWorkflow({
                id: currentCanvasId || undefined,
                name: canvasName,
                nodes,
                edges
            });
            setCurrentCanvasId(id);
            setSavedCanvas(await listCanvasWorkflows());
            alert("Workflow salvo com sucesso!");
        } catch (err) {
            console.error(err);
            alert("Erro ao salvar o workflow");
        } finally {
            setIsSaving(false);
        }
    }

    const handleNewCanvas = () => {
        setNodes([]);
        setEdges([]);
        setCurrentCanvasId(null);
        setCanvasName("Novo Workflow");
        setIsDropdownOpen(false);
    }

    const handleLoadCanvas = (wf: CanvasWorkflowData) => {
        setNodes(wf.nodes || []);
        setEdges(wf.edges || []);
        setCurrentCanvasId(wf.id);
        setCanvasName(wf.name);
        setIsDropdownOpen(false);
    }

    const handleDeleteCanvas = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Excluir este workflow?")) return;
        try {
            await deleteCanvasWorkflow(id);
            setSavedCanvas(await listCanvasWorkflows());
            if (currentCanvasId === id) handleNewCanvas();
        } catch (err) {
            console.error(err);
        }
    }

    const handleExportJson = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ name: canvasName, nodes, edges }, null, 2));
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", `${canvasName.replace(/\s+/g, '_')}_workflow.json`);
        document.body.appendChild(dlAnchorElem);
        dlAnchorElem.click();
        document.body.removeChild(dlAnchorElem);
    }

    const onConnect = useCallback((params: Connection) => {
        takeSnapshot();
        setEdges((eds) => addEdge({ ...params, type: 'insertNode' }, eds));
    }, [setEdges, takeSnapshot])

    const onPaneClick = useCallback((event: React.MouseEvent) => {
        if (event.detail === 2) setPalette({ isOpen: true, x: event.clientX, y: event.clientY, targetEdge: undefined })
        else setPalette(p => p.isOpen ? { ...p, isOpen: false, targetEdge: undefined } : p)
    }, [])

    const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
        event.preventDefault()
        setPalette({ isOpen: true, x: event.clientX, y: event.clientY, targetEdge: undefined })
    }, [])

    const removeNode = useCallback((id: string) => {
        setNodes((nds) => nds.filter((node) => node.id !== id))
        setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id))
    }, [setNodes, setEdges])

    const onNodesDelete = useCallback(() => takeSnapshot(), [takeSnapshot]);
    const onEdgesDelete = useCallback(() => takeSnapshot(), [takeSnapshot]);

    const addToolNode = useCallback((cat: ModelCategory, positionOverwrite?: { x: number, y: number }) => {
        if (!rfInstance) return
        takeSnapshot()
        const id = `node_${Date.now()}`
        const position = positionOverwrite || rfInstance.screenToFlowPosition({ x: palette.x, y: palette.y })
        const categoryWorkflows = workflows.filter(w => w.categoryId === cat.id || w.type === cat.id)

        setNodes((nds) => [...nds, {
            id, type: "tool", position,
            data: { id, category: cat, workflows: categoryWorkflows, selectedWorkflowId: categoryWorkflows[0]?.id || "", onRemove: removeNode, status: "idle", takeSnapshot }
        }])

        if (palette.targetEdge) {
            setEdges((eds) => {
                const edge = eds.find(e => e.id === palette.targetEdge);
                if (edge) {
                    const newEdges = eds.filter(e => e.id !== palette.targetEdge);
                    return [
                        ...newEdges,
                        { id: `e_${edge.source}-${id}`, source: edge.source, sourceHandle: edge.sourceHandle, target: id, type: 'insertNode' },
                        { id: `e_${id}-${edge.target}`, source: id, target: edge.target, targetHandle: edge.targetHandle, type: 'insertNode' }
                    ]
                }
                return eds;
            })
        }
        setPalette(p => ({ ...p, isOpen: false, targetEdge: undefined }))
    }, [rfInstance, palette, workflows, removeNode, setNodes, setEdges, takeSnapshot])

    const addInputNode = useCallback((type: string, positionOverwrite?: { x: number, y: number }) => {
        if (!rfInstance) return
        takeSnapshot()
        const id = `${type}_${Date.now()}`
        const position = positionOverwrite || rfInstance.screenToFlowPosition({ x: palette.x, y: palette.y })
        setNodes((nds) => [...nds, {
            id, type, position,
            data: { id, text: "", onRemove: removeNode, takeSnapshot, agents: type === "assistant" ? agents : undefined }
        }])

        if (palette.targetEdge) {
            setEdges((eds) => {
                const edge = eds.find(e => e.id === palette.targetEdge);
                if (edge) {
                    const newEdges = eds.filter(e => e.id !== palette.targetEdge);
                    return [
                        ...newEdges,
                        { id: `e_${edge.source}-${id}`, source: edge.source, sourceHandle: edge.sourceHandle, target: id, type: 'insertNode' },
                        { id: `e_${id}-${edge.target}`, source: id, target: edge.target, targetHandle: edge.targetHandle, type: 'insertNode' }
                    ]
                }
                return eds;
            })
        }
        setPalette(p => ({ ...p, isOpen: false, targetEdge: undefined }))
    }, [rfInstance, palette, removeNode, setNodes, setEdges])

    /**
     * ENGINE: Dispara a geração processando o grafo
     */
    const handleExecute = async (targetNodeIdOrEvent?: string | React.MouseEvent, e?: React.MouseEvent) => {
        const targetNodeId = typeof targetNodeIdOrEvent === 'string' ? targetNodeIdOrEvent : undefined;
        if (isExecuting) return;
        setIsExecuting(true);

        // 1. Encontrar todos os nodes de ferramenta ou assistente
        const executableNodes = nodes.filter(n => (n.type === "tool" || n.type === "assistant") && (!targetNodeId || n.id === targetNodeId));

        if (executableNodes.length === 0) {
            setIsExecuting(false);
            return;
        }

        for (const node of executableNodes) {
            if (node.type === "tool") {
                const toolNode = node;
                const workflowId = toolNode.data.selectedWorkflowId;
                const workflowsList = toolNode.data.workflows as ComfyWorkflow[];
                const wfTemplate = workflowsList.find(w => w.id === workflowId);

                if (!wfTemplate) continue;

                const promptJson: ComfyWorkflowJson = JSON.parse(wfTemplate.rawJson);
                const mapping = wfTemplate.mapping;

                // 2. Coletar inputs conectados
                const incomingEdges = edges.filter(e => e.target === toolNode.id);

                incomingEdges.forEach(edge => {
                    const sourceNode = nodes.find(n => n.id === edge.source);
                    if (!sourceNode) return;

                    // Se for entrada de texto
                    if (sourceNode.type === "text_input") {
                        const textValue = sourceNode.data.text;
                        const targetHandle = edge.targetHandle;

                        if (targetHandle === "positive_prompt" && mapping.positivePromptNodeId) {
                            const targetNode = promptJson[mapping.positivePromptNodeId];
                            if (targetNode) targetNode.inputs.text = textValue; // Padrão ComfyUI
                        } else if (targetHandle === "negative_prompt" && mapping.negativePromptNodeId) {
                            const targetNode = promptJson[mapping.negativePromptNodeId];
                            if (targetNode) targetNode.inputs.text = textValue;
                        }
                    }
                    // Se vindo de resposta de Assistente IA
                    else if (sourceNode.type === "assistant" && sourceNode.data.status === "success" && sourceNode.data.response) {
                        const targetHandle = edge.targetHandle;
                        if (targetHandle === "positive_prompt" && mapping.positivePromptNodeId) {
                            const targetNode = promptJson[mapping.positivePromptNodeId];
                            if (targetNode) targetNode.inputs.text = sourceNode.data.response;
                        }
                    }
                    // Se for input vindo de uma geração anterior finalizada (URL de Imagem)
                    else if (sourceNode.type === "tool" && sourceNode.data.status === "success" && sourceNode.data.resultUrl) {
                        const targetHandle = edge.targetHandle;
                        if (targetHandle && targetHandle.startsWith("img_")) {
                            const targetNodeId = targetHandle.replace("img_", "");
                            const targetNode = promptJson[targetNodeId];
                            if (targetNode) {
                                targetNode.inputs.image = sourceNode.data.resultUrl;
                            }
                        }
                    }
                });

                // 3. Disparar no Engine (Server Action)
                try {
                    // Atualiza status do node para "running"
                    setNodes(nds => nds.map(n => n.id === toolNode.id ? { ...n, data: { ...n.data, status: "running" } } : n));

                    const runResp = await dispatchComfyRun(wfTemplate.engine, workflowId as string, promptJson);
                    // ... polling logic follows ...

                    // 4. Polling de status
                    let pollCount = 0;
                    const pollInterval = setInterval(async () => {
                        pollCount++;
                        if (pollCount > 30) { // Timeout 1min
                            clearInterval(pollInterval);
                            setNodes(nds => nds.map(n => n.id === toolNode.id ? { ...n, data: { ...n.data, status: "error" } } : n));
                            return;
                        }

                        const statusResp = await dispatchComfyStatus(wfTemplate.engine, workflowId as string, runResp.id);

                        if (statusResp.status === "COMPLETED") {
                            clearInterval(pollInterval);
                            console.log("CANVAS - SUCESSO (COMPLETED). Dados Retornados:", JSON.stringify(statusResp, null, 2));

                            // Pegar a imagem usando extrator universal
                            const outputs = statusResp.outputs;

                            const extractUrls = (obj: any): string[] => {
                                let urls: string[] = [];
                                if (!obj) return urls;
                                if (typeof obj === 'string') {
                                    if (obj.startsWith('http')) urls.push(obj);
                                    return urls;
                                }
                                if (Array.isArray(obj)) {
                                    for (const item of obj) urls = urls.concat(extractUrls(item));
                                } else if (typeof obj === 'object') {
                                    for (const key in obj) {
                                        if (key === 'url' && typeof obj[key] === 'string' && obj[key].startsWith('http')) {
                                            urls.push(obj[key]);
                                        } else if (typeof obj[key] === 'object') {
                                            urls = urls.concat(extractUrls(obj[key]));
                                        }
                                    }
                                }
                                return urls;
                            };

                            const rawUrls = extractUrls(outputs);
                            let imgUrls = rawUrls.filter(u => u.match(/\.(png|jpe?g|webp|gif|mp4)(\?.*)?$/i));

                            if (imgUrls.length === 0) {
                                const fallbackUrls = rawUrls.filter(u => !u.includes('thumbnail'));
                                if (fallbackUrls.length > 0) imgUrls = [fallbackUrls[0]];
                            }

                            let imgUrl = "";
                            let outputType: 'image' | 'video' | 'gif' = 'image';

                            if (imgUrls.length > 0) {
                                imgUrl = imgUrls[0];
                                const mainUrl = imgUrl.toLowerCase();
                                if (mainUrl.includes('.mp4')) outputType = 'video';
                                else if (mainUrl.includes('.gif')) outputType = 'gif';
                            } else {
                                console.error("Não achei imagens...", rawUrls, outputs);
                            }

                            if (imgUrl) {
                                // 5. SALVAMENTO AUTOMÁTICO (Firebase Storage)
                                if (influencerId) {
                                    try {
                                        const response = await fetch(imgUrl);
                                        const blob = await response.blob();
                                        const extension = outputType === 'video' ? 'mp4' : (outputType === 'gif' ? 'gif' : 'png');
                                        const file = new File([blob], `gen_${Date.now()}.${extension}`, { type: blob.type });

                                        await addMoodboardItem(influencerId, {
                                            title: `Geração AI - ${wfTemplate.name}`,
                                            type: 'post',
                                            imageFile: file,
                                            prompt: JSON.stringify(promptJson),
                                            obs: `ID Run ComfyICU: ${runResp.id}`,
                                            albumId: null
                                        });
                                    } catch (error) {
                                        console.error("Erro ao persistir na galeria:", error);
                                    }
                                }

                                // 6. Propagar para nodes conectados (Preview)
                                setNodes(nds => nds.map(n => {
                                    if (n.id === toolNode.id) {
                                        return { ...n, data: { ...n.data, status: "success", resultUrl: imgUrl } };
                                    }

                                    const isTargetOfExecution = edges.some(e => e.source === toolNode.id && e.target === n.id);
                                    if (n.type === "preview" && isTargetOfExecution) {
                                        return { ...n, data: { ...n.data, imageUrl: imgUrl } };
                                    }

                                    return n;
                                }));
                            } else {
                                setNodes(nds => nds.map(n => n.id === toolNode.id ? { ...n, data: { ...n.data, status: "error" } } : n));
                            }

                            if (executableNodes.indexOf(toolNode) === executableNodes.length - 1) setIsExecuting(false);
                        } else if (statusResp.status === "FAILED" || statusResp.status === "CANCELLED") {
                            clearInterval(pollInterval);
                            setNodes(nds => nds.map(n => n.id === toolNode.id ? { ...n, data: { ...n.data, status: "error" } } : n));
                            if (executableNodes.indexOf(toolNode) === executableNodes.length - 1) setIsExecuting(false);
                            return;
                        }
                    }, 2000);

                } catch (err) {
                    console.error("Erro na execução:", err)
                    setNodes(nds => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, status: "error" } } : n));
                }
            } else if (node.type === "assistant") {
                const agentId = node.data.selectedAgentId;
                const modelId = node.data.selectedModelId || "gemini-1.5-flash";
                const agent = agents.find(a => a.id === agentId);
                if (!agent) continue;

                const incomingEdges = edges.filter(e => e.target === node.id);
                let promptText = node.data.promptText || ""; // Começa com o texto do textarea do próprio node

                incomingEdges.forEach(edge => {
                    const sourceNode = nodes.find(n => n.id === edge.source);
                    if (sourceNode?.type === "text_input") {
                        promptText += "\nContexto adicional:\n" + sourceNode.data.text;
                    } else if (sourceNode?.type === "assistant" && sourceNode.data.response) {
                        promptText += "\nContexto da IA anterior:\n" + sourceNode.data.response;
                    }
                });

                try {
                    setNodes(nds => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, status: "running" } } : n));

                    const keysDoc = await getDoc(doc(db, "settings", "keys"));
                    const apiKey = keysDoc.data()?.geminiKey;

                    const response = await fetch("/api/gemini", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            model: modelId,
                            messages: [
                                { role: "system", content: agent.systemPrompt },
                                { role: "user", content: promptText || "Olá" }
                            ],
                            apiKey
                        })
                    });
                    const resData = await response.json();
                    if (resData.error) throw new Error(resData.error);
                    const aiResponse = resData.choices[0].message.content;

                    // Propagar resposta para nodes conectados
                    setNodes(nds => nds.map(n => {
                        if (n.id === node.id) {
                            return { ...n, data: { ...n.data, status: "success", response: aiResponse } };
                        }

                        // Se um node de texto estiver conectado à saída deste assistente
                        const isTargetOfExecution = edges.some(e => e.source === node.id && e.target === n.id);
                        if (n.type === "text_input" && isTargetOfExecution) {
                            return { ...n, data: { ...n.data, text: aiResponse } };
                        }

                        return n;
                    }));
                } catch (err) {
                    console.error("Erro no Assistente IA:", err)
                    setNodes(nds => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, status: "error" } } : n));
                }
            }
        }
        setIsExecuting(false);
    }

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        if (!rfInstance) return;

        const data = event.dataTransfer.getData('application/reactflow');
        if (!data) return;

        const [type, payload] = data.split('|');
        const pos = rfInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });

        if (type === 'tool') {
            const cat = categories.find(c => c.id === payload);
            if (cat) addToolNode(cat, pos);
        } else if (type === 'input') {
            addInputNode(payload, pos);
        }
    }, [rfInstance, categories, addToolNode, addInputNode]);

    return (
        <div className="w-full h-full bg-[#0a0a0b] relative overflow-hidden flex flex-row">
            {isLibraryOpen && (
                <div className="w-[260px] shrink-0 border-r border-white/5 relative z-[201]">
                    <ToolPalette
                        categories={categories} workflows={workflows}
                        position={{ x: 0, y: 0 }}
                        onSelectTool={(cat: any) => addToolNode(cat, { x: 100, y: 100 })}
                        onSelectInput={(type: any) => addInputNode(type, { x: 100, y: 100 })}
                        onClose={() => setIsLibraryOpen(false)}
                    />
                </div>
            )}

            <CanvasContext.Provider value={{
                onPlayNode: handleExecute as any,
                onEdgeClick: (e, id) => {
                    const canvasBounds = e.currentTarget.getBoundingClientRect();
                    setPalette({ isOpen: true, x: e.clientX, y: e.clientY, targetEdge: id });
                },
                onRemoveNode: removeNode,
                takeSnapshot: takeSnapshot
            }}>
                <div className="flex-1 h-full relative" onDragOver={onDragOver} onDrop={onDrop}>
                    <header className="absolute top-8 left-8 right-8 z-50 pointer-events-none flex items-center justify-between">
                        <div className="flex items-center gap-2 p-1.5 bg-[#121214]/60 backdrop-blur-md border border-white/5 rounded-xl pointer-events-auto">

                            {/* Library Toggle */}
                            <button
                                onClick={() => setIsLibraryOpen(!isLibraryOpen)}
                                className={cn("px-3 py-2 rounded-lg transition-colors border border-transparent", isLibraryOpen ? "bg-primary/20 text-primary border-primary/20" : "bg-white/5 text-white/50 hover:text-white")}
                                title="Alternar Library (Nodes)"
                            >
                                <FolderOpen className="w-4 h-4" />
                            </button>
                            <div className="w-px h-6 bg-white/10 mx-1"></div>

                            {/* Selector/Title */}
                            <div className="relative flex items-center shrink-0 pr-2 border-r border-white/5">
                                <div className="flex items-center gap-2 px-3 py-1 cursor-pointer hover:bg-white/5 rounded-lg transition-colors" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                                    <Layers className="w-4 h-4 text-primary" />
                                    <ChevronDown className="w-3 h-3 text-white/50" />
                                </div>

                                <input
                                    value={canvasName}
                                    onChange={e => setCanvasName(e.target.value)}
                                    className="bg-transparent text-[11px] font-bold text-white/90 uppercase tracking-widest outline-none w-32 md:w-36 ml-2 focus:text-white transition-colors"
                                />

                                <div className="flex items-center gap-1 ml-2">
                                    <button onClick={handleSaveCanvas} disabled={isSaving} className="p-2 bg-emerald-500/10 hover:bg-emerald-500/30 text-emerald-500 rounded-lg transition-all border border-emerald-500/20" title="Salvar Workspace">
                                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                    </button>

                                    {profile?.role === 'admin' && (
                                        <button
                                            onClick={() => setIsGlobalModalOpen(true)}
                                            className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-2"
                                            title="Publicar como Modelo Global"
                                        >
                                            <Sparkles className="w-3 h-3" /> Publicar
                                        </button>
                                    )}
                                </div>

                                {/* Dropdown list */}
                                {isDropdownOpen && (
                                    <div className="absolute top-full left-0 mt-3 w-64 bg-[#1a1a1d] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
                                        <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                                            <button onClick={handleNewCanvas} className="w-full flex items-center justify-center gap-2 py-2 bg-primary/20 hover:bg-primary text-primary hover:text-white rounded-lg transition-all text-[10px] font-black uppercase tracking-widest"><Plus className="w-3.5 h-3.5" /> Novo</button>
                                        </div>
                                        <div className="max-h-60 overflow-y-auto no-scrollbar py-2">
                                            {savedCanvas.length === 0 && <div className="px-4 py-3 text-center text-[9px] text-white/30 uppercase font-black">Nenhum salvo</div>}
                                            {savedCanvas.map(wf => (
                                                <div key={wf.id} className="group flex items-center justify-between px-4 py-2 hover:bg-white/5 cursor-pointer transition-colors" onClick={() => handleLoadCanvas(wf)}>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-bold text-white/80 uppercase truncate w-40">{wf.name}</span>
                                                        <span className="text-[8px] text-muted-foreground uppercase">{wf.nodes?.length || 0} nodes</span>
                                                    </div>
                                                    <button onClick={(e) => handleDeleteCanvas(wf.id, e)} className="p-1.5 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center px-2 border-r border-white/5 pr-4">
                                <button onClick={handleSaveCanvas} disabled={isSaving} className="p-2 text-white/60 hover:text-primary hover:bg-white/5 rounded-lg transition-all" title="Salvar Workspace">
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                </button>
                                <button onClick={handleExportJson} className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all" title="Exportar JSON">
                                    <FileDown className="w-4 h-4" />
                                </button>
                            </div>

                            <button
                                onClick={handleExecute}
                                disabled={isExecuting || nodes.length === 0}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-all ml-1",
                                    isExecuting ? "bg-white/5 text-white/20 cursor-wait" : "hover:bg-primary/20 hover:text-primary text-white/60"
                                )}
                            >
                                {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                                <span className="text-[9px] font-bold uppercase tracking-widest">{isExecuting ? "Parar" : "Executar"}</span>
                            </button>
                        </div>

                        {nodes.length > 0 && (
                            <div className="p-1.5 bg-[#121214]/60 backdrop-blur-md border border-white/5 rounded-xl pointer-events-auto pr-4 flex items-center gap-3">
                                <div className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg">
                                    <MousePointer2 className="w-3.5 h-3.5 text-white/20" />
                                </div>
                                <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{nodes.length} Nodes</span>
                            </div>
                        )}
                    </header>

                    <ReactFlow
                        nodes={nodes} edges={edges}
                        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onReconnect={onReconnect}
                        onPaneClick={onPaneClick}
                        onPaneContextMenu={onPaneContextMenu}
                        onNodesDelete={onNodesDelete} onEdgesDelete={onEdgesDelete}
                        onNodeDragStart={takeSnapshot}
                        onInit={setRfInstance} nodeTypes={nodeTypes} edgeTypes={edgeTypes}
                        deleteKeyCode={["Backspace", "Delete"]}
                        defaultEdgeOptions={{
                            style: { stroke: '#8b5cf6', strokeWidth: 2, opacity: 0.6 },
                            interactionWidth: 40,
                            type: 'insertNode',
                            deletable: true
                        }}
                        fitView className="bg-[#0a0a0b]"
                    >
                        <Background color="#1d1d1f" gap={40} size={1} />
                        <Controls className="!bg-[#1a1a1d] !border-white/10 !rounded-xl overflow-hidden [&>button]:!bg-transparent [&>button]:!border-white/5 [&>button]:!fill-white/60 hover:[&>button]:!fill-white hover:[&>button]:!bg-white/5 [&>button_svg]:!fill-current" showInteractive={false} />
                    </ReactFlow>

                    {palette.isOpen && (
                        <ToolPalette
                            categories={categories} workflows={workflows}
                            position={{ x: palette.x, y: palette.y }}
                            onClose={() => setPalette(p => ({ ...p, isOpen: false, targetEdge: undefined }))}
                            onSelectTool={addToolNode} onSelectInput={addInputNode}
                        />
                    )}
                </div>
            </CanvasContext.Provider>
            {/* Global Template Save Modal */}
            <AnimatePresence>
                {isGlobalModalOpen && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 pb-20 md:pb-6 pointer-events-auto">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setIsGlobalModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-md bg-[#121214] border border-white/10 rounded-[2rem] shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden">
                            <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20 shadow-inner">
                                        <Sparkles className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none mb-1">Publicar Modelo</h3>
                                        <span className="text-[8px] font-bold text-white/40 uppercase tracking-[0.2em]">Otimizado para o Studio</span>
                                    </div>
                                </div>
                                <button onClick={() => setIsGlobalModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/20 hover:text-white transition-all"><X className="w-4 h-4" /></button>
                            </div>

                            <form className="p-8 space-y-6" onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                handleSaveAsGlobal({
                                    name: formData.get("name"),
                                    description: formData.get("description"),
                                    categoryId: formData.get("category"),
                                    coverImageUrl: formData.get("cover")
                                });
                            }}>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[9px] uppercase font-black text-white/30 tracking-widest ml-1">Nome do Modelo</label>
                                        <input name="name" required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="Ex: Fotorealismo Pro" defaultValue={canvasName} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] uppercase font-black text-white/30 tracking-widest ml-1">Descrição</label>
                                        <textarea name="description" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-medium text-white/60 focus:ring-1 focus:ring-primary outline-none transition-all min-h-[80px]" placeholder="Breve resumo das capacidades..." />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] uppercase font-black text-white/30 tracking-widest ml-1">Categoria (Tab)</label>
                                        <div className="relative">
                                            <select name="category" required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer">
                                                {categories.map(c => <option key={c.id} value={c.id} className="bg-[#121214]">{c.name}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] uppercase font-black text-white/30 tracking-widest ml-1">URL da Imagem de Capa</label>
                                        <input name="cover" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white/40 focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="https://..." />
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button type="submit" disabled={isSaving} className="w-full py-4 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-primary-dark shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <><Sparkles className="w-4 h-4" /> Publicar Modelo Global</>}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
