"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Save, Code, Check, Upload, Globe, Lock, Eye, EyeOff, LayoutPanelLeft, LayoutGrid, Settings, X, Edit2, Sparkles, Camera, Shirt, MapPin, Wand2, User, Image, Palette, Zap, ChevronDown, Download, Play, ImageIcon } from "lucide-react"
import { ComfyWorkflow, ComfyNode, WorkflowType, ModelCategory } from "@/types/comfy"
import { saveWorkflowTemplate, deleteWorkflowTemplate, listWorkflowTemplates, listModelCategories, saveModelCategory, deleteModelCategory } from "@/lib/admin_actions"
import { cn } from "@/lib/utils"
import { storage } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

const AVAILABLE_ICONS = [
    { name: 'Sparkles', icon: Sparkles },
    { name: 'Camera', icon: Camera },
    { name: 'Shirt', icon: Shirt },
    { name: 'MapPin', icon: MapPin },
    { name: 'Wand2', icon: Wand2 },
    { name: 'User', icon: User },
    { name: 'Image', icon: Image },
    { name: 'Palette', icon: Palette },
    { name: 'Zap', icon: Zap },
    { name: 'LayoutGrid', icon: LayoutGrid }
]

interface AdminModelsProps {
    onModuleChange?: (module: string) => void;
}

