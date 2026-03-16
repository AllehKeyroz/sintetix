"use client"

import { useState, useEffect } from "react"
import { Settings, X, Plus, Trash2, Save, Code, Check, Upload } from "lucide-react"
import { ComfyWorkflow, ComfyNode, WorkflowType, ModelCategory } from "@/types/comfy"
import { saveWorkflowTemplate, deleteWorkflowTemplate, listModelCategories } from "@/lib/admin_actions"
import { cn } from "@/lib/utils"

interface StudioSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    workflows: ComfyWorkflow[];
    setWorkflows: (workflows: ComfyWorkflow[]) => void;
    isAdminMode?: boolean;
}

export function StudioSettingsModal({ isOpen, onClose, workflows, setWorkflows, isAdminMode = false }: StudioSettingsModalProps) {
    const [view, setView] = useState<"list" | "edit">("list")
    const [editingWorkflow, setEditingWorkflow] = useState<Partial<ComfyWorkflow> | null>(null)
    const [parsedNodes, setParsedNodes] = useState<Record<string, ComfyNode> | null>(null)
    const [error, setError] = useState("")
    const [categories, setCategories] = useState<ModelCategory[]>([])
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)

    useEffect(() => {
        if (isOpen) {
            listModelCategories().then(setCategories).catch(console.error)
        }
    }, [isOpen])

    if (!isOpen) return null

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) {
                const fileName = file.name.replace(".json", "");

                // Tentativa de extrair o ID do ComfyICU do nome do arquivo
                // Exemplo: workflow-api-ichK070JKqqt3ZkXHWHUO.json -> ichK070JKqqt3ZkXHWHUO
                let workflowId = "";
                const match = fileName.match(/workflow-api-(.+)/);
                if (match && match[1]) {
                    workflowId = match[1];
                }

                setEditingWorkflow(prev => {
                    const next = { ...prev };
                    // Se extraiu um ID, salva no id do workflow
                    if (workflowId) next.id = workflowId;
                    // Sugere o nome baseado no arquivo se ainda estiver vazio
                    if (!next.name) next.name = fileName;
                    return next;
                });

                handlePastJson(content);
            }
        };
        reader.readAsText(file);
    };

    const handlePastJson = (jsonString: string) => {
        try {
            const initialParsed = JSON.parse(jsonString)
            const parsed = initialParsed.output || initialParsed

            // Se o usuário colou o formato visual (com vetor de nodes/links), vamos bloquear
            if (parsed.nodes && Array.isArray(parsed.nodes) && parsed.links) {
                setError("⚠️ Você colou o formato Visual do ComfyUI. Por favor, vá nas configurações do fluxo (engrenagem), ative 'Enable Dev mode Options' e clique no botão 'Save (API Format)'.")
                setParsedNodes(null)
                setEditingWorkflow(prev => ({ ...prev, rawJson: jsonString }))
                return
            }

            setParsedNodes(parsed)
            setError("")

            // Auto-guess some nodes if mapping is empty
            const newMapping = { ...editingWorkflow?.mapping }
            Object.entries(parsed).forEach(([nodeId, nodeData]: [string, any]) => {
                if (nodeData.class_type === "CLIPTextEncode") {
                    if (!newMapping.positivePromptNodeId) newMapping.positivePromptNodeId = nodeId
                    else if (!newMapping.negativePromptNodeId) newMapping.negativePromptNodeId = nodeId
                }
                if (nodeData.class_type === "EmptyLatentImage" || nodeData.class_type === "EmptySD3LatentImage") {
                    if (!newMapping.widthNodeId) newMapping.widthNodeId = nodeId
                }
                if (nodeData.class_type === "LoadImage") {
                    if (!newMapping.baseImageNodeId) newMapping.baseImageNodeId = nodeId
                }
            })

            setEditingWorkflow(prev => ({
                ...prev,
                rawJson: jsonString,
                mapping: newMapping
            }))
        } catch (err) {
            setError("JSON inválido. Certifique-se de colar o formato API exportado.")
            setParsedNodes(null)
            setEditingWorkflow(prev => ({ ...prev, rawJson: jsonString }))
        }
    }

    const saveWorkflow = async () => {
        if (!editingWorkflow?.name || !editingWorkflow?.rawJson) {
            setError("Nome e JSON são obrigatórios.")
            return
        }

        const workflowData: Partial<ComfyWorkflow> = {
            ...editingWorkflow,
            id: editingWorkflow.id,
            name: editingWorkflow.name,
            type: editingWorkflow.type || "generate",
            rawJson: editingWorkflow.rawJson,
            mapping: editingWorkflow.mapping || {},
            categoryId: editingWorkflow.categoryId || "",
            engine: editingWorkflow.engine || "comfy_icu"
        }

        try {
            if (isAdminMode) {
                // Salvar no Firebase
                const finalId = editingWorkflow.id;
                const savedId = await saveWorkflowTemplate({
                    ...workflowData,
                    id: finalId // Forçamos o ID extraído/colado
                } as ComfyWorkflow);
                const completeWorkflow = { ...workflowData, id: savedId } as ComfyWorkflow;

                let updated: ComfyWorkflow[]
                if (editingWorkflow.id) {
                    updated = workflows.map(w => w.id === savedId ? completeWorkflow : w)
                } else {
                    updated = [...workflows, completeWorkflow]
                }
                setWorkflows(updated)
            } else {
                // Modo legado / local
                const newWorkflow: ComfyWorkflow = {
                    ...workflowData,
                    id: editingWorkflow.id || Date.now().toString(),
                } as ComfyWorkflow

                let updated: ComfyWorkflow[]
                if (editingWorkflow.id) {
                    updated = workflows.map(w => w.id === newWorkflow.id ? newWorkflow : w)
                } else {
                    updated = [...workflows, newWorkflow]
                }

                setWorkflows(updated)
                localStorage.setItem("sintetix_workflows", JSON.stringify(updated))
            }

            setView("list")
            setEditingWorkflow(null)
            setParsedNodes(null)
        } catch (err: any) {
            setError("Erro ao salvar: " + err.message)
        }
    }

    const deleteWorkflow = async (id: string) => {
        try {
            if (isAdminMode) {
                await deleteWorkflowTemplate(id);
                setWorkflows(workflows.filter(w => w.id !== id))
            } else {
                const updated = workflows.filter(w => w.id !== id)
                setWorkflows(updated)
                localStorage.setItem("sintetix_workflows", JSON.stringify(updated))
            }
        } catch (err: any) {
            alert("Erro ao deletar: " + err.message)
        }
    }

    const startNew = () => {
        setEditingWorkflow({
            name: "",
            type: "generate",
            rawJson: "",
            mapping: {},
            engine: "comfy_icu"
        })
        setParsedNodes(null)
        setError("")
        setView("edit")
    }

    const startEdit = (workflow: ComfyWorkflow) => {
        setEditingWorkflow(workflow)
        try {
            setParsedNodes(JSON.parse(workflow.rawJson))
        } catch {
            setParsedNodes(null)
        }
        setError("")
        setView("edit")
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className={`bg-[#0c0c0e] border border-white/10 p-6 rounded-2xl shadow-2xl relative flex flex-col max-h-[90vh] ${view === "edit" ? "w-[600px]" : "w-[450px]"}`}>
                <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center justify-between mb-6 shrink-0">
                    <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                        <Settings className="w-4 h-4 text-primary" />
                        Gerenciador de Modelos
                    </h3>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {view === "list" && (
                        <div className="space-y-4">
                            <button
                                onClick={startNew}
                                className="w-full py-4 border border-dashed border-white/20 rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Adicionar Novo Modelo
                            </button>

                            {workflows.length === 0 ? (
                                <p className="text-[10px] text-center text-white/30 uppercase tracking-widest font-bold py-8">
                                    Nenhum modelo cadastrado.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {workflows.map(w => (
                                        <div key={w.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between group">
                                            <div>
                                                <h4 className="text-sm font-bold text-white">{w.name}</h4>
                                                <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1 font-bold">
                                                    Tipo: <span className="text-primary">{w.type}</span>
                                                </p>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => startEdit(w)} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">
                                                    <Code className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => deleteWorkflow(w.id)} className="p-2 bg-destructive/10 hover:bg-destructive/20 rounded-lg text-destructive transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {view === "edit" && editingWorkflow && (
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-1 space-y-1.5">
                                    <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest ml-1">Nome do Modelo</label>
                                    <input
                                        type="text"
                                        value={editingWorkflow.name || ""}
                                        onChange={e => setEditingWorkflow({ ...editingWorkflow, name: e.target.value })}
                                        className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-1 focus:ring-primary outline-none"
                                        placeholder="Ex: Z-Image Realismo V1"
                                    />
                                </div>
                                <div className="flex-1 space-y-1.5">
                                    <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest ml-1 text-primary">ID do Fluxo (Workflow ID / Prompt ID)</label>
                                    <input
                                        type="text"
                                        value={editingWorkflow.id || ""}
                                        onChange={e => setEditingWorkflow({ ...editingWorkflow, id: e.target.value })}
                                        className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-1 focus:ring-primary outline-none"
                                        placeholder="ID extraído ou colado"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1 space-y-1.5">
                                    <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest ml-1 text-primary">Motor de Execução</label>
                                    <select
                                        value={editingWorkflow.engine || "comfy_icu"}
                                        onChange={e => setEditingWorkflow({ ...editingWorkflow, engine: e.target.value as any })}
                                        className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:ring-1 focus:ring-primary outline-none"
                                    >
                                        <option value="comfy_icu">Comfy.icu (Padrão)</option>
                                        <option value="comfy_cloud">Comfy Cloud (Official/Org)</option>
                                        <option value="fal_ai">Fal.ai (High Speed)</option>
                                    </select>
                                </div>
                                <div className="flex-1 space-y-1.5">
                                    <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest ml-1">Categoria (Aba)</label>
                                    <div className="relative">
                                        <button
                                            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                            onBlur={() => setTimeout(() => setIsCategoryDropdownOpen(false), 200)}
                                            className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:ring-1 focus:ring-primary outline-none flex items-center justify-between hover:border-white/20 transition-all shadow-inner"
                                        >
                                            <span className={cn(!editingWorkflow.categoryId && "text-muted-foreground")}>
                                                {categories.find(c => c.id === editingWorkflow.categoryId)?.name || "-- Selecione --"}
                                            </span>
                                            <Plus className={cn("w-3 h-3 text-muted-foreground transition-transform duration-300", isCategoryDropdownOpen && "rotate-45")} />
                                        </button>

                                        {isCategoryDropdownOpen && (
                                            <div className="absolute top-full left-0 mt-2 w-full bg-[#0c0c0e] border border-white/10 rounded-xl shadow-2xl p-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-300 backdrop-blur-xl max-h-48 overflow-y-auto no-scrollbar">
                                                {categories.length === 0 ? (
                                                    <div className="px-3 py-4 text-[9px] text-muted-foreground italic text-center uppercase tracking-widest font-black">Nenhuma categoria criada</div>
                                                ) : (
                                                    categories.map(cat => (
                                                        <button
                                                            key={cat.id}
                                                            onMouseDown={() => {
                                                                setEditingWorkflow({ ...editingWorkflow, categoryId: cat.id, type: cat.id as any });
                                                                setIsCategoryDropdownOpen(false);
                                                            }}
                                                            className={cn(
                                                                "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all",
                                                                editingWorkflow.categoryId === cat.id ? "bg-primary/20 text-primary" : "text-white/70 hover:bg-white/5 hover:text-white"
                                                            )}
                                                        >
                                                            <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", editingWorkflow.categoryId === cat.id ? "bg-primary animate-pulse" : "bg-white/10")} />
                                                            <span className="text-[10px] font-bold uppercase tracking-tight truncate">{cat.name}</span>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>





                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest ml-1 flex items-center justify-between">
                                    <span>JSON (API Format)</span>
                                    {parsedNodes && <span className="text-primary flex items-center gap-1"><Check className="w-3 h-3" /> Parse OK</span>}
                                </label>

                                <div className="relative w-full">
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleFileUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className={`w-full border-2 border-dashed ${parsedNodes ? "border-primary/50 bg-primary/5" : "border-white/20 bg-white/5"} rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-colors hover:border-primary/40`}>
                                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                                            <Upload className={`w-5 h-5 ${parsedNodes ? "text-primary" : "text-muted-foreground"}`} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-bold text-white mb-1">
                                                {editingWorkflow.rawJson ? "Arquivo importado ✔️ (Clique para trocar)" : "Clique ou arraste o arquivo JSON aqui"}
                                            </p>
                                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Somente Formato Exportado (API Format)</p>
                                        </div>
                                    </div>
                                </div>
                                {error && <p className="text-destructive text-[10px] uppercase font-bold tracking-widest text-center mt-2">{error}</p>}
                            </div>

                            {parsedNodes && (
                                <div className="bg-secondary/30 border border-white/5 rounded-xl p-5 space-y-4">
                                    <h4 className="text-[10px] font-black uppercase text-white tracking-widest border-b border-white/10 pb-2">Mapeamento Dinâmico de Nós</h4>

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Positive Prompt */}
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest ml-1 text-primary">Nó de Prompt Positivo</label>
                                            <select
                                                value={editingWorkflow.mapping?.positivePromptNodeId || ""}
                                                onChange={e => setEditingWorkflow({ ...editingWorkflow, mapping: { ...editingWorkflow.mapping, positivePromptNodeId: e.target.value } })}
                                                className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-[10px] font-bold text-white focus:ring-1 focus:ring-primary outline-none"
                                            >
                                                <option value="">-- Não mapeado --</option>
                                                {Object.entries(parsedNodes).map(([id, node]) => {
                                                    const actualNode = node;
                                                    const typeStr = actualNode.class_type ? `[${actualNode.class_type}]` : '';
                                                    return (
                                                        <option key={id} value={id}>Nó {id} {typeStr}</option>
                                                    )
                                                })}
                                            </select>
                                        </div>

                                        {/* Negative Prompt */}
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest ml-1 text-primary">Nó de Prompt Negativo</label>
                                            <select
                                                value={editingWorkflow.mapping?.negativePromptNodeId || ""}
                                                onChange={e => setEditingWorkflow({ ...editingWorkflow, mapping: { ...editingWorkflow.mapping, negativePromptNodeId: e.target.value } })}
                                                className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-[10px] font-bold text-white focus:ring-1 focus:ring-primary outline-none"
                                            >
                                                <option value="">-- Não mapeado --</option>
                                                {Object.entries(parsedNodes).map(([id, node]) => {
                                                    const typeStr = node.class_type ? `[${node.class_type}]` : '';
                                                    return <option key={id} value={id}>Nó {id} {typeStr}</option>
                                                })}
                                            </select>
                                        </div>

                                        {/* Width and Height */}
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest ml-1 text-primary">Nó de Resolução (W/H)</label>
                                            <select
                                                value={editingWorkflow.mapping?.widthNodeId || ""}
                                                onChange={e => setEditingWorkflow({ ...editingWorkflow, mapping: { ...editingWorkflow.mapping, widthNodeId: e.target.value } })}
                                                className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-[10px] font-bold text-white focus:ring-1 focus:ring-primary outline-none"
                                            >
                                                <option value="">-- Não mapeado --</option>
                                                {Object.entries(parsedNodes).map(([id, node]) => {
                                                    const typeStr = node.class_type ? `[${node.class_type}]` : '';
                                                    return <option key={id} value={id}>Nó {id} {typeStr}</option>
                                                })}
                                            </select>
                                        </div>

                                        {/* Imagem Origem (se aplicavel) */}
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest ml-1 text-primary">Nó Imagem Origem (Opcional)</label>
                                            <select
                                                value={editingWorkflow.mapping?.baseImageNodeId || ""}
                                                onChange={e => setEditingWorkflow({ ...editingWorkflow, mapping: { ...editingWorkflow.mapping, baseImageNodeId: e.target.value } })}
                                                className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-[10px] font-bold text-white focus:ring-1 focus:ring-primary outline-none"
                                            >
                                                <option value="">-- Não mapeado --</option>
                                                {Object.entries(parsedNodes).map(([id, node]) => {
                                                    const typeStr = node.class_type ? `[${node.class_type}]` : '';
                                                    return <option key={id} value={id}>Nó {id} {typeStr}</option>
                                                })}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-4 pt-2">
                                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                            <h4 className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">Inputs de Imagem (Uploads)</h4>
                                            <button
                                                onClick={() => {
                                                    const current = editingWorkflow.mapping?.imageInputs || []
                                                    setEditingWorkflow({
                                                        ...editingWorkflow,
                                                        mapping: { ...editingWorkflow.mapping, imageInputs: [...current, { label: `Imagem ${current.length + 1}`, nodeId: "" }] }
                                                    })
                                                }}
                                                className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest"
                                            >
                                                <Plus className="w-3 h-3" /> Adicionar
                                            </button>
                                        </div>

                                        {(editingWorkflow.mapping?.imageInputs || []).length === 0 ? (
                                            <p className="text-[9px] text-muted-foreground italic text-center py-2">Nenhum input de imagem mapeado.</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {(editingWorkflow.mapping?.imageInputs || []).map((input, idx) => (
                                                    <div key={idx} className="flex gap-2 items-end bg-white/5 p-3 rounded-xl border border-white/5">
                                                        <div className="flex-1 space-y-1">
                                                            <label className="text-[8px] font-bold text-muted-foreground uppercase ml-1">Label (Ex: Roupa)</label>
                                                            <input
                                                                type="text"
                                                                value={input.label}
                                                                onChange={e => {
                                                                    const newList = [...(editingWorkflow.mapping?.imageInputs || [])]
                                                                    newList[idx].label = e.target.value
                                                                    setEditingWorkflow({ ...editingWorkflow, mapping: { ...editingWorkflow.mapping, imageInputs: newList } })
                                                                }}
                                                                className="w-full bg-background border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-white focus:ring-1 focus:ring-primary outline-none"
                                                            />
                                                        </div>
                                                        <div className="flex-[1.5] space-y-1">
                                                            <label className="text-[8px] font-bold text-muted-foreground uppercase ml-1">Nó Alvo (LoadImage)</label>
                                                            <select
                                                                value={input.nodeId}
                                                                onChange={e => {
                                                                    const newList = [...(editingWorkflow.mapping?.imageInputs || [])]
                                                                    newList[idx].nodeId = e.target.value
                                                                    setEditingWorkflow({ ...editingWorkflow, mapping: { ...editingWorkflow.mapping, imageInputs: newList } })
                                                                }}
                                                                className="w-full bg-background border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-white focus:ring-1 focus:ring-primary outline-none"
                                                            >
                                                                <option value="">-- Selecione --</option>
                                                                {Object.entries(parsedNodes).map(([id, node]) => (
                                                                    <option key={id} value={id}>Nó {id} [{node.class_type}]</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                const newList = (editingWorkflow.mapping?.imageInputs || []).filter((_, i) => i !== idx)
                                                                setEditingWorkflow({ ...editingWorkflow, mapping: { ...editingWorkflow.mapping, imageInputs: newList } })
                                                            }}
                                                            className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Parameter Inputs (NEW) */}
                                    <div className="space-y-4 pt-2 border-t border-white/5 mt-4">
                                        <div className="flex items-center justify-between pb-2">
                                            <h4 className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">Parâmetros Extras (Controle de Nós)</h4>
                                            <button
                                                onClick={() => {
                                                    const current = editingWorkflow.mapping?.parameterInputs || []
                                                    setEditingWorkflow({
                                                        ...editingWorkflow,
                                                        mapping: { ...editingWorkflow.mapping, parameterInputs: [...current, { nodeId: "", field: "", label: "Novo Ajuste", type: "text" }] }
                                                    })
                                                }}
                                                className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest"
                                            >
                                                <Plus className="w-3 h-3" /> Adicionar Parâmetro
                                            </button>
                                        </div>

                                        {(editingWorkflow.mapping?.parameterInputs || []).length === 0 ? (
                                            <p className="text-[9px] text-muted-foreground italic text-center py-2">Nenhum parâmetro extra mapeado.</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {(editingWorkflow.mapping?.parameterInputs || []).map((param, idx) => (
                                                    <div key={idx} className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-3">
                                                        <div className="flex gap-2">
                                                            <div className="flex-1 space-y-1">
                                                                <label className="text-[8px] font-bold text-muted-foreground uppercase ml-1">Label</label>
                                                                <input
                                                                    type="text"
                                                                    value={param.label}
                                                                    onChange={e => {
                                                                        const newList = [...(editingWorkflow.mapping?.parameterInputs || [])]
                                                                        newList[idx].label = e.target.value
                                                                        setEditingWorkflow({ ...editingWorkflow, mapping: { ...editingWorkflow.mapping, parameterInputs: newList } })
                                                                    }}
                                                                    className="w-full bg-background border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-white focus:ring-1 focus:ring-primary outline-none"
                                                                />
                                                            </div>
                                                            <div className="w-[100px] space-y-1">
                                                                <label className="text-[8px] font-bold text-muted-foreground uppercase ml-1">Tipo UI</label>
                                                                <select
                                                                    value={param.type}
                                                                    onChange={e => {
                                                                        const newList = [...(editingWorkflow.mapping?.parameterInputs || [])]
                                                                        newList[idx].type = e.target.value as any
                                                                        setEditingWorkflow({ ...editingWorkflow, mapping: { ...editingWorkflow.mapping, parameterInputs: newList } })
                                                                    }}
                                                                    className="w-full bg-background border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-white focus:ring-1 focus:ring-primary outline-none"
                                                                >
                                                                    <option value="text">Texto</option>
                                                                    <option value="number">Número</option>
                                                                    <option value="boolean">Checkbox</option>
                                                                    <option value="select">Seleção</option>
                                                                </select>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    const newList = (editingWorkflow.mapping?.parameterInputs || []).filter((_, i) => i !== idx)
                                                                    setEditingWorkflow({ ...editingWorkflow, mapping: { ...editingWorkflow.mapping, parameterInputs: newList } })
                                                                }}
                                                                className="mt-5 p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <div className="flex-1 space-y-1">
                                                                <label className="text-[8px] font-bold text-muted-foreground uppercase ml-1">Nó Alvo</label>
                                                                <select
                                                                    value={param.nodeId}
                                                                    onChange={e => {
                                                                        const newList = [...(editingWorkflow.mapping?.parameterInputs || [])]
                                                                        newList[idx].nodeId = e.target.value
                                                                        setEditingWorkflow({ ...editingWorkflow, mapping: { ...editingWorkflow.mapping, parameterInputs: newList } })
                                                                    }}
                                                                    className="w-full bg-background border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-white focus:ring-1 focus:ring-primary outline-none"
                                                                >
                                                                    <option value="">-- Selecione Nó --</option>
                                                                    {Object.entries(parsedNodes).map(([id, node]) => (
                                                                        <option key={id} value={id}>Nó {id} [{node.class_type}]</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <div className="flex-1 space-y-1">
                                                                <label className="text-[8px] font-bold text-muted-foreground uppercase ml-1">Campo do Input</label>
                                                                <select
                                                                    value={param.field}
                                                                    onChange={e => {
                                                                        const newList = [...(editingWorkflow.mapping?.parameterInputs || [])]
                                                                        newList[idx].field = e.target.value
                                                                        setEditingWorkflow({ ...editingWorkflow, mapping: { ...editingWorkflow.mapping, parameterInputs: newList } })
                                                                    }}
                                                                    className="w-full bg-background border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-white focus:ring-1 focus:ring-primary outline-none"
                                                                >
                                                                    <option value="">-- Selecione Campo --</option>
                                                                    {param.nodeId && parsedNodes[param.nodeId] && Object.keys(parsedNodes[param.nodeId].inputs).map(fieldName => (
                                                                        <option key={fieldName} value={fieldName}>{fieldName}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>
                                                        {param.type === "select" && (
                                                            <div className="space-y-1">
                                                                <label className="text-[8px] font-bold text-muted-foreground uppercase ml-1">Opções (Separar por vírgula)</label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Ex: left,right,none"
                                                                    value={param.options?.join(",") || ""}
                                                                    onChange={e => {
                                                                        const newList = [...(editingWorkflow.mapping?.parameterInputs || [])]
                                                                        newList[idx].options = e.target.value.split(",").map(v => v.trim())
                                                                        setEditingWorkflow({ ...editingWorkflow, mapping: { ...editingWorkflow.mapping, parameterInputs: newList } })
                                                                    }}
                                                                    className="w-full bg-background border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-white focus:ring-1 focus:ring-primary outline-none"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-[9px] text-muted-foreground/70 leading-relaxed font-bold tracking-widest mt-4 uppercase">
                                        Esses nós serão subscritos dinamicamente pelo painel (prompt do usuário, fotos enviadas) antes de enviarmos para a API.
                                    </p>
                                </div>
                            )}

                        </div>
                    )}
                </div>

                {view === "edit" && (
                    <div className="mt-6 pt-6 border-t border-white/10 flex justify-between shrink-0">
                        <button
                            onClick={() => { setView("list"); setEditingWorkflow(null) }}
                            className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-white transition-colors"
                        >
                            Voltar
                        </button>
                        <button
                            onClick={saveWorkflow}
                            disabled={!editingWorkflow?.name || !parsedNodes}
                            className="bg-primary text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors shadow-lg disabled:opacity-50 flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            Salvar Modelo
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
