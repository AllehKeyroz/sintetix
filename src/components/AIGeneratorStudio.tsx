"use client"

import { useState, useEffect, useRef } from "react"
import { Sparkles, Camera, Shirt, MapPin, Wand2, Download, Loader2, Settings, X, Activity, Trash2, CheckCircle2, MessageSquare, Plus, Maximize2, User, Image, Palette, Zap, LayoutGrid, Copy, Check, RefreshCcw, ChevronLeft, ChevronRight } from "lucide-react"
import { addGeneratedImageToGallery } from "@/lib/gallery_actions"
import { ComfyWorkflow, ComfyNode, ModelCategory, ComfyWorkflowJson, ComfyParameter } from "@/types/comfy"
import { StudioSettingsModal } from "./StudioSettingsModal"
import { useStudioChats } from "@/hooks/useFirebase"
import { createStudioChat, updateStudioChat, deleteStudioChat, getStudioChat } from "@/lib/studio_actions"
import { downloadFileToClient } from "@/lib/downloadFile"
import { ImageViewerModal } from "./ImageViewerModal"
import { GalleryPickerModal } from "./GalleryPickerModal"
import { storage } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { motion, AnimatePresence } from "framer-motion"
import { listWorkflowTemplates, listModelCategories } from "@/lib/admin_actions"
import { dispatchComfyRun, dispatchComfyStatus } from "@/lib/comfy_dispatcher"

// Helper para remover undefined antes de persistir no Firebase
const sanitizeForFirebase = (data: any): any => {
    if (Array.isArray(data)) return data.map(sanitizeForFirebase);
    if (data !== null && typeof data === 'object') {
        const sanitized: any = {};
        Object.keys(data).forEach(key => {
            const val = sanitizeForFirebase(data[key]);
            if (val !== undefined) sanitized[key] = val;
        });
        return sanitized;
    }
    return data;
};

interface AIStudioProps {
    influencerId: string | null
    isAdminMode?: boolean
}

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