export function AdminModels({ onModuleChange }: AdminModelsProps) {
    const [view, setView] = useState<"list" | "edit">("list")
    const [templates, setTemplates] = useState<(ComfyWorkflow & { isPublished: boolean })[]>([])
    const [editingTemplate, setEditingTemplate] = useState<Partial<ComfyWorkflow & { isPublished: boolean }> | null>(null)
    const [parsedNodes, setParsedNodes] = useState<Record<string, ComfyNode> | null>(null)
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [categories, setCategories] = useState<ModelCategory[]>([])

    // Estados para Categorias
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
    const [isCategoryEditorOpen, setIsCategoryEditorOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Partial<ModelCategory> | null>(null)
    const [categoryError, setCategoryError] = useState("")
    const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false)
    const [openMappingDropdown, setOpenMappingDropdown] = useState<string | null>(null)
    const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean, title?: string, message: string, onConfirm: () => void }>({ isOpen: false, message: "", onConfirm: () => { } })
    const [selectedModels, setSelectedModels] = useState<string[]>([])
    const [activeModelTab, setActiveModelTab] = useState<"workflow" | "api">("workflow")

    useEffect(() => {
        loadTemplates()
        loadCategories()
    }, [])

    async function loadCategories() {
        try {
            const cats = await listModelCategories()
            setCategories(cats)
        } catch (err) {
            console.error("Erro ao carregar categorias:", err)
        }
    }

    const loadTemplates = async () => {
        setIsLoading(true)
        try {
            const data = await listWorkflowTemplates(false) // Admin sees everything
            setTemplates(data)
            return true
        } catch (err) {
            console.error("Erro ao carregar templates:", err)
            return false
        } finally {
            setIsLoading(false)
        }
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) {
                const fileName = file.name.replace(".json", "");

                // Extração do ID do ComfyICU
                let workflowId = "";
                const match = fileName.match(/workflow-api-(.+)/);
                if (match && match[1]) {
                    workflowId = match[1];
                }

                setEditingTemplate(prev => {
                    const next = { ...prev };
                    if (workflowId) next.id = workflowId;
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

            if (parsed.nodes && Array.isArray(parsed.nodes) && parsed.links) {
                setError("⚠️ Formato Visual detectado. Use 'Save (API Format)'.")
                setParsedNodes(null)
                setEditingTemplate(prev => ({ ...prev, rawJson: jsonString }))
                return
            }

            setParsedNodes(parsed)
            setError("")

            const newMapping = { ...editingTemplate?.mapping }
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

            setEditingTemplate(prev => ({
                ...prev,
                rawJson: jsonString,
                mapping: newMapping
            }))
        } catch (err) {
            setError("JSON inválido.")
            setParsedNodes(null)
            setEditingTemplate(prev => ({ ...prev, rawJson: jsonString }))
        }
    }

    const [isUploadingCover, setIsUploadingCover] = useState(false)

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !editingTemplate) return

        setIsUploadingCover(true)
        try {
            const fileRef = ref(storage, `covers/${Date.now()}_${file.name}`)
            const snapshot = await uploadBytes(fileRef, file)
            const url = await getDownloadURL(snapshot.ref)
            setEditingTemplate({ ...editingTemplate, coverImageUrl: url })
        } catch (err: any) {
            alert("Erro ao enviar imagem: " + err.message)
        } finally {
            setIsUploadingCover(false)
        }
    }

    const handleSave = async () => {
        if (!editingTemplate?.name?.trim()) {
            setError("O nome do modelo é obrigatório.")
            return
        }
        if (!editingTemplate?.categoryId) {
            setError("Uma categoria é obrigatória.")
            return
        }
        if (!editingTemplate?.rawJson) {
            setError("JSON do workflow é obrigatório.")
            return
        }

        try {
            await saveWorkflowTemplate(editingTemplate)
            setError("")
            const success = await loadTemplates()
            if (success) {
                setView("list")
                setEditingTemplate(null)
                setParsedNodes(null)
            }
        } catch (err: any) {
            setError("Erro ao salvar: " + err.message)
        }
    }

    const downloadWorkflow = (template: ComfyWorkflow) => {
        try {
            const blob = new Blob([template.rawJson], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${template.name.toLowerCase().replace(/\s+/g, '_')}_workflow.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch (err) {
            console.error("Erro ao baixar workflow:", err)
        }
    }

    const handleDelete = async (id: string) => {
        setConfirmDialog({
            isOpen: true,
            title: "Confirmar Exclusão",
            message: "Tem certeza que deseja deletar este template global? Esta ação é irreversível.",
            onConfirm: async () => {
                setConfirmDialog(p => ({ ...p, isOpen: false }))
                try {
                    await deleteWorkflowTemplate(id)
                    await loadTemplates()
                    setSelectedModels(prev => prev.filter(m => m !== id))
                } catch (err: any) {
                    alert("Erro ao deletar: " + err.message)
                }
            }
        })
    }

    const toggleModelSelection = (id: string) => {
        setSelectedModels(prev =>
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        )
    }

    const handleDeleteSelected = async () => {
        if (selectedModels.length === 0) return
        setConfirmDialog({
            isOpen: true,
            title: "Confirmar Exclusão Múltipla",
            message: `Tem certeza que deseja deletar ${selectedModels.length} modelos globais? A ação é irreversível.`,
            onConfirm: async () => {
                setConfirmDialog(p => ({ ...p, isOpen: false }))
                try {
                    for (const id of selectedModels) {
                        await deleteWorkflowTemplate(id)
                    }
                    await loadTemplates()
                    setSelectedModels([])
                } catch (err: any) {
                    alert("Erro ao deletar: " + err.message)
                }
            }
        })
    }

    const startNew = () => {
        setEditingTemplate({
            name: "",
            type: "generate",
            rawJson: "",
            mapping: {},
            isPublished: false,
            engine: "comfy_icu"
        })
        setParsedNodes(null)
        setError("")
        setView("edit")
    }

    const startEdit = (template: ComfyWorkflow & { isPublished: boolean }) => {
        setEditingTemplate(template)
        try {
            const parsed = JSON.parse(template.rawJson)
            setParsedNodes(parsed.output || parsed)
        } catch {
            setParsedNodes(null)
        }
        setError("")
        setView("edit")
    }

    // --- Ações de Categoria ---
    const handleSaveCategory = async () => {
        if (!editingCategory?.name || !editingCategory?.icon) {
            setCategoryError("Nome e ícone são obrigatórios.")
            return
        }
        try {
            await saveModelCategory(editingCategory)
            await loadCategories()
            setIsCategoryEditorOpen(false)
            setEditingCategory(null)
        } catch (err: any) {
            setCategoryError("Erro: " + err.message)
        }
    }

    const handleDeleteCategory = async (id: string) => {
        setConfirmDialog({
            isOpen: true,
            title: "Excluir Categoria",
            message: "Confirmar exclusão desta categoria global? Modelos associados precisarão ser atualizados.",
            onConfirm: async () => {
                setConfirmDialog(p => ({ ...p, isOpen: false }))
                try {
                    await deleteModelCategory(id)
                    await loadCategories()
                } catch (err: any) {
                    alert("Erro: " + err.message)
                }
            }
        })
    }

    const getIconComponent = (iconName: string) => {
        const item = AVAILABLE_ICONS.find(i => i.name === iconName)
        return item ? item.icon : LayoutGrid
    }

    return (
        <div className="flex-1 overflow-y-auto bg-background flex flex-col relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                            <Globe className="w-8 h-8 text-primary" />
                            Gerenciamento de Modelos
                        </h2>
                        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mt-1 opacity-50 ml-11">
                            Acesso & Configurações de Workflow
                        </p>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <button
                            onClick={() => setIsCategoryModalOpen(true)}
                            className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-white/50 hover:text-white group"
                            title="Gerenciar Categorias"
                        >
                            <LayoutGrid className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </button>

                        {selectedModels.length > 0 && view === "list" && (
                            <button
                                onClick={handleDeleteSelected}
                                className="w-full sm:w-auto bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center sm:justify-start gap-2 shadow-lg shadow-red-500/10"
                            >
                                <Trash2 className="w-4 h-4" />
                                Deletar ({selectedModels.length})
                            </button>
                        )}

                        {view === "list" && (
                            <button
                                onClick={startNew}
                                className="w-full sm:w-auto bg-primary text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center sm:justify-start gap-2 shadow-lg shadow-primary/20"
                            >
                                <Plus className="w-4 h-4" />
                                Novo Modelo
                            </button>
                        )}
                    </div>
                </div>

                {view === "list" && (
                    <div className="flex bg-black/40 p-1 rounded-xl w-fit mb-6 border border-white/5 flex-col sm:flex-row">
                        <button
                            onClick={() => setActiveModelTab("workflow")}
                            className={cn("px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2", activeModelTab === "workflow" ? "bg-white/10 text-white" : "text-white/40 hover:text-white")}
                        >
                            <Globe className="w-3 h-3" /> Workflows
                        </button>
                        <button
                            onClick={() => setActiveModelTab("api")}
                            className={cn("px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2", activeModelTab === "api" ? "bg-white/10 text-white" : "text-white/40 hover:text-white")}
                        >
                            <Code className="w-3 h-3" /> External APIS
                        </button>
                    </div>
                )}

                {view === "list" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {isLoading ? (
                            <div className="col-span-full py-20 flex flex-col items-center gap-4">
                                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Carregando templates...</p>
                            </div>
                        ) : templates.filter(t => (t.providerType || "workflow") === activeModelTab).length === 0 ? (
                            <div className="col-span-full py-20 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-center px-6">
                                <LayoutPanelLeft className="w-12 h-12 text-white/10 mb-4" />
                                <p className="text-sm font-bold text-white mb-2">Nenhum modelo global cadastrado</p>
                                <p className="text-xs text-muted-foreground max-w-xs uppercase tracking-widest font-black opacity-50">
                                    Comece criando o seu primeiro template para o SaaS.
                                </p>
                            </div>
                        ) : (
                            templates.filter(t => (t.providerType || "workflow") === activeModelTab).map(t => (
                                <div key={t.id} className={cn("bg-[#0c0c0e] border rounded-2xl transition-all group relative overflow-hidden flex flex-col min-h-[220px]", selectedModels.includes(t.id) ? "border-primary/50" : "border-white/10 hover:border-primary/30")}>

                                    {/* Capa de Fundo se existir */}
                                    {t.coverImageUrl && (
                                        <div className="absolute inset-0 z-0">
                                            <img src={t.coverImageUrl} className="w-full h-full object-cover opacity-30 group-hover:opacity-60 transition-opacity" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0e] via-[#0c0c0e]/80 to-transparent" />
                                        </div>
                                    )}

                                    <div className="flex-1 p-6 relative z-10 flex flex-col">
                                        <div className="flex items-start justify-between mb-auto">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => toggleModelSelection(t.id)}
                                                    className={cn(
                                                        "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                                                        selectedModels.includes(t.id) ? "bg-primary border-primary" : "bg-black/40 border-white/20 hover:border-white/40"
                                                    )}
                                                >
                                                    {selectedModels.includes(t.id) && <Check className="w-3.5 h-3.5 text-white" />}
                                                </button>
                                                <div className={cn(
                                                    "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5",
                                                    t.isPublished ? "bg-emerald-500/10 text-emerald-500" : "bg-orange-500/10 text-orange-500"
                                                )}>
                                                    {t.isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                                    {t.isPublished ? "Publicado" : "Rascunho"}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => { localStorage.setItem('studio_preselect_model', t.id); onModuleChange?.('admin_studio'); }} className="p-2 bg-primary/20 hover:bg-primary/30 rounded-lg text-primary transition-colors" title="Testar no Studio">
                                                    <Play className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => downloadWorkflow(t)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors" title="Baixar JSON">
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => startEdit(t)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors" title="Editar">
                                                    <Code className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(t.id)} className="p-2 bg-destructive/10 hover:bg-destructive/20 rounded-lg text-destructive transition-colors" title="Excluir">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <h4 className="text-lg font-black text-white mb-1">{t.name}</h4>
                                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black opacity-50 mb-4">
                                            Categoria: <span className="text-primary">
                                                {categories.find(c => c.id === t.categoryId)?.name || t.type}
                                            </span>
                                        </p>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-white/30">
                                                <span>Nó Prompt +</span>
                                                <span className="text-white/60">{t.mapping?.positivePromptNodeId || "❌"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="bg-[#0c0c0e] border border-white/10 rounded-3xl p-8 max-w-3xl mx-auto shadow-2xl">
                        <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
                            <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-3">
                                {editingTemplate?.id ? "Editar Template" : "Novo Template Global"}
                                {editingTemplate?.id && (
                                    <button onClick={() => { localStorage.setItem('studio_preselect_model', editingTemplate.id!); onModuleChange?.('admin_studio'); }} className="ml-2 py-1 px-3 bg-primary/20 hover:bg-primary/30 rounded-lg text-primary flex items-center gap-1.5 transition-all outline-none" title="Testar no Studio">
                                        <Play className="w-3.5 h-3.5 fill-primary" />
                                        <span className="text-[8px] uppercase font-black tracking-widest">Testar Modelo</span>
                                    </button>
                                )}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Publicar?</span>

                                {editingTemplate?.id && (
                                    <button
                                        onClick={() => downloadWorkflow(editingTemplate as ComfyWorkflow)}
                                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-all flex items-center gap-2"
                                        title="Baixar Workflow Atual"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        <span className="text-[8px] uppercase font-bold tracking-widest pr-1">Baixar JSON</span>
                                    </button>
                                )}

                                <button
                                    onClick={() => setEditingTemplate({ ...editingTemplate!, isPublished: !editingTemplate?.isPublished })}
                                    className={cn(
                                        "w-12 h-6 rounded-full transition-all relative flex items-center px-1",
                                        editingTemplate?.isPublished ? "bg-emerald-500" : "bg-white/10"
                                    )}
                                >
                                    <div className={cn(
                                        "w-4 h-4 rounded-full bg-white shadow-sm transition-transform",
                                        editingTemplate?.isPublished ? "translate-x-6" : "translate-x-0"
                                    )} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] uppercase font-black text-muted-foreground tracking-widest ml-1">Nome do Template</label>
                                    <input
                                        type="text"
                                        value={editingTemplate?.name || ""}
                                        onChange={e => setEditingTemplate({ ...editingTemplate!, name: e.target.value })}
                                        className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-1 focus:ring-primary outline-none transition-all"
                                        placeholder="Ex: Z-Image Realismo V1"
                                    />
                                </div>
                                <div className="space-y-1.5 flex-1 relative">
                                    <label className="text-[9px] uppercase font-black text-white/30 tracking-[0.2em] ml-1">Categoria (Dinâmica)</label>
                                    <button
                                        onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                                        onBlur={() => setTimeout(() => setIsCatDropdownOpen(false), 200)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:ring-1 focus:ring-primary outline-none text-left flex items-center justify-between"
                                    >
                                        <span className="uppercase font-black tracking-widest truncate">
                                            {categories.find(c => c.id === editingTemplate?.categoryId)?.name || "Sem Categoria"}
                                        </span>
                                        <ChevronDown className={cn("w-4 h-4 text-white/20 transition-transform", isCatDropdownOpen && "rotate-180")} />
                                    </button>

                                    {isCatDropdownOpen && (
                                        <div className="absolute top-full left-0 mt-2 w-full bg-[#111114] border border-white/10 rounded-xl shadow-2xl p-2 z-[200] max-h-48 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-2">
                                            <button
                                                onMouseDown={() => { setEditingTemplate({ ...editingTemplate!, categoryId: "" }); setIsCatDropdownOpen(false); }}
                                                className="w-full px-3 py-2.5 rounded-lg text-left text-[10px] uppercase font-black tracking-widest text-white/40 hover:bg-white/5 hover:text-white transition-all"
                                            >
                                                Sem Categoria
                                            </button>
                                            {categories.map(cat => (
                                                <button
                                                    key={cat.id}
                                                    onMouseDown={() => { setEditingTemplate({ ...editingTemplate!, categoryId: cat.id }); setIsCatDropdownOpen(false); }}
                                                    className={cn(
                                                        "w-full px-3 py-2.5 rounded-lg text-left text-[10px] uppercase font-black tracking-widest transition-all",
                                                        editingTemplate?.categoryId === cat.id ? "bg-primary/20 text-primary" : "text-white/70 hover:bg-white/5 hover:text-white"
                                                    )}
                                                >
                                                    {cat.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                <div className="space-y-1.5 flex-1 w-full">
                                    <label className="text-[9px] uppercase font-black text-primary tracking-widest ml-1">
                                        {editingTemplate?.providerType === "api" ? "ID Único da API (Código)" : "ID do Workflow (Comfy.icu)"}
                                    </label>
                                    <input
                                        type="text"
                                        value={editingTemplate?.id || ""}
                                        onChange={e => setEditingTemplate({ ...editingTemplate!, id: e.target.value })}
                                        className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-1 focus:ring-primary outline-none transition-all"
                                        placeholder="ID extraído ou cole aqui"
                                    />
                                </div>
                                <div className="space-y-1.5 flex-1 w-full">
                                    <label className="text-[9px] uppercase font-black text-muted-foreground tracking-widest ml-1">Motor de Execução</label>
                                    <select
                                        value={editingTemplate?.engine || "comfy_icu"}
                                        onChange={e => setEditingTemplate({ ...editingTemplate!, engine: e.target.value as any })}
                                        className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-1 focus:ring-primary outline-none transition-all"
                                    >
                                        <option value="comfy_icu">Comfy.icu (Padrão)</option>
                                        <option value="comfy_cloud">Comfy Cloud (Official/Org)</option>
                                        <option value="fal_ai">Fal.ai (High Speed)</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5 flex-1 w-full">
                                    <label className="text-[9px] uppercase font-black text-muted-foreground tracking-widest ml-1 flex justify-between">
                                        <span>Tipo do Modelo</span>
                                        {editingTemplate?.providerType === "api" && <span className="text-primary-foreground/50 lowercase italic">Advanced</span>}
                                    </label>
                                    <div className="flex bg-white/5 p-1 rounded-xl w-full border border-white/10">
                                        <button
                                            onClick={() => setEditingTemplate({ ...editingTemplate!, providerType: "workflow" })}
                                            className={cn("flex-1 px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", (!editingTemplate?.providerType || editingTemplate.providerType === "workflow") ? "bg-primary text-white" : "text-white/40 hover:text-white")}
                                        >
                                            Workflow
                                        </button>
                                        <button
                                            onClick={() => setEditingTemplate({ ...editingTemplate!, providerType: "api" })}
                                            className={cn("flex-1 px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", editingTemplate?.providerType === "api" ? "bg-primary text-white" : "text-white/40 hover:text-white")}
                                        >
                                            Code API
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5 flex-1 w-full mt-4">
                                <label className="text-[9px] uppercase font-black text-muted-foreground tracking-widest ml-1 flex items-center gap-2"><ImageIcon className="w-3 h-3" /> Foto do Modelo (Capa)</label>
                                <div className="relative group">
                                    <div className={cn(
                                        "w-full h-40 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 transition-all relative overflow-hidden",
                                        editingTemplate?.coverImageUrl ? "border-primary/30 bg-primary/5" : "border-white/10 bg-white/[0.02] hover:border-primary/40"
                                    )}>
                                        {editingTemplate?.coverImageUrl ? (
                                            <>
                                                <img src={editingTemplate.coverImageUrl} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                                <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                    <button
                                                        onClick={() => setEditingTemplate({ ...editingTemplate!, coverImageUrl: "" })}
                                                        className="p-2 bg-red-500 rounded-xl text-white shadow-xl hover:scale-110 active:scale-95 transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                {isUploadingCover ? (
                                                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                                                ) : (
                                                    <>
                                                        <Upload className="w-6 h-6 text-white/20" />
                                                        <div className="text-center">
                                                            <p className="text-xs font-bold text-white mb-1">Clique ou Arraste a Foto</p>
                                                            <p className="text-[8px] uppercase tracking-widest text-muted-foreground font-black opacity-50">PNG, JPG ou WebP</p>
                                                        </div>
                                                    </>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleCoverUpload}
                                                    disabled={isUploadingCover}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                            </>
                                        )}
                                    </div>
                                    {editingTemplate?.coverImageUrl && (
                                        <div className="mt-2">
                                            <input
                                                type="text"
                                                value={editingTemplate.coverImageUrl}
                                                onChange={e => setEditingTemplate({ ...editingTemplate!, coverImageUrl: e.target.value })}
                                                className="w-full bg-transparent border-b border-white/5 px-2 py-1 text-[8px] text-white/20 outline-none hover:text-white/40 transition-colors"
                                                placeholder="Ou cole o link aqui..."
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>



                            <div className="space-y-1.5">
                                <label className="text-[9px] uppercase font-black text-muted-foreground tracking-widest ml-1 flex items-center justify-between">
                                    <span>JSON (API Format)</span>
                                    {parsedNodes && <span className="text-emerald-500 flex items-center gap-1"><Check className="w-3 h-3" /> Parse OK</span>}
                                </label>
                                <div className="relative group">
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleFileUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className={cn(
                                        "w-full border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all",
                                        parsedNodes ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/10 bg-white/[0.02] bg-white/[0.05] group-hover:border-primary/40"
                                    )}>
                                        <Upload className={cn("w-6 h-6", parsedNodes ? "text-emerald-500" : "text-white/20")} />
                                        <div className="text-center">
                                            <p className="text-xs font-bold text-white mb-1">
                                                {editingTemplate?.rawJson ? "Workflow Importado ✔️" : "Clique ou arraste o arquivo JSON (API)"}
                                            </p>
                                            <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-black opacity-50">API Format Exported only</p>
                                        </div>
                                    </div>
                                </div>
                                {error && <p className="text-destructive text-[10px] uppercase font-black tracking-widest text-center mt-2">{error}</p>}
                            </div>

                            {parsedNodes && (
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                                    <h4 className="text-[10px] font-black uppercase text-primary tracking-widest pb-2 border-b border-white/5">Mapeamento Técnico de Nós</h4>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Mapeamentos básicos baseados em IDs */}
                                        <div className="space-y-4">
                                            {[
                                                { label: "Nó Saída Principal", key: "outputNodeId" },
                                                { label: "Nó Prompt Positivo", key: "positivePromptNodeId" },
                                                { label: "Nó Prompt Negativo", key: "negativePromptNodeId" },
                                                { label: "Nó Resolução (W/H)", key: "widthNodeId" },
                                                { label: "Nó Imagem Origem", key: "baseImageNodeId" },
                                            ].map(m => (
                                                <div key={m.key} className="space-y-1.5 relative">
                                                    <label className="text-[8px] font-black uppercase text-white/40 tracking-widest ml-1">{m.label}</label>
                                                    <button
                                                        onClick={() => setOpenMappingDropdown(openMappingDropdown === m.key ? null : m.key)}
                                                        onBlur={() => setTimeout(() => setOpenMappingDropdown(null), 200)}
                                                        className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-[10px] font-bold text-white flex items-center justify-between hover:border-white/20 transition-all text-left"
                                                    >
                                                        <span className="truncate">
                                                            {//@ts-ignore
                                                                editingTemplate?.mapping?.[m.key]
                                                                    //@ts-ignore
                                                                    ? `Nó ${editingTemplate.mapping[m.key]} [${parsedNodes[editingTemplate.mapping[m.key]]?.class_type || '?'}]`
                                                                    : "Não mapeado"}
                                                        </span>
                                                        <ChevronDown className="w-3 h-3 opacity-30" />
                                                    </button>

                                                    {openMappingDropdown === m.key && (
                                                        <div className="absolute top-full left-0 mt-1 w-full bg-[#16161a] border border-white/10 rounded-lg shadow-xl p-1 z-[210] max-h-40 overflow-y-auto no-scrollbar">
                                                            <button
                                                                //@ts-ignore
                                                                onMouseDown={() => { setEditingTemplate({ ...editingTemplate!, mapping: { ...editingTemplate?.mapping!, [m.key]: "" } }); setOpenMappingDropdown(null); }}
                                                                className="w-full px-2 py-1.5 rounded text-left text-[9px] font-black uppercase tracking-widest text-white/30 hover:bg-white/5 transition-all"
                                                            >
                                                                Não mapeado
                                                            </button>
                                                            {Object.entries(parsedNodes).map(([id, node]) => (
                                                                <button
                                                                    key={id}
                                                                    //@ts-ignore
                                                                    onMouseDown={() => { setEditingTemplate({ ...editingTemplate!, mapping: { ...editingTemplate?.mapping!, [m.key]: id } }); setOpenMappingDropdown(null); }}
                                                                    className={cn(
                                                                        "w-full px-2 py-1.5 rounded text-left text-[9px] font-black uppercase tracking-widest transition-all",
                                                                        //@ts-ignore
                                                                        editingTemplate?.mapping?.[m.key] === id ? "bg-primary/20 text-primary" : "text-white/60 hover:bg-white/5 hover:text-white"
                                                                    )}
                                                                >
                                                                    Nó {id} [{node.class_type}]
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-4 pt-2 border-l border-white/5 pl-6">
                                            <h4 className="text-[10px] font-black uppercase text-primary tracking-[0.2em] pb-1 border-b border-white/5">Configurações de Prompt</h4>

                                            <div className="flex items-center justify-between bg-white/[0.03] p-3 rounded-xl border border-white/5">
                                                <div className="space-y-0.5">
                                                    <span className="text-[9px] font-black uppercase text-white/70 tracking-widest block">Prompt Obrigatório?</span>
                                                    <p className="text-[7px] text-muted-foreground uppercase font-bold tracking-tight">O usuário deve digitar algo?</p>
                                                </div>
                                                <button
                                                    onClick={() => setEditingTemplate({
                                                        ...editingTemplate!,
                                                        mapping: { ...editingTemplate?.mapping!, promptRequired: !editingTemplate?.mapping?.promptRequired }
                                                    })}
                                                    className={cn(
                                                        "w-10 h-5 rounded-full transition-all relative flex items-center px-1",
                                                        editingTemplate?.mapping?.promptRequired ? "bg-primary" : "bg-white/10"
                                                    )}
                                                >
                                                    <div className={cn("w-3.5 h-3.5 bg-white rounded-full transition-all", editingTemplate?.mapping?.promptRequired ? "translate-x-4.5" : "translate-x-0")} />
                                                </button>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[8px] font-black uppercase text-white/40 tracking-widest ml-1">Placeholder do Input</label>
                                                <input
                                                    type="text"
                                                    value={editingTemplate?.mapping?.promptPlaceholder || ""}
                                                    onChange={e => setEditingTemplate({
                                                        ...editingTemplate!,
                                                        mapping: { ...editingTemplate?.mapping!, promptPlaceholder: e.target.value }
                                                    })}
                                                    className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-[10px] font-bold text-white outline-none focus:border-primary/50 transition-all"
                                                    placeholder="Ex: Descreva a foto..."
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-2">
                                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                                <h4 className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">Inputs de Imagem (Uploads)</h4>
                                                <button
                                                    onClick={() => {
                                                        const current = editingTemplate?.mapping?.imageInputs || []
                                                        setEditingTemplate({
                                                            ...editingTemplate!,
                                                            mapping: { ...editingTemplate?.mapping!, imageInputs: [...current, { label: `Imagem ${current.length + 1}`, nodeId: "" }] }
                                                        })
                                                    }}
                                                    className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest"
                                                >
                                                    <Plus className="w-3 h-3" /> Adicionar
                                                </button>
                                            </div>
                                            {(editingTemplate?.mapping?.imageInputs || []).map((input, idx) => (
                                                <div key={idx} className="flex gap-2 items-end bg-white/5 p-3 rounded-xl border border-white/5">
                                                    <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                                        <input
                                                            type="text"
                                                            value={input.label}
                                                            onChange={e => {
                                                                const newList = [...(editingTemplate?.mapping?.imageInputs || [])]
                                                                newList[idx].label = e.target.value
                                                                setEditingTemplate({ ...editingTemplate!, mapping: { ...editingTemplate?.mapping!, imageInputs: newList } })
                                                            }}
                                                            className="w-full bg-background border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-white outline-none"
                                                            placeholder="Label"
                                                        />
                                                    </div>
                                                    <div className="flex-[1.5] space-y-1">
                                                        <select
                                                            value={input.nodeId}
                                                            onChange={e => {
                                                                const newList = [...(editingTemplate?.mapping?.imageInputs || [])]
                                                                newList[idx].nodeId = e.target.value
                                                                setEditingTemplate({ ...editingTemplate!, mapping: { ...editingTemplate?.mapping!, imageInputs: newList } })
                                                            }}
                                                            className="w-full bg-background border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-white outline-none"
                                                        >
                                                            <option value="">Nó Alvo</option>
                                                            {Object.entries(parsedNodes).map(([id, node]) => (
                                                                //@ts-ignore
                                                                <option key={id} value={id}>Nó {id} [{node.class_type}]</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const newList = (editingTemplate?.mapping?.imageInputs || []).filter((_, i) => i !== idx)
                                                            setEditingTemplate({ ...editingTemplate!, mapping: { ...editingTemplate?.mapping!, imageInputs: newList } })
                                                        }}
                                                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Parameter Inputs */}
                                        <div className="space-y-4 pt-2 border-t border-white/5 mt-4">
                                            <div className="flex items-center justify-between pb-2">
                                                <h4 className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">Parâmetros Extras</h4>
                                                <button
                                                    onClick={() => {
                                                        const current = editingTemplate?.mapping?.parameterInputs || []
                                                        setEditingTemplate({
                                                            ...editingTemplate!,
                                                            mapping: { ...editingTemplate?.mapping!, parameterInputs: [...current, { nodeId: "", field: "", label: "Novo Ajuste", type: "text" }] }
                                                        })
                                                    }}
                                                    className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest"
                                                >
                                                    <Plus className="w-3 h-3" /> Adicionar
                                                </button>
                                            </div>
                                            {(editingTemplate?.mapping?.parameterInputs || []).map((param, idx) => (
                                                <div key={idx} className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-3">
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={param.label}
                                                            onChange={e => {
                                                                const newList = [...(editingTemplate?.mapping?.parameterInputs || [])]
                                                                newList[idx].label = e.target.value
                                                                setEditingTemplate({ ...editingTemplate!, mapping: { ...editingTemplate?.mapping!, parameterInputs: newList } })
                                                            }}
                                                            className="flex-1 bg-background border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-white outline-none"
                                                            placeholder="Label"
                                                        />
                                                        <select
                                                            value={param.type}
                                                            onChange={e => {
                                                                const newList = [...(editingTemplate?.mapping?.parameterInputs || [])]
                                                                newList[idx].type = e.target.value as any
                                                                setEditingTemplate({ ...editingTemplate!, mapping: { ...editingTemplate?.mapping!, parameterInputs: newList } })
                                                            }}
                                                            className="w-[80px] bg-background border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-white outline-none"
                                                        >
                                                            <option value="text">TXT</option>
                                                            <option value="number">NUM</option>
                                                            <option value="boolean">CHK</option>
                                                            <option value="select">SEL</option>
                                                        </select>
                                                        <button
                                                            onClick={() => {
                                                                const newList = (editingTemplate?.mapping?.parameterInputs || []).filter((_, i) => i !== idx)
                                                                setEditingTemplate({ ...editingTemplate!, mapping: { ...editingTemplate?.mapping!, parameterInputs: newList } })
                                                            }}
                                                            className="p-2 text-destructive"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <select
                                                            value={param.nodeId}
                                                            onChange={e => {
                                                                const newList = [...(editingTemplate?.mapping?.parameterInputs || [])]
                                                                newList[idx].nodeId = e.target.value
                                                                setEditingTemplate({ ...editingTemplate!, mapping: { ...editingTemplate?.mapping!, parameterInputs: newList } })
                                                            }}
                                                            className="flex-1 bg-background border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-white outline-none"
                                                        >
                                                            <option value="">Nó</option>
                                                            {Object.entries(parsedNodes).map(([id, node]) => (
                                                                //@ts-ignore
                                                                <option key={id} value={id}>Nó {id} [{node.class_type}]</option>
                                                            ))}
                                                        </select>
                                                        <select
                                                            value={param.field}
                                                            onChange={e => {
                                                                const newList = [...(editingTemplate?.mapping?.parameterInputs || [])]
                                                                newList[idx].field = e.target.value
                                                                setEditingTemplate({ ...editingTemplate!, mapping: { ...editingTemplate?.mapping!, parameterInputs: newList } })
                                                            }}
                                                            className="flex-1 bg-background border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-white outline-none"
                                                        >
                                                            <option value="">Campo</option>
                                                            {param.nodeId && parsedNodes[param.nodeId] && Object.keys(parsedNodes[param.nodeId].inputs).map(fieldName => (
                                                                <option key={fieldName} value={fieldName}>{fieldName}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-4 pt-6 mt-6 border-t border-white/10">
                                <button
                                    onClick={() => { setView("list"); setEditingTemplate(null) }}
                                    className="flex-1 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-white transition-all bg-white/5"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={!editingTemplate?.name || !parsedNodes}
                                    className="flex-[2] bg-primary text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/20 disabled:opacity-50"
                                >
                                    <Save className="w-5 h-5" />
                                    Salvar Atributos do Template
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {/* Modal de Gerenciamento de Categorias */}
            {
                isCategoryModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                        <div className="bg-[#0c0c0e] border border-white/10 w-full max-w-4xl max-h-[80vh] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
                            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Categorias de Modelos</h3>
                                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mt-1 opacity-50">Organize os workflows do Studio AI</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => {
                                            setEditingCategory({ name: "", icon: "Sparkles", order: 0 })
                                            setIsCategoryEditorOpen(true)
                                        }}
                                        className="bg-primary text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                                    >
                                        <Plus className="w-3 h-3" /> Nova
                                    </button>
                                    <button onClick={() => setIsCategoryModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-muted-foreground hover:text-white transition-all">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 [&::-webkit-scrollbar]:hidden">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {categories.map((cat) => {
                                        const Icon = getIconComponent(cat.icon)
                                        return (
                                            <div key={cat.id} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 group hover:border-primary/50 transition-all flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-all">
                                                        <Icon className="w-5 h-5 text-white group-hover:text-primary transition-all" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-black text-white uppercase tracking-tight">{cat.name}</h4>
                                                        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Ordem: {cat.order}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => { setEditingCategory(cat); setIsCategoryEditorOpen(true); }} className="p-2 hover:bg-white/5 rounded-lg text-muted-foreground hover:text-white"><Edit2 className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-muted-foreground hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Editor de Categoria (Sub-modal) */}
                        {isCategoryEditorOpen && (
                            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
                                <div className="bg-[#0c0c0e] border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
                                    <div className="p-6 border-b border-white/5">
                                        <h4 className="text-sm font-black text-white uppercase tracking-widest">{editingCategory?.id ? "Editar" : "Criar"} Categoria</h4>
                                        {categoryError && <p className="text-red-500 text-[9px] uppercase font-bold mt-1 animate-pulse">{categoryError}</p>}
                                    </div>
                                    <div className="p-6 space-y-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest block ml-1">Nome</label>
                                            <input
                                                type="text"
                                                value={editingCategory?.name || ""}
                                                onChange={e => setEditingCategory({ ...editingCategory!, name: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:ring-1 focus:ring-primary outline-none"
                                                placeholder="Ex: Editorial"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest block ml-1">Ordem</label>
                                            <input
                                                type="number"
                                                value={editingCategory?.order || 0}
                                                onChange={e => setEditingCategory({ ...editingCategory!, order: parseInt(e.target.value) || 0 })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:ring-1 focus:ring-primary outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest block ml-1 mb-2">Ícone</label>
                                            <div className="grid grid-cols-5 gap-2">
                                                {AVAILABLE_ICONS.map((item) => {
                                                    const Icon = item.icon;
                                                    const isSelected = editingCategory?.icon === item.name;
                                                    return (
                                                        <button
                                                            key={item.name}
                                                            onClick={() => setEditingCategory({ ...editingCategory!, icon: item.name })}
                                                            className={cn(
                                                                "aspect-square rounded-lg flex items-center justify-center border transition-all",
                                                                isSelected ? "bg-primary border-primary text-white" : "bg-white/5 border-white/5 text-muted-foreground hover:border-white/20"
                                                            )}
                                                        >
                                                            <Icon className="w-4 h-4" />
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-white/[0.02] border-t border-white/5 flex gap-3">
                                        <button onClick={() => setIsCategoryEditorOpen(false)} className="flex-1 px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest text-white hover:bg-white/5 transition-all">Cancelar</button>
                                        <button onClick={handleSaveCategory} className="flex-1 bg-primary text-white px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all">Salvar</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )
            }

            {/* Modal de Confirmação Customizado */}
            {confirmDialog.isOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-[#0b0b0d] w-full max-w-sm rounded-[2.5rem] p-8 border border-white/10 shadow-2xl animate-in zoom-in duration-300">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                                <Trash2 className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-white font-black uppercase text-sm tracking-[0.3em] mb-3">{confirmDialog.title || "Confirmar Ação"}</h3>
                            <p className="text-muted-foreground text-[10px] leading-relaxed uppercase font-bold tracking-widest">{confirmDialog.message}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setConfirmDialog(p => ({ ...p, isOpen: false }))}
                                className="py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDialog.onConfirm}
                                className="py-4 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                            >
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    )
}
