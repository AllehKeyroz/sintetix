"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { useAgents, useGeminiKey, useChats } from "@/hooks/useFirebase"
import { saveGeminiKey, createAgent, updateAgent, deleteAgent, createChatSession, updateChatSession } from "@/lib/actions"
import { Bot, MessageSquare, Plus, Save, Settings2, Trash2, X, Send, User, BrainCircuit, GlobeLock, Sparkles, AlertCircle, PlusSquare } from "lucide-react"
import { cn } from "@/lib/utils"

export function AgentChat() {
    const { profile } = useAuth()
    const isAdmin = profile?.role === "admin"
    const { agents, loading: loadingAgents } = useAgents(isAdmin)
    const { key, setKey, loading: loadingKey } = useGeminiKey(isAdmin)
    const { chats, loading: loadingChats } = useChats(profile?.uid)

    const [activeTab, setActiveTab] = useState<"chat" | "agents" | "settings">("chat")

    // --- CHAT STATE ---
    const [currentChatId, setCurrentChatId] = useState<string | null>(null)
    const [selectedAgentId, setSelectedAgentId] = useState<string>("")
    const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash")
    const [messages, setMessages] = useState<{ role: string, content: string }[]>([])
    const [input, setInput] = useState("")
    const [isChatLoading, setIsChatLoading] = useState(false)
    const [chatError, setChatError] = useState("")
    const chatEndRef = useRef<HTMLDivElement>(null)

    // --- AGENTS STATE ---
    const [editingAgent, setEditingAgent] = useState<any>(null)
    const [agentError, setAgentError] = useState("")

    useEffect(() => {
        if (agents.length > 0 && !selectedAgentId) {
            setSelectedAgentId(agents[0].id)
        }
    }, [agents])

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    // --- CHAT ACTIONS ---
    const handleSendMessage = async () => {
        if (!input.trim() || !selectedAgentId || isChatLoading) return

        const selectedAgent = agents.find(a => a.id === selectedAgentId)
        if (!selectedAgent) return

        const newMessages = [...messages, { role: "user", content: input }]
        setMessages(newMessages)
        setInput("")
        setIsChatLoading(true)
        setChatError("")

        // Check or Create Session
        let activeChatId = currentChatId;

        try {
            if (!activeChatId && profile?.uid) {
                activeChatId = await createChatSession(profile.uid, {
                    agentId: selectedAgentId,
                    messages: newMessages,
                    title: "Chat com " + selectedAgent.name
                });
                setCurrentChatId(activeChatId);
            } else if (activeChatId && profile?.uid) {
                await updateChatSession(profile.uid, activeChatId, newMessages);
            }

            // Build absolute message list matching Gemini expectations
            const apiMessages = [
                { role: "system", content: selectedAgent.systemPrompt || "Você é um assistente prestativo." },
                ...newMessages
            ]

            const response = await fetch("/api/gemini", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: selectedModel,
                    messages: apiMessages,
                    apiKey: key
                })
            })

            const data = await response.json()
            if (!response.ok) {
                throw new Error(data.error || "Erro ao comunicar com a IA.")
            }

            const aiMessage = data.choices?.[0]?.message?.content || "Sem resposta."
            const updatedMessages = [...newMessages, { role: "assistant", content: aiMessage }];
            setMessages(updatedMessages)

            if (activeChatId && profile?.uid) {
                await updateChatSession(profile.uid, activeChatId, updatedMessages);
            }
        } catch (err: any) {
            setChatError(err.message)
            setMessages(prev => [...prev, { role: "system", content: `❌ Erro: ${err.message}` }])
        } finally {
            setIsChatLoading(false)
        }
    }

    const startNewChat = () => {
        setCurrentChatId(null)
        setMessages([])
        setChatError("")
    }

    const loadChat = (chat: any) => {
        setCurrentChatId(chat.id)
        if (chat.agentId) setSelectedAgentId(chat.agentId)
        setMessages(chat.messages || [])
        setChatError("")
    }

    // --- CONFIG ACTIONS ---
    const handleSaveKey = async () => {
        try {
            await saveGeminiKey(key)
            alert("Chave salva com sucesso!")
        } catch (err: any) {
            alert("Erro ao salvar: " + err.message)
        }
    }

    // --- AGENT ACTIONS ---
    const startEditAgent = (agent?: any) => {
        if (agent) {
            setEditingAgent({ ...agent })
        } else {
            setEditingAgent({
                name: "",
                systemPrompt: "Você é um assistente especializado e prestativo. Responda de forma clara e profissional.",
                isPublished: false
            })
        }
        setAgentError("")
    }

    const handleSaveAgent = async () => {
        if (!editingAgent.name || !editingAgent.systemPrompt) {
            setAgentError("Preencha todos os campos corretamente.")
            return
        }
        try {
            if (editingAgent.id) {
                await updateAgent(editingAgent.id, editingAgent)
            } else {
                await createAgent(editingAgent)
            }
            setEditingAgent(null)
        } catch (err: any) {
            setAgentError("Erro ao salvar: " + err.message)
        }
    }

    const handleDeleteAgent = async (id: string) => {
        if (confirm("Deseja realmente excluir este agente?")) {
            await deleteAgent(id)
        }
    }

    return (
        <div className="w-full h-full bg-[#050505] flex flex-col animate-in fade-in duration-500">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex flex-col gap-3 bg-white/[0.02]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-white uppercase tracking-wider">A.I. Agents Studio</h2>
                            <p className="text-[9px] uppercase tracking-widest text-primary font-bold">Powered by Google Gemini</p>
                        </div>
                    </div>
                </div>

                {isAdmin && (
                    <div className="flex gap-1 p-1 bg-black/40 rounded-xl">
                        <button
                            onClick={() => setActiveTab("chat")}
                            className={cn("flex-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", activeTab === "chat" ? "bg-white/10 text-white" : "text-white/40 hover:text-white")}
                        >
                            Chat
                        </button>
                        <button
                            onClick={() => setActiveTab("agents")}
                            className={cn("flex-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", activeTab === "agents" ? "bg-white/10 text-white" : "text-white/40 hover:text-white")}
                        >
                            Agents
                        </button>
                        <button
                            onClick={() => setActiveTab("settings")}
                            className={cn("flex-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", activeTab === "settings" ? "bg-white/10 text-white" : "text-white/40 hover:text-white")}
                        >
                            Config
                        </button>
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-hidden relative flex flex-col">
                {activeTab === "chat" && (
                    <div className="flex-1 flex overflow-hidden">
                        {/* Histórico Sidebar */}
                        <div className="w-56 md:w-64 border-r border-white/5 bg-black/40 flex flex-col shrink-0">
                            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-white/50 tracking-widest">Histórico</span>
                                <button onClick={startNewChat} className="p-1.5 bg-primary/20 text-primary hover:bg-primary/40 rounded-lg transition-all" title="Novo Chat">
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1 [&::-webkit-scrollbar]:hidden">
                                {loadingChats ? (
                                    <p className="text-[9px] text-center mt-4 text-white/30 uppercase font-black tracking-widest">Carregando...</p>
                                ) : chats.length === 0 ? (
                                    <p className="text-[9px] text-center mt-4 text-white/30 uppercase font-black tracking-widest">Nenhum chat salvo</p>
                                ) : (
                                    chats.map(chat => (
                                        <div
                                            key={chat.id}
                                            onClick={() => loadChat(chat)}
                                            className={cn("p-3 rounded-xl cursor-pointer transition-all flex items-center gap-2", currentChatId === chat.id ? "bg-primary/20 border border-primary/20" : "hover:bg-white/5 border border-transparent")}
                                        >
                                            <MessageSquare className={cn("w-4 h-4 flex-shrink-0", currentChatId === chat.id ? "text-primary" : "text-white/30")} />
                                            <div className="flex-1 min-w-0">
                                                <p className={cn("text-[10px] uppercase font-black tracking-widest truncate", currentChatId === chat.id ? "text-white" : "text-white/60")}>{chat.title || "Chat"}</p>
                                                <p className={cn("text-[8px] truncate uppercase font-bold tracking-widest", currentChatId === chat.id ? "text-primary/70" : "text-white/30")}>
                                                    {chat.messages?.length || 0} msgs
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Área do Chat */}
                        <div className="flex-1 flex flex-col h-full bg-black/20 relative">
                            <div className="p-4 border-b border-white/5 bg-black/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
                                <div className="flex items-center gap-2 flex-1">
                                    {loadingAgents ? (
                                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Carregando Agentes...</p>
                                    ) : agents.length === 0 ? (
                                        <p className="text-[10px] text-destructive uppercase tracking-widest font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Nenhum Agente Publicado</p>
                                    ) : (
                                        <select
                                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-primary/50 transition-all appearance-none uppercase tracking-widest min-w-[140px] max-w-[200px]"
                                            value={selectedAgentId}
                                            onChange={e => setSelectedAgentId(e.target.value)}
                                            disabled={!!currentChatId}
                                        >
                                            <option value="" disabled className="bg-[#111]">Selecione um Agente</option>
                                            {agents.map(a => (
                                                <option key={a.id} value={a.id} className="bg-[#111]">{a.name} {a.isPublished ? '' : '(Rascunho)'}</option>
                                            ))}
                                        </select>
                                    )}

                                    <select
                                        className="bg-primary/10 text-primary border border-primary/20 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-primary/50 transition-all appearance-none uppercase tracking-widest max-w-[200px]"
                                        value={selectedModel}
                                        onChange={e => setSelectedModel(e.target.value)}
                                    >
                                        <option className="bg-[#111]" value="gemini-2.5-flash">gemini-2.5-flash</option>
                                        <option className="bg-[#111]" value="gemini-2.5-pro">gemini-2.5-pro</option>
                                        <option className="bg-[#111]" value="gemini-2.0-flash">gemini-2.0-flash</option>
                                        <option className="bg-[#111]" value="gemini-2.0-flash-lite">gemini-2.0-flash-lite</option>
                                        <option className="bg-[#111]" value="gemini-1.5-pro">gemini-1.5-pro</option>
                                        <option className="bg-[#111]" value="gemini-1.5-flash">gemini-1.5-flash</option>
                                    </select>
                                </div>
                                <button onClick={startNewChat} className="p-2 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-xl transition-all text-[10px] hidden md:flex" title="Limpar / Novo Chat">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:hidden">
                                {messages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50 px-6">
                                        <BrainCircuit className="w-12 h-12 text-primary mb-4 opacity-50" />
                                        <p className="text-sm font-bold text-white mb-1">Selecione um Agente</p>
                                        <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">Comece uma nova conversa</p>
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => (
                                        <div key={idx} className={cn("flex w-full", msg.role === "user" ? "justify-end" : "justify-start")}>
                                            <div className={cn(
                                                "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                                                msg.role === "user"
                                                    ? "bg-primary text-white rounded-tr-sm"
                                                    : msg.role === "system"
                                                        ? "bg-red-500/10 text-red-500 border border-red-500/20 w-full rounded-tl-sm text-xs font-mono"
                                                        : "bg-white/10 text-white border border-white/5 rounded-tl-sm"
                                            )}>
                                                <div className="flex items-center gap-2 mb-1 opacity-50">
                                                    {msg.role === "user" ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                                                    <span className="text-[8px] uppercase tracking-widest font-black">{msg.role === "user" ? "Você" : msg.role === "system" ? "Sistema" : "Agente"}</span>
                                                </div>
                                                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                                {isChatLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-white/50 flex gap-1 items-center">
                                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-100" />
                                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-200" />
                                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-300" />
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            <div className="p-4 border-t border-white/5 bg-black/20 shrink-0">
                                {chatError && <p className="text-[10px] text-red-500 uppercase font-bold text-center mb-2">{chatError}</p>}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                                        placeholder="Mensagem..."
                                        disabled={loadingAgents || agents.length === 0 || isChatLoading}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 text-sm font-medium text-white focus:bg-white/10 outline-none transition-all disabled:opacity-50"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!input.trim() || isChatLoading || agents.length === 0}
                                        className="bg-primary text-white w-12 h-12 rounded-xl flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-all shrink-0 shadow-lg shadow-primary/20"
                                    >
                                        <Send className="w-4 h-4 ml-1" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "agents" && isAdmin && (
                    <div className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:hidden">
                        {editingAgent ? (
                            <div className="animate-in fade-in space-y-4">
                                <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-4">
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest">{editingAgent.id ? "Editar Agente" : "Novo Agente"}</h3>
                                    <button onClick={() => setEditingAgent(null)} className="text-[10px] uppercase font-bold text-white/50 hover:text-white">Voltar</button>
                                </div>
                                {agentError && <p className="text-[10px] text-red-500 uppercase font-bold bg-red-500/10 p-2 rounded-lg">{agentError}</p>}

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nome do Agente (Persona)</label>
                                    <input
                                        type="text"
                                        value={editingAgent.name}
                                        onChange={e => setEditingAgent({ ...editingAgent, name: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                                        placeholder="Ex: Copywriter PRO"
                                    />
                                </div>



                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">System Prompt (Instruções Base)</label>
                                    <textarea
                                        value={editingAgent.systemPrompt}
                                        onChange={e => setEditingAgent({ ...editingAgent, systemPrompt: e.target.value })}
                                        className="w-full h-32 bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none resize-none"
                                        placeholder="Você é um assistente configurado para..."
                                    />
                                </div>

                                <div className="flex items-center justify-between bg-white/[0.03] p-3 rounded-xl border border-white/5">
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] font-black uppercase text-white/70 tracking-widest block">Publicado?</span>
                                        <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-tight">Agências podem ver se publicado.</p>
                                    </div>
                                    <button
                                        onClick={() => setEditingAgent({ ...editingAgent, isPublished: !editingAgent.isPublished })}
                                        className={cn("w-10 h-5 rounded-full transition-all relative flex items-center px-1", editingAgent.isPublished ? "bg-primary" : "bg-white/10")}
                                    >
                                        <div className={cn("w-3.5 h-3.5 bg-white rounded-full transition-all", editingAgent.isPublished ? "translate-x-4.5" : "translate-x-0")} />
                                    </button>
                                </div>

                                <button onClick={handleSaveAgent} className="w-full py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest mt-4 hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                                    <Save className="w-4 h-4" /> Salvar Agente
                                </button>

                            </div>
                        ) : (
                            <div className="space-y-4">
                                <button onClick={() => startEditAgent()} className="w-full py-3 border border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all gap-2 flex items-center justify-center border-dashed">
                                    <Plus className="w-4 h-4" /> Criar Novo GPT Customizado
                                </button>

                                <div className="space-y-3">
                                    {agents.map(agent => (
                                        <div key={agent.id} className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col gap-3 group relative">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="text-sm font-bold text-white">{agent.name}</h4>
                                                    <p className="text-[9px] uppercase tracking-widest font-black text-muted-foreground flex items-center gap-1 mt-1">
                                                        <Bot className="w-3 h-3 text-primary" /> Agente Base
                                                    </p>
                                                </div>
                                                <span className={cn("text-[8px] px-2 py-1 rounded font-black uppercase tracking-widest", agent.isPublished ? "bg-emerald-500/10 text-emerald-500" : "bg-orange-500/10 text-orange-500")}>
                                                    {agent.isPublished ? "Público" : "Admin"}
                                                </span>
                                            </div>

                                            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                                                <button onClick={() => { setSelectedAgentId(agent.id); startNewChat(); setActiveTab("chat"); }} className="text-[9px] font-bold text-white/50 hover:text-white uppercase tracking-widest underline underline-offset-2">Testar</button>
                                                <button onClick={() => startEditAgent(agent)} className="text-[9px] font-bold text-primary hover:text-primary/80 uppercase tracking-widest underline underline-offset-2 ml-2">Editar</button>
                                                <button onClick={() => handleDeleteAgent(agent.id)} className="text-[9px] font-bold text-red-500 hover:text-red-400 uppercase tracking-widest underline underline-offset-2 ml-2">Excluir</button>
                                            </div>
                                        </div>
                                    ))}
                                    {agents.length === 0 && <p className="text-center text-xs text-white/30 p-4">Nenhum agente cadastrado.</p>}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "settings" && isAdmin && (
                    <div className="flex-1 p-6 space-y-6">
                        <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2 flex items-center gap-2"><GlobeLock className="w-5 h-5 text-primary" /> Gateway API</h3>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-6">Configuração da API Key (Google AI Studio) para todos os modelos LLM.</p>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Google Gemini Key Secreta</label>
                                <input
                                    type="password"
                                    value={key}
                                    onChange={e => setKey(e.target.value)}
                                    placeholder="AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary/50 outline-none font-mono tracking-wider"
                                />
                                <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold ml-1 mt-2 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Esta chave não será exibida para os clientes.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleSaveKey}
                            disabled={loadingKey}
                            className="w-full py-4 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-2 mt-4"
                        >
                            <Save className="w-5 h-5" />
                            {loadingKey ? "Carregando..." : "Salvar Chave Global"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
} 