export function AIGeneratorStudio({ influencerId, isAdminMode = false }: AIStudioProps) {
    const { profile, user } = useAuth()
    const [activeTab, setActiveTab] = useState<string>("generate")
    const [dynamicCategories, setDynamicCategories] = useState<ModelCategory[]>([])
    const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false)
    const modelSelectorRef = useRef<HTMLDivElement>(null)
    const ratioSelectorRef = useRef<HTMLDivElement>(null)

    // Fechar dropdowns ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modelSelectorRef.current && !modelSelectorRef.current.contains(event.target as Node)) {
                setIsModelSelectorOpen(false);
            }
            if (ratioSelectorRef.current && !ratioSelectorRef.current.contains(event.target as Node)) {
                setIsRatioDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Estados do Gerador
    const [prompt, setPrompt] = useState("")
    const [negativePrompt, setNegativePrompt] = useState("")
    const [width, setWidth] = useState("1024")
    const [height, setHeight] = useState("1024")
    const [history, setHistory] = useState<{ id: string, url: string | null, urls?: string[], prompt: string, negativePrompt?: string, model: string, size: string, isLoading: boolean, error: string | null, cost?: number, duration?: number }[]>([])
    const [errorMsg, setErrorMsg] = useState("")


    // Modal de Confirmação Customizado
    const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean, message: string, onConfirm: () => void }>({ isOpen: false, message: "", onConfirm: () => { } })

    // Seletor da Galeria
    const [pickingGalleryForNode, setPickingGalleryForNode] = useState<string | null>(null)

    const [viewerUrl, setViewerUrl] = useState<string | null>(null);
    const effectiveInfluencerId = isAdminMode ? "admin_test_studio" : (influencerId || "");
    const { chats } = useStudioChats(effectiveInfluencerId);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const historyRef = useRef(history);
    const chatIdRef = useRef(activeChatId);
    const pollIntervalsRef = useRef<Record<string, NodeJS.Timeout>>({});

    useEffect(() => { historyRef.current = history; }, [history]);
    useEffect(() => { chatIdRef.current = activeChatId; }, [activeChatId]);

    const saveHistory = async (newHist: any[]) => {
        setHistory(newHist);
        if (chatIdRef.current && effectiveInfluencerId) {
            const sanitized = sanitizeForFirebase(newHist);
            await updateStudioChat(effectiveInfluencerId, chatIdRef.current, sanitized).catch(e => {
                console.error("Erro ao salvar histórico:", e);
            });
        }
    }

    const handleNewChat = () => {
        setActiveChatId(null);
        setHistory([]);
    }

    const handleSelectChat = (chat: any) => {
        setActiveChatId(chat.id);
        setHistory(chat.history || []);
    }
    const handleDeleteChat = (id: string) => {
        setConfirmDialog({
            isOpen: true,
            message: "Tem certeza que deseja excluir este chat? Todo o histórico de geração abaixo dele será perdido permanentemente.",
            onConfirm: async () => {
                setConfirmDialog(p => ({ ...p, isOpen: false }));
                await deleteStudioChat(effectiveInfluencerId, id);
                if (activeChatId === id) handleNewChat();
            }
        });
    }

    const handleDeleteItem = (id: string) => {
        setConfirmDialog({
            isOpen: true,
            message: "Excluir esta geração específica? O registro será apagado deste histórico.",
            onConfirm: () => {
                setConfirmDialog(p => ({ ...p, isOpen: false }));
                saveHistory(historyRef.current.filter(item => item.id !== id));
            }
        });
    }

    const handleDeleteSubAsset = (itemId: string, urlToDelete: string) => {
        setConfirmDialog({
            isOpen: true,
            message: "Tem certeza que deseja excluir esta foto específica do pacote de gerações?",
            onConfirm: () => {
                setConfirmDialog(p => ({ ...p, isOpen: false }));
                const newHistory = historyRef.current.map(item => {
                    if (item.id === itemId && item.urls) {
                        const newUrls = item.urls.filter(u => u !== urlToDelete);
                        return { ...item, urls: newUrls };
                    }
                    return item;
                });
                saveHistory(newHistory);
            }
        });
    }

    const handleCancelGeneration = (id: string) => {
        // Stop the polling timer if it exists.
        if (pollIntervalsRef.current[id]) {
            clearInterval(pollIntervalsRef.current[id]);
            delete pollIntervalsRef.current[id];
        }

        // Always update the visual state to "cancelled" regardless of polling state.
        if (chatIdRef.current && effectiveInfluencerId) {
            updateStudioChat(effectiveInfluencerId, chatIdRef.current, historyRef.current.map(item =>
                item.id === id ? { ...item, isLoading: false, error: "Cancelado pelo usuário." } : item
            )).catch(console.error);

            setHistory(historyRef.current.map(item =>
                item.id === id ? { ...item, isLoading: false, error: "Cancelado pelo usuário." } : item
            ));
        }
    }

    const [aspectRatio, setAspectRatio] = useState("1:1");
    const ASPECT_RATIOS = [
        { label: "1:1", w: 1024, h: 1024 },
        { label: "16:9", w: 1280, h: 720 },
        { label: "9:16", w: 720, h: 1280 },
        { label: "4:3", w: 1024, h: 768 },
        { label: "3:4", w: 768, h: 1024 }
    ];

    const [workflows, setWorkflows] = useState<ComfyWorkflow[]>([])
    const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>("")
    const [isRatioDropdownOpen, setIsRatioDropdownOpen] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    useEffect(() => {
        async function loadData() {
            try {
                const cats = await listModelCategories()
                setDynamicCategories(cats)
                if (cats.length > 0 && activeTab === "generate") {
                    setActiveTab(cats[0].id)
                }
                const cloudWorkflows = await listWorkflowTemplates(!isAdminMode)
                setWorkflows([...cloudWorkflows])
            } catch (err) {
                console.error("Erro ao carregar dados do Studio:", err)
            }
        }
        loadData()
    }, [isAdminMode])

    useEffect(() => {
        const preselectId = localStorage.getItem('studio_preselect_model');
        if (preselectId && workflows.length > 0) {
            const wf = workflows.find(w => w.id === preselectId);
            if (wf) {
                setActiveTab(wf.categoryId || wf.type);
                setSelectedWorkflowId(wf.id);
            }
            localStorage.removeItem('studio_preselect_model');
            return; // Previne que o fallback sobrescreva a seleção logo após
        }

        const available = workflows.filter(w => w.categoryId === activeTab || w.type === activeTab)
        if (available.length > 0 && !workflows.find(w => w.id === selectedWorkflowId && (w.categoryId === activeTab || w.type === activeTab))) {
            setSelectedWorkflowId(available[0].id)
        } else if (available.length === 0) {
            setSelectedWorkflowId("")
        }
    }, [workflows, activeTab, selectedWorkflowId])

    const [imageInputs, setImageInputs] = useState<Record<string, { file: File | null, url: string | null }>>({})
    const [extraParams, setExtraParams] = useState<Record<string, any>>({})

    useEffect(() => {
        const workflow = workflows.find(w => w.id === selectedWorkflowId)
        if (workflow) {
            const imgInitial: Record<string, any> = {}

            // 1. Adicionar o Nó de Origem (Principal) se mapeado
            if (workflow.mapping?.baseImageNodeId) {
                imgInitial[workflow.mapping.baseImageNodeId] = { file: null, url: null }
            }

            // 2. Adicionar os demais inputs da lista
            workflow.mapping?.imageInputs?.forEach(input => {
                imgInitial[input.nodeId] = { file: null, url: null }
            })

            setImageInputs(imgInitial)
            const paramInitial: Record<string, any> = {}
            workflow.mapping?.parameterInputs?.forEach(param => {
                const key = `${param.nodeId}-${param.field}`
                paramInitial[key] = param.defaultValue ?? (param.type === "boolean" ? false : param.type === "number" ? 0 : "")
            })
            setExtraParams(paramInitial)
        } else {
            setImageInputs({})
            setExtraParams({})
        }
    }, [selectedWorkflowId, workflows])

    const handleRetryGeneration = (item: any) => {
        // Restaurar estado
        setPrompt(item.prompt === "Uso de Ferramenta (Sem prompt)" ? "" : item.prompt);
        setNegativePrompt(item.negativePrompt || "");
        // O id do workflow precisa bater com o nome. Uma forma mais inteligente de achar
        const wf = workflows.find(w => w.name === item.model);
        if (wf) {
            setSelectedWorkflowId(wf.id);
            setActiveTab(wf.categoryId || wf.type);
            // Poderíamos tentar restaurar imagens/parâmetros, mas demandaria armazená-los no item de histórico.
            // Pelo menos o prompt e o modelo já vão direto, só rodar denovo.
        } else {
            setErrorMsg("O modelo usado para esta imagem não está mais disponível.");
        }
    }

    const handleSelectModel = (modelName: string) => {
        const wf = workflows.find(w => w.name === modelName);
        if (wf) {
            setSelectedWorkflowId(wf.id);
            setActiveTab(wf.categoryId || wf.type);
            window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll para cima opcional para feedback
        } else {
            setErrorMsg("Este modelo não está mais disponível.");
        }
    }

    const getWorkflowDefaultPrompt = (workflow?: ComfyWorkflow) => {
        if (!workflow || !workflow.rawJson) return null;
        try {
            const baseJson = JSON.parse(workflow.rawJson);
            const workflowJson = baseJson.output || baseJson;
            const mapping = workflow.mapping || {};

            if (mapping.positivePromptNodeId && workflowJson[mapping.positivePromptNodeId]) {
                const node = workflowJson[mapping.positivePromptNodeId];
                if (node.inputs) {
                    const promptFields = ['text', 'prompt', 'instruction', 'caption'];
                    for (const f of promptFields) {
                        if (node.inputs.hasOwnProperty(f) && typeof node.inputs[f] === 'string' && node.inputs[f].trim() !== "") {
                            return node.inputs[f];
                        }
                    }
                }
            }
        } catch (e) {
            return null;
        }
        return null;
    };

    const getWorkflowDefaultNegativePrompt = (workflow?: ComfyWorkflow) => {
        if (!workflow || !workflow.rawJson) return null;
        try {
            const baseJson = JSON.parse(workflow.rawJson);
            const workflowJson = baseJson.output || baseJson;
            const mapping = workflow.mapping || {};

            if (mapping.negativePromptNodeId && workflowJson[mapping.negativePromptNodeId]) {
                const node = workflowJson[mapping.negativePromptNodeId];
                if (node.inputs) {
                    const negFields = ['text', 'prompt', 'negative_prompt', 'negative'];
                    for (const f of negFields) {
                        if (node.inputs.hasOwnProperty(f) && typeof node.inputs[f] === 'string' && node.inputs[f].trim() !== "") {
                            return node.inputs[f];
                        }
                    }
                }
            }
        } catch (e) {
            return null;
        }
        return null;
    };

    const handleGenerate = async (overridePrompt?: string | React.MouseEvent | React.KeyboardEvent, overrideNegativePrompt?: string) => {
        const finalPrompt = typeof overridePrompt === 'string' ? overridePrompt : prompt;
        const finalNegativePrompt = typeof overrideNegativePrompt === 'string' ? overrideNegativePrompt : negativePrompt;
        const currentWorkflow = workflows.find(w => w.id === selectedWorkflowId)
        if (!currentWorkflow) {
            setErrorMsg("Selecione um 'Modelo' de IA primeiro.")
            return
        }

        const hasImages = Object.values(imageInputs).some(img => img.file || img.url)
        const hasParams = Object.values(extraParams).some(val => val !== "" && val !== 0 && val !== false)

        const defaultPromptText = getWorkflowDefaultPrompt(currentWorkflow);
        const defaultNegativePromptText = getWorkflowDefaultNegativePrompt(currentWorkflow);

        if (!finalPrompt.trim() && !hasImages && !hasParams) {
            if (defaultPromptText) {
                setConfirmDialog({
                    isOpen: true,
                    message: `Você não digitou nenhum prompt. Deseja utilizar o prompt de referência deste modelo?\n\n"${defaultPromptText}"`,
                    onConfirm: () => {
                        setConfirmDialog(p => ({ ...p, isOpen: false }));
                        setPrompt(defaultPromptText);
                        handleGenerate(defaultPromptText, finalNegativePrompt);
                    }
                });
                return;
            }
            setErrorMsg("Digite um prompt ou forneça uma imagem/parâmetro.");
            return;
        }

        if (currentWorkflow.mapping?.promptRequired && !finalPrompt.trim()) {
            if (defaultPromptText) {
                setConfirmDialog({
                    isOpen: true,
                    message: `Este modelo exige um prompt. Deseja utilizar o padrão?\n\n"${defaultPromptText}"`,
                    onConfirm: () => {
                        setConfirmDialog(p => ({ ...p, isOpen: false }));
                        setPrompt(defaultPromptText);
                        handleGenerate(defaultPromptText, finalNegativePrompt);
                    }
                });
                return;
            }
            setErrorMsg("Este modelo exige que você digite um prompt para funcionar.");
            return;
        }

        if (!finalNegativePrompt.trim() && defaultNegativePromptText) {
            setConfirmDialog({
                isOpen: true,
                message: `Você também não digitou um prompt negativo. Deseja utilizar o padrão deste modelo?\n\n"${defaultNegativePromptText}"`,
                onConfirm: () => {
                    setConfirmDialog(p => ({ ...p, isOpen: false }));
                    setNegativePrompt(defaultNegativePromptText);
                    handleGenerate(finalPrompt, defaultNegativePromptText);
                }
            });
            return;
        }

        const targetInfluencerId = effectiveInfluencerId;
        if (!targetInfluencerId) {
            setErrorMsg("Nenhum talento ou contexto de teste selecionado.");
            return;
        }

        let targetId = activeChatId;
        const currentPrompt = finalPrompt || "Geração técnica"
        const currentSize = `${width}x${height}`
        const currentModel = currentWorkflow.name

        setErrorMsg("")
        setPrompt("")

        if (!targetId) {
            const title = currentPrompt.substring(0, 30) + (currentPrompt.length > 30 ? "..." : "");
            targetId = await createStudioChat(targetInfluencerId, title);
            setActiveChatId(targetId);
            chatIdRef.current = targetId;
        }

        const targetChatId = targetId!;
        const newItemId = Date.now().toString()
        const newItem = {
            id: newItemId,
            url: null,
            urls: [],
            prompt: currentPrompt,
            negativePrompt: finalNegativePrompt,
            model: currentModel,
            size: currentSize,
            isLoading: true,
            error: null,
            cost: 0,
            duration: 0
        }

        const updateChatState = async (chatToUpdate: string, updateFn: (hist: any[]) => any[]) => {
            if (chatIdRef.current === chatToUpdate) {
                setHistory(prev => updateFn(prev));
            }
            try {
                const refreshedChat = await getStudioChat(targetInfluencerId, chatToUpdate) as any;
                if (refreshedChat) {
                    const newHist = updateFn(refreshedChat.history || []);
                    const sanitized = sanitizeForFirebase(newHist);
                    await updateStudioChat(targetInfluencerId, chatToUpdate, sanitized);
                }
            } catch (e) {
                console.error("Falha ao persistir chat state:", e);
            }
        }

        await updateChatState(targetChatId, (prev) => [...prev, newItem]);

        setTimeout(() => {
            const bottom = document.getElementById('chat-bottom')
            if (bottom) bottom.scrollIntoView({ behavior: 'smooth' })
        }, 100)

        try {
            const promptJson: ComfyWorkflowJson = JSON.parse(currentWorkflow.rawJson);
            const mapping = currentWorkflow.mapping;

            if (mapping?.positivePromptNodeId && promptJson[mapping.positivePromptNodeId]) {
                promptJson[mapping.positivePromptNodeId].inputs.text = finalPrompt;
            }
            if (mapping?.negativePromptNodeId && promptJson[mapping.negativePromptNodeId]) {
                promptJson[mapping.negativePromptNodeId].inputs.text = finalNegativePrompt;
            }

            // Extra Parameters
            if (mapping?.parameterInputs) {
                mapping.parameterInputs.forEach(param => {
                    const key = `${param.nodeId}-${param.field}`;
                    const val = extraParams[key];
                    if (val !== undefined && promptJson[param.nodeId] && promptJson[param.nodeId].inputs) {
                        promptJson[param.nodeId].inputs[param.field] = val;
                    }
                });
            }

            // O envio para o motor selecionado
            const runResp = await dispatchComfyRun(currentWorkflow.engine, currentWorkflow.id, promptJson);

            // Polling com Loop para maior estabilidade e captura de erros
            let pollCount = 0;
            let isDone = false;

            while (!isDone) {
                pollCount++;
                if (pollCount > 150) { // ~5 minutos (150 * 2s)
                    throw new Error("Timeout: A geração demorou mais de 5 minutos.");
                }

                const statusResp = await dispatchComfyStatus(currentWorkflow.engine, currentWorkflow.id, runResp.id);
                
                // Log para debug em desenvolvimento
                console.log(`[Studio] Polling ${pollCount} - Status: ${statusResp.status}`, statusResp.error || "");

                if (statusResp.status === "COMPLETED") {
                    const outputs = statusResp.outputs;
                    let imgUrls: string[] = [];

                    // Extrator universal de URLs
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
                    imgUrls = rawUrls.filter(u => u.match(/\.(png|jpe?g|webp|gif|mp4)(\?.*)?$/i));

                    if (imgUrls.length === 0) {
                        const fallbackUrls = rawUrls.filter(u => !u.includes('thumbnail'));
                        if (fallbackUrls.length > 0) imgUrls = [fallbackUrls[0]];
                    }

                    if (imgUrls.length === 0) {
                        throw new Error("Sucesso na geração, mas nenhuma saída válida foi localizada.");
                    }

                    await updateChatState(targetChatId, (prev) =>
                        prev.map(item => item.id === newItemId ? {
                            ...item,
                            isLoading: false,
                            url: imgUrls[0],
                            urls: imgUrls,
                            error: null
                        } : item)
                    );
                    isDone = true; // Finaliza o loop
                } else if (statusResp.status === "FAILED" || statusResp.status === "CANCELLED") {
                    // Captura o erro detalhado se existir, senão usa o status
                    const errorMsg = statusResp.error || `O motor retornou erro (${statusResp.status})`;
                    throw new Error(errorMsg);
                } else {
                    // Ainda rodando (PENDING ou RUNNING), espera 2s
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }

        } catch (err: any) {
            console.error("Erro em handleGenerate:", err);
            await updateChatState(targetChatId, (prev) =>
                prev.map(item => item.id === newItemId ? { ...item, isLoading: false, error: err.message } : item)
            );
        }
    }

    const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedPromptId(id);
        setTimeout(() => setCopiedPromptId(null), 2000);
    }

    return (
        <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
            <div className="px-4 md:px-11 py-4 md:py-6 flex flex-col md:flex-row items-stretch md:items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-40 gap-y-4">
                <div className="flex gap-2 md:gap-4 flex-wrap pb-2 md:pb-0 shrink-0 w-full md:w-auto">
                    {/* Categorias movidas para o dropdown no prompt */}
                </div>



                <div className="flex items-center gap-3 justify-between md:justify-end w-full md:w-auto">
                    <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-1 shadow-inner relative">
                        {/* Seletor de Aspect Ratio removido daqui e levado para o prompt bar */}
                    </div>

                    {isAdminMode && (
                        <button onClick={() => setIsSettingsOpen(true)} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary/20 hover:border-primary/50 transition-all group">
                            <Settings className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </button>
                    )}


                </div>
            </div>

            <div className="flex-1 flex min-h-0 overflow-hidden">
                <div className="hidden md:flex w-72 shrink-0 flex-col gap-6 p-8 border-r border-white/5 bg-black/20">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2"><MessageSquare className="w-4 h-4 text-primary" /> Histórico</h3>
                        <button onClick={handleNewChat} className="p-1.5 bg-primary/20 text-primary rounded-md hover:bg-primary/40 transition-colors"><Plus className="w-3 h-3" /></button>
                    </div>
                    <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar pr-2 max-h-[400px]">
                        {chats.map(chat => (
                            <div key={chat.id} className={`text-left p-3 rounded-xl border transition-colors flex justify-between items-center group relative cursor-pointer ${activeChatId === chat.id ? "bg-white/10 border-white/20" : "bg-transparent border-transparent hover:bg-white/5"}`}>
                                <div className="flex flex-col gap-1 overflow-hidden pr-8 w-full" onClick={() => handleSelectChat(chat)}>
                                    <span className="text-[10px] uppercase font-bold text-white truncate w-full">{chat.title}</span>
                                    <span className="text-[8px] uppercase tracking-widest text-muted-foreground">{chat.history?.length || 0} gerações</span>
                                </div>
                                <button onClick={() => handleDeleteChat(chat.id)} className="absolute right-2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-lg transition-all"><Trash2 className="w-3 h-3" /></button>
                            </div>
                        ))}
                    </div>

                </div>

                <div className="flex-1 flex flex-col gap-6 px-4 md:pl-8 md:pr-0 relative min-h-0 overflow-hidden mt-4 md:mt-0">
                    <div className="flex-1 overflow-y-auto pr-0 md:pr-4 no-scrollbar pb-40 md:pb-32 space-y-8">
                        {history.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                                <Activity className="w-16 h-16 mb-4" />
                                <p className="text-sm font-black uppercase tracking-widest">Inicie uma nova criação</p>
                            </div>
                        ) : (
                            history.map((item) => (
                                <div key={item.id} className="flex flex-col md:flex-row bg-white/[0.01] border border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-white/10 transition-all h-fit md:h-[450px]">
                                    {/* Lado Esquerdo: Imagem */}
                                    <div className="w-full md:w-1/2 aspect-square md:aspect-auto h-full bg-black/40 relative flex items-center justify-center overflow-hidden border-r border-white/5">
                                        {item.isLoading ? (
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="relative">
                                                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                                    <Sparkles className="w-4 h-4 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary animate-pulse">Materializando...</span>
                                                <button onClick={() => handleCancelGeneration(item.id)} className="mt-2 px-4 py-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer z-50">Cancelar Execução</button>
                                            </div>
                                        ) : item.error ? (
                                            <div className="p-8 text-center px-12">
                                                <X className="w-8 h-8 text-red-500/50 mx-auto mb-4" />
                                                <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest leading-relaxed">{item.error}</p>
                                            </div>
                                        ) : (item.urls && item.urls.length > 0) || item.url ? (
                                            <div className="relative w-full h-full group/img flex items-center justify-center bg-black/20 overflow-hidden">
                                                {(item.urls && item.urls.length > 0) ? (
                                                    <>
                                                        <div 
                                                            id={`carousel-${item.id}`}
                                                            className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar items-center justify-start"
                                                        >
                                                            {item.urls.map((u: string, idx: number) => (
                                                                <div key={idx} className="relative w-full h-full flex-[0_0_100%] snap-center flex items-center justify-center p-4">
                                                                    <div className="relative w-full h-full max-h-full overflow-hidden rounded-[1.5rem] border border-white/5 bg-black/40 group/subimg shadow-2xl transition-all hover:border-primary/30">
                                                                        {u.toLowerCase().includes(".mp4") ? (
                                                                            <video src={u} controls autoPlay loop muted className="w-full h-full object-contain" />
                                                                        ) : (
                                                                            <img src={u} className="w-full h-full object-contain transition-all duration-700 group-hover/subimg:scale-105" />
                                                                        )}
                                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/subimg:opacity-100 transition-all flex items-center justify-center gap-3 backdrop-blur-[2px]">
                                                                            <button onClick={() => handleSelectModel(item.model)} className="w-12 h-12 rounded-2xl bg-primary/20 hover:bg-primary text-primary hover:text-white flex items-center justify-center backdrop-blur-md shadow-2xl transition-all hover:scale-110 active:scale-95" title="Usar este Modelo"><Wand2 className="w-5 h-5" /></button>
                                                                            <button onClick={() => setViewerUrl(u)} className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md shadow-2xl transition-all hover:scale-110 active:scale-95"><Maximize2 className="w-5 h-5" /></button>
                                                                            <button onClick={() => downloadFileToClient(u)} className="w-12 h-12 rounded-2xl bg-primary/80 hover:bg-primary text-white flex items-center justify-center backdrop-blur-md shadow-2xl transition-all hover:scale-110 active:scale-95"><Download className="w-5 h-5" /></button>
                                                                            <button onClick={() => handleDeleteSubAsset(item.id, u)} className="w-12 h-12 rounded-2xl bg-red-500/20 hover:bg-red-500 text-white flex items-center justify-center backdrop-blur-md shadow-2xl transition-all hover:scale-110 active:scale-95"><Trash2 className="w-5 h-5" /></button>
                                                                        </div>
                                                                        
                                                                        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] text-white font-bold tracking-widest uppercase border border-white/10">
                                                                            {idx + 1} / {item.urls?.length || 0}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {item.urls.length > 1 && (
                                                            <>
                                                                <button 
                                                                    onClick={() => {
                                                                        const el = document.getElementById(`carousel-${item.id}`);
                                                                        if (el) el.scrollBy({ left: -el.offsetWidth, behavior: 'smooth' });
                                                                    }}
                                                                    className="absolute left-6 w-10 h-10 rounded-full bg-black/60 hover:bg-primary text-white flex items-center justify-center border border-white/10 transition-all hover:scale-110 active:scale-95 z-20 opacity-0 group-hover/img:opacity-100 backdrop-blur-md"
                                                                >
                                                                    <ChevronLeft className="w-6 h-6" />
                                                                </button>
                                                                <button 
                                                                    onClick={() => {
                                                                        const el = document.getElementById(`carousel-${item.id}`);
                                                                        if (el) el.scrollBy({ left: el.offsetWidth, behavior: 'smooth' });
                                                                    }}
                                                                    className="absolute right-6 w-10 h-10 rounded-full bg-black/60 hover:bg-primary text-white flex items-center justify-center border border-white/10 transition-all hover:scale-110 active:scale-95 z-20 opacity-0 group-hover/img:opacity-100 backdrop-blur-md"
                                                                >
                                                                    <ChevronRight className="w-6 h-6" />
                                                                </button>
                                                                
                                                                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                                                                    {item.urls.map((_: any, i: number) => (
                                                                        <div 
                                                                            key={i} 
                                                                            className="w-1.5 h-1.5 rounded-full bg-white/20 border border-white/10 transition-all"
                                                                            style={{
                                                                                // Pequeno truque para indicar qual está ativo se quisermos ser perfeccionistas, 
                                                                                // mas por hora apenas os pontos já ajudam a dar feedback de carrossel.
                                                                            }}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </>
                                                        )}
                                                    </>
                                                ) : item.url ? (
                                                    <div className="relative w-full h-full flex-[0_0_100%] snap-center flex items-center justify-center p-4">
                                                        <div className="relative w-full h-full max-h-full overflow-hidden rounded-[1.5rem] border border-white/5 bg-black/40 group/subimg shadow-2xl transition-all hover:border-primary/30">
                                                            {item.url.toString().toLowerCase().includes(".mp4") ? (
                                                                <video src={item.url.toString()} controls autoPlay loop muted className="w-full h-full object-contain" />
                                                            ) : (
                                                                <img src={item.url.toString()} className="w-full h-full object-contain transition-all duration-700 group-hover/subimg:scale-105" />
                                                            )}
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/subimg:opacity-100 transition-all flex items-center justify-center gap-3 backdrop-blur-[2px]">
                                                                <button onClick={() => handleSelectModel(item.model)} className="w-12 h-12 rounded-2xl bg-primary/20 hover:bg-primary text-primary hover:text-white flex items-center justify-center backdrop-blur-md shadow-2xl transition-all hover:scale-110 active:scale-95" title="Usar este Modelo"><Wand2 className="w-5 h-5" /></button>
                                                                <button onClick={() => setViewerUrl(item.url as string)} className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md shadow-2xl transition-all hover:scale-110 active:scale-95"><Maximize2 className="w-5 h-5" /></button>
                                                                <button onClick={() => downloadFileToClient(item.url as string)} className="w-12 h-12 rounded-2xl bg-primary/80 hover:bg-primary text-white flex items-center justify-center backdrop-blur-md shadow-2xl transition-all hover:scale-110 active:scale-95"><Download className="w-5 h-5" /></button>
                                                                <button onClick={() => handleDeleteItem(item.id)} className="w-12 h-12 rounded-2xl bg-red-500/20 hover:bg-red-500 text-white flex items-center justify-center backdrop-blur-md shadow-2xl transition-all hover:scale-110 active:scale-95"><Trash2 className="w-5 h-5" /></button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </div>

                                    {/* Lado Direito: Prompt e Info */}
                                    <div className="flex-1 p-8 flex flex-col justify-center bg-black/20 relative">
                                        <button
                                            onClick={() => handleDeleteItem(item.id)}
                                            className="absolute top-4 right-4 p-2 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all shadow-xl group/delete-gen"
                                            title="Excluir Geração"
                                        >
                                            <Trash2 className="w-4 h-4 opacity-50 group-hover/delete-gen:opacity-100 transition-opacity" />
                                        </button>
                                        <div className="mb-6 mt-4">
                                            <div className="flex items-center gap-4 mb-4">
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/80">Configurações</span>
                                                <div className="flex gap-2 flex-wrap">
                                                    <span
                                                        onClick={() => handleSelectModel(item.model)}
                                                        className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[8px] font-black uppercase text-primary cursor-pointer hover:bg-primary hover:text-white transition-all shadow-xl hover:scale-105"
                                                        title="Selecionar este Modelo"
                                                    >
                                                        {item.model}
                                                    </span>
                                                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[8px] font-black uppercase text-muted-foreground">{item.size}</span>
                                                </div>
                                            </div>
                                            <div className="relative group/prompt">
                                                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/40" />
                                                    <p className="text-xs text-white/80 font-medium leading-relaxed italic pr-4">"{item.prompt}"</p>
                                                </div>
                                                <button
                                                    onClick={() => copyToClipboard(item.prompt, item.id)}
                                                    className="absolute top-3 right-3 p-2 rounded-lg bg-white/5 hover:bg-primary/20 hover:text-primary transition-all backdrop-blur-sm border border-white/5 group-hover/prompt:opacity-100 opacity-0"
                                                    title="Copiar Prompt"
                                                >
                                                    {copiedPromptId === item.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                            <div className="flex justify-end mt-4">
                                                <button
                                                    onClick={() => handleRetryGeneration(item)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white transition-all hover:scale-105 active:scale-95"
                                                >
                                                    <RefreshCcw className="w-3.5 h-3.5" /> Tentar Novamente
                                                </button>
                                            </div>
                                        </div>

                                        {item.duration !== undefined && (
                                            <div className="flex items-center gap-6 mt-2 opacity-50">
                                                <div className="flex flex-col">
                                                    <span className="text-[7px] uppercase font-black tracking-widest text-muted-foreground">Tempo</span>
                                                    <span className="text-[10px] font-black text-white">{item.duration.toFixed(1)}s</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                        <div id="chat-bottom" />
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 md:left-8 md:right-2 bg-background pt-2 pb-4 md:pb-2 z-10 before:absolute before:inset-x-0 before:bottom-full before:h-8 before:bg-gradient-to-t before:from-background before:to-transparent before:pointer-events-none px-4 md:px-0">

                        {/* Renderizar Inputs de Imagem (incluindo Origem se mapeado) */}
                        {(() => {
                            const workflowMapping = workflows.find(w => w.id === selectedWorkflowId)?.mapping;
                            if (!workflowMapping) return null;

                            // Reunir todos os IDs únicos para não duplicar campos na UI
                            const allInputs: { nodeId: string, label: string }[] = [];

                            if (workflowMapping.baseImageNodeId) {
                                allInputs.push({ nodeId: workflowMapping.baseImageNodeId, label: "Imagem Origem" });
                            }

                            workflowMapping.imageInputs?.forEach(input => {
                                if (input.nodeId && !allInputs.find(i => i.nodeId === input.nodeId)) {
                                    allInputs.push({ nodeId: input.nodeId, label: input.label });
                                }
                            });

                            if (allInputs.length === 0) return null;

                            return (
                                <div className="flex gap-3 mb-2 overflow-x-auto no-scrollbar">
                                    {allInputs.map((input) => (
                                        <div key={input.nodeId} className="shrink-0 relative group">
                                            <label htmlFor={`file-input-${input.nodeId}`} className="cursor-pointer block">
                                                <div className={cn("w-14 h-14 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all relative overflow-hidden group/img-input", imageInputs[input.nodeId]?.file || imageInputs[input.nodeId]?.url ? "border-primary/50 bg-primary/5" : "border-white/10 hover:border-primary/30 bg-white/[0.02]")}>
                                                    {imageInputs[input.nodeId]?.url ? (
                                                        <>
                                                            <img src={imageInputs[input.nodeId].url!} className="w-full h-full object-cover rounded-lg" />
                                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img-input:opacity-100 transition-all flex items-center justify-center backdrop-blur-[2px]">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        setImageInputs(prev => ({ ...prev, [input.nodeId]: { file: null, url: null } }));
                                                                    }}
                                                                    className="p-1 bg-red-500 rounded-md text-white hover:bg-red-600 transition-all shadow-xl"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Camera className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                            <span className="text-[6px] font-black uppercase tracking-widest text-muted-foreground text-center px-1 leading-none">{input.label}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </label>
                                            <input id={`file-input-${input.nodeId}`} type="file" className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setImageInputs(prev => ({ ...prev, [input.nodeId]: { file, url: URL.createObjectURL(file) } })); } }} />

                                            {!imageInputs[input.nodeId]?.url && (
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setPickingGalleryForNode(input.nodeId);
                                                    }}
                                                    className="absolute -top-1.5 -right-1.5 p-1 bg-[#0b0b0d] border border-white/10 hover:border-primary/50 hover:bg-primary/10 rounded-md text-muted-foreground hover:text-primary transition-all shadow-xl z-20 group-hover:scale-110"
                                                    title="Escolher da Galeria"
                                                >
                                                    <Image className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}

                        {workflows.find(w => w.id === selectedWorkflowId)?.mapping?.parameterInputs && (workflows.find(w => w.id === selectedWorkflowId)?.mapping?.parameterInputs || []).length > 0 && (
                            <div className="flex flex-wrap gap-x-3 gap-y-2 mb-2 bg-white/[0.03] border border-white/10 p-2 rounded-xl overflow-x-auto max-h-24 no-scrollbar">
                                {workflows.find(w => w.id === selectedWorkflowId)?.mapping?.parameterInputs?.map((param, idx) => (
                                    <div key={idx} className="flex flex-col gap-0.5 min-w-[100px]">
                                        <label className="text-[8px] uppercase font-black text-muted-foreground tracking-widest ml-1">{param.label}</label>
                                        {param.type === "boolean" ? (
                                            <button onClick={() => setExtraParams(p => ({ ...p, [`${param.nodeId}-${param.field}`]: !p[`${param.nodeId}-${param.field}`] }))} className={cn("px-2 py-1 rounded-lg border text-[8px] font-bold uppercase transition-all", extraParams[`${param.nodeId}-${param.field}`] ? "bg-primary/20 border-primary text-primary" : "border-white/10 text-muted-foreground bg-white/5")}>{extraParams[`${param.nodeId}-${param.field}`] ? "On" : "Off"}</button>
                                        ) : (
                                            <input type={param.type === "number" ? "number" : "text"} value={extraParams[`${param.nodeId}-${param.field}`] ?? ""} onChange={e => setExtraParams(p => ({ ...p, [`${param.nodeId}-${param.field}`]: param.type === "number" ? parseFloat(e.target.value) : e.target.value }))} className="bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-[9px] font-bold text-white focus:ring-1 focus:ring-primary outline-none" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex flex-col gap-1.5">
                            <div className="relative flex items-center">
                                <div className="absolute left-2 top-1/2 -translate-y-1/2 z-30 flex items-center gap-1">
                                    {/* Seletor de Modelo */}
                                    <div className="relative" ref={modelSelectorRef}>
                                        <button
                                            onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
                                            className={cn(
                                                "w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-105 shadow-xl shrink-0 border",
                                                isModelSelectorOpen
                                                    ? "bg-primary text-white border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]"
                                                    : "bg-white/5 text-muted-foreground border-white/10 hover:border-primary/50"
                                            )}
                                            title="Escolher Modelo"
                                        >
                                            <LayoutGrid className="w-4 h-4" />
                                        </button>

                                        <AnimatePresence>
                                            {isModelSelectorOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    className="absolute bottom-full left-0 mb-3 w-64 z-[100]"
                                                >
                                                    <div className="bg-[#0b0b0d] border border-white/10 rounded-[1.5rem] shadow-2xl p-2 backdrop-blur-xl">
                                                        <div className="text-[8px] font-black text-muted-foreground uppercase tracking-widest px-4 py-3 border-b border-white/5 mb-1">
                                                            Categorias de Modelo
                                                        </div>
                                                        <div className="space-y-1">
                                                            {dynamicCategories.map((cat, index) => {
                                                                const Icon = AVAILABLE_ICONS.find(i => i.name === cat.icon)?.icon || Sparkles;
                                                                const catWorkflows = workflows.filter(w => w.categoryId === cat.id || w.type === cat.id);

                                                                // Lógica de alinhamento inteligente:
                                                                // - Primeiro item: Alinha no topo
                                                                // - Último item: Alinha na base
                                                                // - Meio: Centraliza verticalmente
                                                                const isFirst = index === 0;
                                                                const isLast = index === dynamicCategories.length - 1;

                                                                return (
                                                                    <div key={cat.id} className="relative group/cat-item">
                                                                        <div className={cn(
                                                                            "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer",
                                                                            activeTab === cat.id ? "bg-white/5 text-primary" : "text-white/70 hover:bg-white/5 hover:text-white"
                                                                        )}>
                                                                            <div className="flex items-center gap-3">
                                                                                <Icon className="w-3.5 h-3.5" />
                                                                                <span className="text-[10px] font-black uppercase tracking-tight">{cat.name}</span>
                                                                            </div>
                                                                            <ChevronLeft className="w-3 h-3 group-hover/cat-item:translate-x-1 transition-transform opacity-40 rotate-180" />
                                                                        </div>

                                                                        {/* Sub-dropdown com os Modelos (Inteligente) */}
                                                                        <div className={cn(
                                                                            "absolute left-full ml-2 w-56 opacity-0 invisible group-hover/cat-item:opacity-100 group-hover/cat-item:visible transition-all duration-200 z-[110]",
                                                                            isFirst ? "top-0" : (isLast ? "bottom-0" : "top-1/2 -translate-y-1/2")
                                                                        )}>
                                                                            <div className="bg-[#0b0b0d] border border-white/10 rounded-xl shadow-2xl p-2 backdrop-blur-xl">
                                                                                <div className="text-[7px] font-black text-muted-foreground uppercase tracking-widest px-3 py-2 border-b border-white/5 mb-1 text-center">
                                                                                    {cat.name}
                                                                                </div>
                                                                                <div className="max-h-64 overflow-y-auto no-scrollbar">
                                                                                    {catWorkflows.length === 0 ? (
                                                                                        <div className="px-3 py-4 text-[9px] text-muted-foreground italic text-center">Em breve...</div>
                                                                                    ) : (
                                                                                        catWorkflows.map(w => (
                                                                                            <button
                                                                                                key={w.id}
                                                                                                onClick={() => {
                                                                                                    setSelectedWorkflowId(w.id);
                                                                                                    setActiveTab(cat.id);
                                                                                                    setIsModelSelectorOpen(false);
                                                                                                }}
                                                                                                className={cn(
                                                                                                    "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all",
                                                                                                    selectedWorkflowId === w.id ? "bg-primary/20 text-primary border border-primary/20" : "text-white/70 hover:bg-white/10 hover:text-white"
                                                                                                )}
                                                                                            >
                                                                                                <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", selectedWorkflowId === w.id ? "bg-primary animate-pulse" : "bg-white/10")} />
                                                                                                <span className="text-[10px] font-bold uppercase tracking-tight truncate">{w.name}</span>
                                                                                            </button>
                                                                                        ))
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Seletor de Aspect Ratio */}
                                    <div className="relative" ref={ratioSelectorRef}>
                                        <button
                                            onClick={() => setIsRatioDropdownOpen(!isRatioDropdownOpen)}
                                            className={cn(
                                                "w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-105 shadow-xl shrink-0 border",
                                                isRatioDropdownOpen
                                                    ? "bg-primary text-white border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]"
                                                    : "bg-white/5 text-muted-foreground border-white/10 hover:border-primary/50"
                                            )}
                                            title="Escolher Proporção"
                                        >
                                            <span className="text-[9px] font-black uppercase tracking-tight">{aspectRatio}</span>
                                        </button>

                                        <AnimatePresence>
                                            {isRatioDropdownOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    className="absolute bottom-full left-0 mb-3 w-48 z-[100]"
                                                >
                                                    <div className="bg-[#0b0b0d] border border-white/10 rounded-2xl shadow-2xl p-2 backdrop-blur-xl">
                                                        <div className="text-[8px] font-black text-muted-foreground uppercase tracking-widest px-4 py-3 border-b border-white/5 mb-1">
                                                            Proporção (Aspect Ratio)
                                                        </div>
                                                        <div className="space-y-1">
                                                            {ASPECT_RATIOS.map(r => (
                                                                <button
                                                                    key={r.label}
                                                                    onClick={() => {
                                                                        setAspectRatio(r.label);
                                                                        setWidth(r.w.toString());
                                                                        setHeight(r.h.toString());
                                                                        setIsRatioDropdownOpen(false);
                                                                    }}
                                                                    className={cn(
                                                                        "w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all",
                                                                        aspectRatio === r.label ? "bg-primary/20 text-primary border border-primary/20" : "text-white/70 hover:bg-white/5 hover:text-white"
                                                                    )}
                                                                >
                                                                    <div className="flex flex-col items-start">
                                                                        <span className="text-[10px] font-black uppercase tracking-tight">{r.label}</span>
                                                                        <span className="text-[7px] opacity-50 font-bold">{r.w} x {r.h}</span>
                                                                    </div>
                                                                    {aspectRatio === r.label && <Check className="w-3 h-3" />}
                                                                </button>
                                                            ))}

                                                            <div className="border-t border-white/5 mt-1 pt-1">
                                                                <div className="px-4 py-2 text-[7px] font-black uppercase text-muted-foreground tracking-widest">Personalizado</div>
                                                                <div className="flex items-center gap-2 px-2 pb-2">
                                                                    <div className="flex-1 flex flex-col gap-1">
                                                                        <span className="text-[6px] font-bold text-muted-foreground uppercase ml-1">Largura</span>
                                                                        <input type="number" value={width} onChange={(e) => { setWidth(e.target.value); setAspectRatio("custom"); }} className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-white outline-none focus:border-primary/50 transition-colors" />
                                                                    </div>
                                                                    <div className="flex-1 flex flex-col gap-1">
                                                                        <span className="text-[6px] font-bold text-muted-foreground uppercase ml-1">Altura</span>
                                                                        <input type="number" value={height} onChange={(e) => { setHeight(e.target.value); setAspectRatio("custom"); }} className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-white outline-none focus:border-primary/50 transition-colors" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleGenerate();
                                        }
                                    }}
                                    rows={1}
                                    className="w-full bg-[#0c0c0e] border border-white/10 hover:border-white/20 rounded-xl pl-24 pr-32 py-3.5 text-xs text-white focus:ring-1 focus:ring-primary outline-none resize-none no-scrollbar shadow-xl transition-colors disabled:opacity-50"
                                    placeholder={workflows.find(w => w.id === selectedWorkflowId)?.mapping?.promptPlaceholder || "Descreva a foto..."}
                                />

                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                    {!prompt.trim() && getWorkflowDefaultPrompt(workflows.find(w => w.id === selectedWorkflowId)) && (
                                        <button
                                            onClick={() => setPrompt(getWorkflowDefaultPrompt(workflows.find(w => w.id === selectedWorkflowId))!)}
                                            className="px-2 py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all hover:scale-105 shadow-xl whitespace-nowrap hidden md:block"
                                            title="Copiar prompt de referência"
                                        >
                                            Usar Referência
                                        </button>
                                    )}

                                    <button onClick={handleGenerate} className="w-9 h-9 bg-primary/90 text-white rounded-lg flex items-center justify-center hover:bg-primary transition-all hover:scale-105 shadow-xl shrink-0" title="Gerar Nova Imagem">
                                        <Sparkles className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="relative flex items-center">
                                <textarea
                                    value={negativePrompt}
                                    onChange={(e) => setNegativePrompt(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleGenerate();
                                        }
                                    }}
                                    rows={1}
                                    className="w-full bg-black/40 border border-white/5 hover:border-white/10 rounded-xl pl-4 pr-24 py-2 text-[10px] text-white/70 focus:ring-1 focus:ring-primary outline-none resize-none no-scrollbar shadow-inner transition-colors disabled:opacity-50"
                                    placeholder="Prompt Negativo (o que não deve aparecer na imagem)..."
                                />

                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                    {!negativePrompt.trim() && getWorkflowDefaultNegativePrompt(workflows.find(w => w.id === selectedWorkflowId)) && (
                                        <button
                                            onClick={() => setNegativePrompt(getWorkflowDefaultNegativePrompt(workflows.find(w => w.id === selectedWorkflowId))!)}
                                            className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white border border-white/10 rounded-md text-[7px] font-black uppercase tracking-widest transition-all hover:scale-105 whitespace-nowrap hidden md:block"
                                            title="Copiar prompt negativo de referência"
                                        >
                                            Usar Referência
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        {errorMsg && <p className="text-[9px] text-destructive font-bold uppercase tracking-widest mt-1.5">{errorMsg}</p>}
                    </div>
                </div>
            </div>

            <StudioSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                workflows={workflows}
                setWorkflows={setWorkflows}
                isAdminMode={isAdminMode}
            />



            {viewerUrl && <ImageViewerModal url={viewerUrl} onClose={() => setViewerUrl(null)} onDownload={() => downloadFileToClient(viewerUrl)} />}

            {
                pickingGalleryForNode && effectiveInfluencerId && (
                    <GalleryPickerModal
                        influencerId={effectiveInfluencerId}
                        onClose={() => setPickingGalleryForNode(null)}
                        onSelect={(url) => {
                            setImageInputs(prev => ({ ...prev, [pickingGalleryForNode]: { file: null, url } }));
                            setPickingGalleryForNode(null);
                        }}
                    />
                )
            } {/* Modal de Confirmação Customizado */}
            {
                confirmDialog.isOpen && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                        <div className="bg-[#0b0b0d] w-full max-w-sm rounded-[2rem] p-8 border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-200">
                            <div className="text-center mb-6">
                                <Trash2 className="w-12 h-12 text-red-500/50 mx-auto mb-4" />
                                <h3 className="text-white font-black uppercase text-sm tracking-widest mb-2">Confirmar Exclusão</h3>
                                <p className="text-muted-foreground text-xs leading-relaxed">{confirmDialog.message}</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setConfirmDialog(p => ({ ...p, isOpen: false }))} className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest transition-all">Cancelar</button>
                                <button onClick={confirmDialog.onConfirm} className="flex-1 py-3 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-widest transition-all">Excluir</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    )
}
