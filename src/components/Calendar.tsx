"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Calendar as CalendarIcon,
    Clock,
    Instagram,
    MessageCircle as TikTokIcon,
    Twitter,
    MoreVertical,
    CheckCircle2,
    Loader2,
    Globe,
    TrendingUp,
    Layout,
    ArrowRight,
    MapPin,
    AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { db } from "@/lib/firebase"
import { collection, query, onSnapshot, Timestamp, addDoc, orderBy } from "firebase/firestore"

export function Calendar({ influencerId }: { influencerId: string | null }) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [posts, setPosts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())

    // Form states for new post
    const [newPost, setNewPost] = useState({
        title: "",
        platform: "instagram" as "instagram" | "tiktok" | "twitter",
        status: "draft" as "draft" | "ready" | "posted",
        content: ""
    })

    useEffect(() => {
        if (!influencerId) {
            setLoading(false)
            return
        }

        const q = query(
            collection(db, "influencers", influencerId, "posts"),
            orderBy("scheduled_at", "asc")
        )
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                scheduled_at: (doc.data().scheduled_at as Timestamp).toDate()
            }))
            setPosts(data)
            setLoading(false)
        }, (err) => {
            console.error(err)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [influencerId])

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!influencerId || !selectedDate || !newPost.title) return

        try {
            await addDoc(collection(db, "influencers", influencerId, "posts"), {
                ...newPost,
                scheduled_at: Timestamp.fromDate(selectedDate),
                created_at: Timestamp.now()
            })
            setIsAddModalOpen(false)
            setNewPost({ title: "", platform: "instagram", status: "draft", content: "" })
        } catch (error) {
            console.error(error)
        }
    }

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))

    const renderDays = () => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        const totalDays = daysInMonth(year, month)
        const firstDay = firstDayOfMonth(year, month)
        const days = []

        // Empty days at start
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="aspect-square border-b border-r border-white/5 opacity-0" />)
        }

        for (let d = 1; d <= totalDays; d++) {
            const dayDate = new Date(year, month, d)
            const isToday = new Date().toDateString() === dayDate.toDateString()
            const isSelected = selectedDate.toDateString() === dayDate.toDateString()
            const dayPosts = posts.filter(p =>
                p.scheduled_at.getDate() === d &&
                p.scheduled_at.getMonth() === month &&
                p.scheduled_at.getFullYear() === year
            )

            days.push(
                <div
                    key={d}
                    onClick={() => setSelectedDate(dayDate)}
                    className={cn(
                        "aspect-square border-b border-r border-white/5 p-2 relative group transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center",
                        isSelected ? "bg-primary/20" : "hover:bg-white/[0.02]"
                    )}
                >
                    <span className={cn(
                        "text-[10px] font-black w-7 h-7 flex items-center justify-center rounded-xl transition-all relative z-10",
                        isToday ? "bg-white text-black shadow-lg" : isSelected ? "text-primary scale-125" : "text-white/30 group-hover:text-white"
                    )}>
                        {d}
                    </span>

                    {dayPosts.length > 0 && (
                        <div className="mt-1.5 flex gap-0.5">
                            {dayPosts.slice(0, 3).map((p, i) => (
                                <div key={i} className={cn("w-1 h-1 rounded-full", p.status === 'posted' ? "bg-green-500" : "bg-primary")} />
                            ))}
                        </div>
                    )}

                    {isSelected && (
                        <motion.div layoutId="selection-ring" className="absolute inset-2 border-2 border-primary/30 rounded-2xl" />
                    )}
                </div>
            )
        }

        // Fill remaining grid spaces
        const totalGridSlots = 42
        const remaining = totalGridSlots - days.length
        for (let i = 0; i < remaining; i++) {
            days.push(<div key={`fill-${i}`} className="aspect-square border-b border-r border-white/5 opacity-0" />)
        }

        return days
    }

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

    const selectedDayPosts = posts.filter(p =>
        p.scheduled_at.toDateString() === selectedDate.toDateString()
    )

    if (!influencerId) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-background p-8 text-center text-white">
                <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center mb-8 border border-white/5 shadow-2xl">
                    <CalendarIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-3xl font-black tracking-tight mb-2 uppercase text-white">Ciclo de <span className="text-primary italic">Conteúdo</span></h2>
                <p className="text-muted-foreground max-w-sm mb-10 leading-relaxed text-sm">Visualize o agendamento sincronizado do influencer.</p>
            </div>
        )
    }

    return (
        <div className="flex-1 h-screen overflow-hidden bg-background flex flex-col">
            {/* Header Simplified */}
            <header className="p-8 border-b border-white/5 flex justify-between items-center bg-black/20 backdrop-blur-md">
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        <CalendarIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tighter text-white uppercase leading-none">
                            Editorial <span className="text-primary italic">Insights</span>
                        </h2>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-1">Gestão de Pulsação Digital</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                        <button onClick={handlePrevMonth} className="p-2 hover:bg-white/5 rounded-lg transition-all">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="px-4 font-black text-[10px] uppercase tracking-widest min-w-[140px] text-center text-white">
                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </div>
                        <button onClick={handleNextMonth} className="p-2 hover:bg-white/5 rounded-lg transition-all">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="p-3 bg-white text-black rounded-xl hover:bg-primary hover:text-white transition-all shadow-xl"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Compact Calendar Grid */}
                <div className="flex-1 p-8 overflow-y-auto hidden-scrollbar">
                    <div className="max-w-3xl mx-auto">
                        <div className="grid grid-cols-7 mb-4">
                            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(day => (
                                <div key={day} className="py-2 text-center text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 border-t border-l border-white/5 rounded-[2rem] overflow-hidden shadow-2xl bg-white/[0.01]">
                            {renderDays()}
                        </div>

                        <div className="mt-12 grid grid-cols-3 gap-8">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-primary" />
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Agendado</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Publicado</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-white/20" />
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Vazio</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Agenda/Schedules List */}
                <div className="w-[450px] border-l border-white/5 bg-white/[0.01] flex flex-col p-10">
                    <div className="mb-10">
                        <div className="flex items-center gap-3 mb-2">
                            <Clock className="w-4 h-4 text-primary" />
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Timeline do Dia</span>
                        </div>
                        <h3 className="text-4xl font-black text-white uppercase tracking-tighter">
                            {selectedDate.getDate()} <span className="text-white/20">de</span> {monthNames[selectedDate.getMonth()]}
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-6">
                        {selectedDayPosts.length === 0 ? (
                            <div className="py-20 text-center space-y-4 bg-white/[0.02] rounded-[2.5rem] border border-dashed border-white/5 px-8">
                                <AlertCircle className="w-8 h-8 text-white/10 mx-auto" />
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                                    Nenhum compromisso digital agendado para esta data.
                                </p>
                                <button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="text-[10px] font-black text-primary uppercase tracking-[0.2em] pt-4"
                                >
                                    + Adicionar Novo
                                </button>
                            </div>
                        ) : (
                            selectedDayPosts.map((post) => (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={post.id}
                                    className="group relative bg-[#0c0c0e] border border-white/5 p-6 rounded-[2rem] hover:border-primary/50 transition-all shadow-xl"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={cn(
                                            "px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest",
                                            post.status === 'posted' ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-primary/10 border-primary/20 text-primary"
                                        )}>
                                            {post.status}
                                        </div>
                                        <div className="flex items-center gap-3 text-white/20 group-hover:text-primary transition-colors">
                                            {post.platform === 'instagram' && <Instagram size={14} />}
                                            {post.platform === 'tiktok' && <TikTokIcon size={14} />}
                                            {post.platform === 'twitter' && <Twitter size={14} />}
                                        </div>
                                    </div>
                                    <h4 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors mb-2">{post.title}</h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 italic mb-4">
                                        {post.content || "Sem descrição disponível."}
                                    </p>
                                    <div className="flex items-center gap-4 pt-4 border-t border-white/5 text-[9px] font-black text-white/30 uppercase tracking-widest">
                                        <Clock className="w-3 h-3" />
                                        <span>Horário a definir</span>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>

                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="w-full mt-10 py-5 bg-white text-black rounded-3xl font-black text-[10px] uppercase tracking-[0.4em] hover:bg-primary hover:text-white transition-all shadow-2xl flex items-center justify-center gap-3"
                    >
                        Novo Agendamento
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Post Creation Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-8"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-[#0c0c0e] border border-white/10 w-full max-w-xl rounded-[3rem] overflow-hidden shadow-2xl"
                        >
                            <div className="p-10 border-b border-white/5 flex justify-between items-center">
                                <div>
                                    <h3 className="text-3xl font-black text-white tracking-tighter uppercase">Novo <span className="text-primary italic">Post</span></h3>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1">Data: {selectedDate?.toLocaleDateString('pt-BR')}</p>
                                </div>
                                <button onClick={() => setIsAddModalOpen(false)} className="w-12 h-12 rounded-2xl bg-white/5 text-white/50 hover:text-white flex items-center justify-center transition-all">
                                    <Plus className="rotate-45" />
                                </button>
                            </div>

                            <form onSubmit={handleCreatePost} className="p-10 space-y-8">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Título do Conteúdo</label>
                                        <input
                                            value={newPost.title}
                                            onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-1 focus:ring-primary outline-none"
                                            placeholder="Ex: Editorial Beachwear V1"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Plataforma</label>
                                            <select
                                                value={newPost.platform}
                                                onChange={(e) => setNewPost({ ...newPost, platform: e.target.value as any })}
                                                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-1 focus:ring-primary outline-none appearance-none"
                                            >
                                                <option value="instagram">Instagram</option>
                                                <option value="tiktok">TikTok</option>
                                                <option value="twitter">X (Twitter)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Status de Aprovação</label>
                                            <select
                                                value={newPost.status}
                                                onChange={(e) => setNewPost({ ...newPost, status: e.target.value as any })}
                                                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-1 focus:ring-primary outline-none appearance-none"
                                            >
                                                <option value="draft">Rascunho</option>
                                                <option value="ready">Pronto para Post</option>
                                                <option value="posted">Publicado</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Legenda / Roteiro</label>
                                        <textarea
                                            value={newPost.content}
                                            onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                                            rows={4}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-sm font-medium focus:ring-1 focus:ring-primary outline-none resize-none"
                                            placeholder="Insira aqui a legenda do post ou script do vídeo..."
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-6 bg-white text-black rounded-3xl font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl hover:bg-primary hover:text-white transition-all"
                                >
                                    Sincronizar no Calendário
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
