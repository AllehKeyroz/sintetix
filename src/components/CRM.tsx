"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Users,
    Briefcase,
    FileText,
    DollarSign,
    Clock,
    CheckCircle2,
    AlertCircle,
    Plus,
    Search,
    Filter,
    ArrowUpRight,
    MessageSquare,
    Loader2,
    Calendar,
    Target
} from "lucide-react"
import { cn } from "@/lib/utils"
import { db } from "@/lib/firebase"
import { collection, query, onSnapshot, orderBy, addDoc, Timestamp, deleteDoc, doc } from "firebase/firestore"

export function CRM({ influencerId }: { influencerId: string | null }) {
    const [campaigns, setCampaigns] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [newCampaign, setNewCampaign] = useState({
        brand: "",
        title: "",
        status: "prospecting" as "prospecting" | "negotiation" | "active" | "completed",
        value: "",
        deadline: "",
        briefing: ""
    })

    useEffect(() => {
        if (!influencerId) {
            setLoading(false)
            return
        }

        const q = query(
            collection(db, "influencers", influencerId, "campaigns"),
            orderBy("created_at", "desc")
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            setCampaigns(data)
            setLoading(false)
        }, (err) => {
            console.error(err)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [influencerId])

    const handleCreateCampaign = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!influencerId || !newCampaign.brand || !newCampaign.title) return

        try {
            await addDoc(collection(db, "influencers", influencerId, "campaigns"), {
                ...newCampaign,
                created_at: Timestamp.now()
            })
            setNewCampaign({
                brand: "",
                title: "",
                status: "prospecting",
                value: "",
                deadline: "",
                briefing: ""
            })
            setIsAddModalOpen(false)
        } catch (error) {
            console.error(error)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "prospecting": return "bg-blue-500/10 text-blue-400 border-blue-500/20"
            case "negotiation": return "bg-amber-500/10 text-amber-400 border-amber-500/20"
            case "active": return "bg-primary/10 text-primary border-primary/20"
            case "completed": return "bg-green-500/10 text-green-400 border-green-500/20"
            default: return "bg-white/5 text-white/40 border-white/10"
        }
    }

    if (!influencerId) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-background p-8 text-center text-white">
                <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center mb-8 border border-white/5 shadow-2xl">
                    <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight mb-2 uppercase">Gestão de <span className="text-primary italic font-black">Parcerias</span></h2>
                <p className="text-muted-foreground max-w-sm mb-10 leading-relaxed text-sm">
                    Selecione um talento para gerenciar briefings, contratos e campanhas publicitárias.
                </p>
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-y-auto bg-background flex flex-col p-4 md:p-12 relative selection:bg-primary/20">
            {/* Header Section */}
            <div className="max-w-7xl mx-auto w-full mb-12">
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 md:gap-0 mb-12">
                    <div>
                        <div className="flex items-center gap-4 mb-4 text-primary/60 font-bold text-[10px] uppercase tracking-[0.4em]">
                            <Target className="w-4 h-4" />
                            Business & CRM Intelligence
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase">
                            Campanhas <span className="text-primary italic">&</span> Contratos
                        </h2>
                    </div>

                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-8 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-primary hover:text-white transition-all flex items-center gap-3"
                    >
                        <Plus className="w-4 h-4" />
                        Novo Briefing de Campanha
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    {[
                        { label: "Total Gerado", value: "R$ 0,00", icon: DollarSign, color: "text-green-400" },
                        { label: "Campanhas Ativas", value: campaigns.filter(c => c.status === "active").length.toString(), icon: Target, color: "text-primary" },
                        { label: "Em Negociação", value: campaigns.filter(c => c.status === "negotiation").length.toString(), icon: MessageSquare, color: "text-amber-400" },
                        { label: "Aguardando", value: campaigns.filter(c => c.status === "prospecting").length.toString(), icon: Clock, color: "text-blue-400" },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white/[0.02] border border-white/5 p-8 rounded-[2rem] flex flex-col gap-4">
                            <stat.icon className={cn("w-6 h-6 opacity-30", stat.color)} />
                            <div>
                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                                <p className="text-2xl font-black text-white mt-1">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main List */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="flex-1 bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 flex items-center gap-4 focus-within:border-primary/50 transition-all">
                            <Search className="w-4 h-4 text-muted-foreground" />
                            <input className="bg-transparent border-none text-sm font-bold text-white focus:ring-0 w-full" placeholder="Buscar marca ou campanha..." />
                        </div>
                        <button className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl text-muted-foreground hover:text-white transition-all">
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-32 flex justify-center">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        </div>
                    ) : campaigns.length === 0 ? (
                        <div className="py-32 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-[3rem]">
                            <p className="text-white/20 italic font-medium">Nenhuma campanha registrada para este influencer.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {campaigns.map((camp) => (
                                <div key={camp.id} className="group bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 p-6 md:p-8 rounded-[2.5rem] flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8 transition-all relative overflow-hidden">
                                    <div className={cn("w-2 h-12 rounded-full", camp.status === 'active' ? 'bg-primary' : 'bg-muted-foreground/20')} />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={cn("px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest", getStatusColor(camp.status))}>
                                                {camp.status}
                                            </span>
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">#{camp.id.slice(0, 6)}</span>
                                        </div>
                                        <h3 className="text-xl font-black text-white group-hover:text-primary transition-colors">{camp.brand} <span className="text-white/30 ml-2 font-normal">— {camp.title}</span></h3>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-12 mt-4 md:mt-0 text-left md:text-right w-full md:w-auto">
                                        <div>
                                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Budget Est.</p>
                                            <p className="text-sm font-black text-white">{camp.value || "A definir"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Data Limite</p>
                                            <p className="text-sm font-black text-white">{camp.deadline || "Fluxo contínuo"}</p>
                                        </div>
                                        <button className="p-4 bg-white/5 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all">
                                            <ArrowUpRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Campaign Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-8"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-[#0c0c0e] border border-white/10 w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl"
                        >
                            <div className="p-10 border-b border-white/5 flex justify-between items-center">
                                <div>
                                    <h3 className="text-3xl font-black text-white tracking-tighter">Novo <span className="text-primary italic">Briefing</span></h3>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1">Sincronização de Campanha Publicitária</p>
                                </div>
                                <button onClick={() => setIsAddModalOpen(false)} className="w-12 h-12 rounded-2xl bg-white/5 text-white/50 hover:text-white flex items-center justify-center transition-all">
                                    <Plus className="rotate-45" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateCampaign} className="p-10 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Marca / Anunciante</label>
                                        <input
                                            value={newCampaign.brand}
                                            onChange={(e) => setNewCampaign({ ...newCampaign, brand: e.target.value })}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-1 focus:ring-primary outline-none"
                                            placeholder="Ex: Coca-Cola, Nike..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nome da Campanha</label>
                                        <input
                                            value={newCampaign.title}
                                            onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-1 focus:ring-primary outline-none"
                                            placeholder="Ex: Lançamento Verão 2026"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Status</label>
                                        <select
                                            value={newCampaign.status}
                                            onChange={(e) => setNewCampaign({ ...newCampaign, status: e.target.value as any })}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-1 focus:ring-primary outline-none appearance-none"
                                        >
                                            <option value="prospecting">Prospecção</option>
                                            <option value="negotiation">Negociação</option>
                                            <option value="active">Ativa</option>
                                            <option value="completed">Concluída</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Valor do Contrato</label>
                                        <input
                                            value={newCampaign.value}
                                            onChange={(e) => setNewCampaign({ ...newCampaign, value: e.target.value })}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-1 focus:ring-primary outline-none"
                                            placeholder="R$ 0,00"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Data de Entrega</label>
                                        <input
                                            type="date"
                                            value={newCampaign.deadline}
                                            onChange={(e) => setNewCampaign({ ...newCampaign, deadline: e.target.value })}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-1 focus:ring-primary outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Briefing & Estratégia</label>
                                    <textarea
                                        value={newCampaign.briefing}
                                        onChange={(e) => setNewCampaign({ ...newCampaign, briefing: e.target.value })}
                                        rows={4}
                                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-sm font-medium focus:ring-1 focus:ring-primary outline-none resize-none"
                                        placeholder="Descreva os objetivos, entregáveis e principais ganchos da campanha..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-6 bg-white text-black rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl hover:bg-primary hover:text-white transition-all"
                                >
                                    Confirmar Briefing na Base
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
