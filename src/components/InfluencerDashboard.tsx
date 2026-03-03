"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Shield,
    MapPin,
    Calendar,
    Save,
    Loader2,
    Plus,
    UserPlus,
    Camera,
    Settings2,
    Instagram,
    MessageCircle,
    Twitter,
    CheckCircle2,
    Globe,
    ArrowUpRight,
    TrendingUp,
    Share2,
    BookOpen,
    User,
    Briefcase,
    GraduationCap,
    Cross,
    Heart,
    Target,
    Sparkles,
    Trash2
} from "lucide-react"
import { Moodboard } from "./Moodboard"
import { useInfluencers } from "@/hooks/useFirebase"
import { useAuth } from "@/context/AuthContext"
import { updateInfluencer, createInfluencer, deleteInfluencer } from "@/lib/actions"
import { cn } from "@/lib/utils"

// Auxiliares para Idade e Signo
function getAge(dateString: string) {
    if (!dateString) return "N/A"
    const today = new Date()
    const birthDate = new Date(dateString)
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
    return age
}

function getZodiacSign(dateString: string) {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    const day = date.getDate()
    const month = date.getMonth() + 1
    if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) return "Áries"
    if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) return "Touro"
    if ((month == 5 && day >= 21) || (month == 6 && day <= 20)) return "Gêmeos"
    if ((month == 6 && day >= 21) || (month == 7 && day <= 22)) return "Câncer"
    if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) return "Leão"
    if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) return "Virgem"
    if ((month == 9 && day >= 23) || (month == 10 && day <= 22)) return "Libra"
    if ((month == 10 && day >= 23) || (month == 11 && day <= 21)) return "Escorpião"
    if ((month == 11 && day >= 22) || (month == 12 && day <= 21)) return "Sagitário"
    if ((month == 12 && day >= 22) || (month == 1 && day <= 19)) return "Capricórnio"
    if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) return "Aquário"
    return "Peixes"
}

export function InfluencerDashboard({
    influencerId,
    onSelect
}: {
    influencerId: string | null,
    onSelect: (id: string) => void
}) {
    const { user, profile } = useAuth()
    const { influencers, loading, error } = useInfluencers(profile?.agencyId)
    const [isSaving, setIsSaving] = useState(false)
    const [editedData, setEditedData] = useState<any>(null)

    // States
    const [newInfluencerName, setNewInfluencerName] = useState("")
    const [newInfluencerGender, setNewInfluencerGender] = useState("Feminino")
    const [newInfluencerImage, setNewInfluencerImage] = useState<File | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
    const [isEditingMode, setIsEditingMode] = useState(false)
    const [showSaveSuccess, setShowSaveSuccess] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    useEffect(() => {
        if (influencerId) {
            const found = influencers.find(i => i.id === influencerId)
            if (found) {
                // Initialize dossier if it doesn't exist
                const dataWithDossier = {
                    ...found,
                    dossier: found.dossier || {
                        sex: "",
                        faith: "",
                        career: "",
                        education: "",
                        origins: "",
                        goals: ""
                    }
                }
                setEditedData(dataWithDossier)
                setProfileImageFile(null)
                setIsEditingMode(false)
            }
        } else {
            setEditedData(null)
        }
    }, [influencerId, influencers])

    const handleSave = async () => {
        if (!influencerId || !editedData) return
        setIsSaving(true)
        try {
            await updateInfluencer(influencerId, editedData, profileImageFile)
            setProfileImageFile(null)
            setIsEditingMode(false)
            setShowSaveSuccess(true)
            setTimeout(() => setShowSaveSuccess(false), 3000)
        } catch (error) {
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleCreateNew = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newInfluencerName || !profile?.agencyId) return
        setIsCreating(true)
        try {
            const id = await createInfluencer(newInfluencerName, profile.agencyId, newInfluencerGender, newInfluencerImage || undefined)
            onSelect(id)
            setNewInfluencerName("")
            setNewInfluencerGender("Feminino")
            setNewInfluencerImage(null)
        } catch (error) {
            console.error(error)
        } finally {
            setIsCreating(false)
        }
    }

    const handleDelete = () => {
        setShowDeleteConfirm(true)
    }

    const confirmDelete = async () => {
        if (!influencerId) return
        setIsDeleting(true)
        try {
            await deleteInfluencer(influencerId)
            onSelect("") // Deseleciona o influenciador após deletar
            setShowDeleteConfirm(false)
        } catch (error) {
            console.error("Erro ao deletar influenciador:", error)
            alert("Erro ao excluir influenciador.")
        } finally {
            setIsDeleting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-background text-primary">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-background p-8 text-center text-white">
                <Shield className="w-12 h-12 text-destructive mb-4" />
                <h2 className="text-2xl font-bold">Erro de Conexão</h2>
                <p className="text-muted-foreground mt-2">{error}</p>
            </div>
        )
    }

    if (!influencerId || !editedData) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.05),transparent_70%)]" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-xl w-full relative z-10"
                >
                    <div className="text-center mb-16">
                        <div className="w-24 h-24 rounded-[2.5rem] bg-white flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(255,255,255,0.1)] mb-10 rotate-3">
                            <UserPlus className="w-10 h-10 text-black -rotate-3" />
                        </div>
                        <h2 className="text-5xl font-black text-white tracking-tighter uppercase mb-4">
                            Criar Novo <span className="text-primary italic">Perfil</span>
                        </h2>
                        <p className="text-muted-foreground text-sm font-medium leading-relaxed italic max-w-sm mx-auto">
                            Dê vida a uma nova personalidade digital para o seu time.
                        </p>
                    </div>

                    <form onSubmit={handleCreateNew} className="glass-card p-10 rounded-[3rem] border border-white/10 shadow-2xl space-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-primary uppercase tracking-[0.4em] ml-2">Qual o nome dela(e)?</label>
                            <input
                                value={newInfluencerName}
                                onChange={(e) => setNewInfluencerName(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-8 py-6 text-sm font-black text-white focus:ring-1 focus:ring-primary outline-none placeholder:text-white/10"
                                placeholder="Nome completo ou artístico"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-primary uppercase tracking-[0.4em] ml-2">Como ela(e) se identifica?</label>
                            <div className="grid grid-cols-3 gap-4">
                                {["Feminino", "Masculino", "Não-Binário"].map((gender) => (
                                    <button
                                        key={gender}
                                        type="button"
                                        onClick={() => setNewInfluencerGender(gender)}
                                        className={cn(
                                            "py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                            newInfluencerGender === gender
                                                ? "bg-primary border-primary text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                                                : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                                        )}
                                    >
                                        {gender}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <label className="flex-1 cursor-pointer group">
                                <div className="p-8 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl flex flex-col items-center gap-3 group-hover:bg-white/[0.05] transition-all">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                                        <Camera className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest text-center truncate w-full px-4">
                                        {newInfluencerImage ? newInfluencerImage.name : "Escolha uma foto de perfil"}
                                    </span>
                                </div>
                                <input
                                    type="file"
                                    onChange={(e) => setNewInfluencerImage(e.target.files?.[0] || null)}
                                    className="hidden"
                                    accept="image/*"
                                />
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={isCreating}
                            className="w-full py-6 bg-white text-black rounded-3xl font-black text-[10px] uppercase tracking-[0.4em] shadow-xl hover:bg-primary hover:text-white transition-all disabled:opacity-50"
                        >
                            {isCreating ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" /> : "Criar Agora"}
                        </button>
                    </form>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-12 bg-background relative selection:bg-primary/20">
            {/* Custom Toast Notification */}
            <AnimatePresence>
                {showSaveSuccess && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -20, x: "-50%" }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, scale: 0.9, y: -20, x: "-50%" }}
                        className="fixed top-8 left-1/2 z-[100] flex items-center gap-3 px-6 py-3 bg-primary text-white rounded-2xl shadow-2xl border border-white/10"
                    >
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase tracking-widest">Perfil Atualizado</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Admin Controls */}
            <div className="absolute top-4 right-4 md:top-8 md:right-12 flex gap-2 md:gap-4 z-50">
                <button
                    onClick={() => {
                        const url = `${window.location.origin}/share/${influencerId}`
                        navigator.clipboard.writeText(url)
                        alert("Link de compartilhamento copiado para o cliente!")
                    }}
                    className="p-4 rounded-2xl bg-white/5 text-muted-foreground hover:bg-primary hover:text-white transition-all group shadow-lg flex items-center gap-3"
                >
                    <Share2 className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest hidden group-hover:block transition-all">Compartilhar</span>
                </button>

                <button
                    onClick={() => setIsEditingMode(!isEditingMode)}
                    className={cn(
                        "p-4 rounded-2xl transition-all group shadow-lg",
                        isEditingMode ? "bg-primary text-white" : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
                    )}
                >
                    <Settings2 className={cn("w-5 h-5", isSaving && "animate-spin")} />
                </button>

                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="p-4 rounded-2xl bg-white/5 text-muted-foreground hover:bg-destructive hover:text-white transition-all group shadow-lg flex items-center gap-3"
                >
                    {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                    <span className="text-[10px] font-black uppercase tracking-widest hidden group-hover:block transition-all text-white">Excluir Perfil</span>
                </button>
            </div>

            {/* Main Content Layout */}
            <div className="max-w-6xl mx-auto pb-32">
                <div className="grid grid-cols-12 gap-8 md:gap-16 mb-20 items-stretch mt-12 md:mt-0">
                    {/* Left Side: Profile Image */}
                    <div className="col-span-12 lg:col-span-5">
                        <div className="relative group aspect-square rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl bg-secondary">
                            <img
                                src={profileImageFile ? URL.createObjectURL(profileImageFile) : editedData.image}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                alt={editedData.name}
                            />

                            {isEditingMode && (
                                <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => setProfileImageFile(e.target.files?.[0] || null)}
                                    />
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white border border-white/20">
                                            <Camera className="w-8 h-8" />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Alterar Imagem</span>
                                    </div>
                                </label>
                            )}

                            <div className="absolute bottom-8 left-8">
                                <div className="flex items-center gap-2 text-white/80 text-[10px] font-bold uppercase tracking-widest bg-black/40 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    Identity Verified
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Identity Info */}
                    <div className="col-span-12 lg:col-span-7 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-6 text-primary/60 font-bold text-[10px] uppercase tracking-[0.3em]">
                            <TrendingUp className="w-4 h-4" />
                            Time Sintetix Agency
                        </div>

                        <div className="relative mb-8">
                            <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-white uppercase italic selection:text-primary">
                                <span className="text-white/20">#</span>{editedData.name}
                            </h1>
                            <div className="absolute -bottom-4 left-0 w-32 h-1 bg-primary rounded-full" />
                        </div>

                        <div className="mb-10 max-w-lg">
                            {isEditingMode ? (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Bio curta (estilo Instagram)</label>
                                    <textarea
                                        value={editedData.short_bio || ""}
                                        onChange={(e) => setEditedData({ ...editedData, short_bio: e.target.value })}
                                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-sm font-medium focus:ring-1 focus:ring-primary outline-none resize-none"
                                        rows={3}
                                        placeholder="Ex: Vivendo a vida digital um dia de cada vez. ✨"
                                    />
                                </div>
                            ) : (
                                <p className="text-2xl font-bold text-white/50 leading-relaxed italic pr-12">
                                    "{editedData.short_bio || "Uma história sendo escrita..."}"
                                </p>
                            )}
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            <div className="space-y-4">
                                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                                    <div className="flex items-center gap-3 text-muted-foreground mb-1">
                                        <MapPin className="w-3.5 h-3.5 text-primary" />
                                        <span className="text-[9px] font-bold uppercase tracking-widest">Onde mora</span>
                                    </div>
                                    {isEditingMode ? (
                                        <input
                                            value={editedData.base_city || ""}
                                            onChange={(e) => setEditedData({ ...editedData, base_city: e.target.value })}
                                            className="bg-transparent border-none p-0 text-sm font-bold text-white focus:ring-0 w-full"
                                            placeholder="Ex: São Paulo, SP"
                                        />
                                    ) : (
                                        <p className="text-sm font-bold text-white">{editedData.base_city || "Em algum lugar do mundo"}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                                    <div className="flex items-center gap-3 text-muted-foreground mb-1">
                                        <Calendar className="w-3.5 h-3.5 text-primary" />
                                        <span className="text-[9px] font-bold uppercase tracking-widest">Idade</span>
                                    </div>
                                    {isEditingMode ? (
                                        <input
                                            type="date"
                                            value={editedData.date_of_birth || ""}
                                            onChange={(e) => setEditedData({ ...editedData, date_of_birth: e.target.value })}
                                            className="bg-transparent border-none p-0 text-sm font-bold text-white focus:ring-0 w-full [color-scheme:dark]"
                                        />
                                    ) : (
                                        <p className="text-sm font-bold text-white">{getAge(editedData.date_of_birth)} anos</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                                    <div className="flex items-center gap-3 text-muted-foreground mb-1">
                                        <Shield className="w-3.5 h-3.5 text-primary" />
                                        <span className="text-[9px] font-bold uppercase tracking-widest">Signo</span>
                                    </div>
                                    <p className="text-sm font-bold text-white">{getZodiacSign(editedData.date_of_birth)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 flex flex-col sm:flex-row gap-4 sm:gap-6">
                            <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all cursor-pointer">
                                <Instagram className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Instagram Feed</span>
                                <ArrowUpRight className="w-3 h-3 text-white/20 group-hover:text-primary transition-colors" />
                            </div>
                            <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all cursor-pointer">
                                <MessageCircle className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
                                <span className="text-[10px] font-black uppercase tracking-widest">TikTok Reel</span>
                                <ArrowUpRight className="w-3 h-3 text-white/20 group-hover:text-primary transition-colors" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Extended Narrative Dossier Section */}
                <div className="pt-10 md:pt-20 mt-10 md:mt-20 border-t border-white/5">
                    <div className="flex items-center gap-6 mb-12">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Quem ela(e) <span className="text-primary italic">é?</span></h3>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] mt-2">Personalidade e História</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-8 mb-20">
                        {/* Identidade Civil */}
                        <div className="col-span-12 lg:col-span-4 space-y-4">
                            {[
                                { icon: User, label: "Gênero", fieldPath: "sex", value: editedData.dossier?.sex },
                                { icon: Cross, label: "Fé / Crenças", fieldPath: "faith", value: editedData.dossier?.faith },
                                { icon: Briefcase, label: "Trabalho", fieldPath: "career", value: editedData.dossier?.career },
                                { icon: GraduationCap, label: "Estudos", fieldPath: "education", value: editedData.dossier?.education },
                            ].map((item, i) => (
                                <div key={i} className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                                    <div className="flex items-center gap-3 mb-3">
                                        <item.icon className="w-3.5 h-3.5 text-primary opacity-60" />
                                        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest">{item.label}</h4>
                                    </div>
                                    {isEditingMode ? (
                                        <input
                                            value={item.value || ""}
                                            onChange={(e) => setEditedData({
                                                ...editedData,
                                                dossier: { ...editedData.dossier, [item.fieldPath]: e.target.value }
                                            })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-bold focus:ring-1 focus:ring-primary outline-none"
                                        />
                                    ) : (
                                        <p className="text-sm font-bold text-white">{item.value || "Não informado"}</p>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* História e Storytelling */}
                        <div className="col-span-12 lg:col-span-8 space-y-8">
                            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] relative group min-h-[220px]">
                                <div className="flex items-center gap-3 mb-6">
                                    <Sparkles className="w-4 h-4 text-primary" />
                                    <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">História de Vida</h4>
                                </div>
                                {isEditingMode ? (
                                    <textarea
                                        value={editedData.backstory || ""}
                                        onChange={(e) => setEditedData({ ...editedData, backstory: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-sm font-medium focus:ring-1 focus:ring-primary outline-none h-[250px] resize-none leading-relaxed"
                                        placeholder="Conte um pouco sobre a história dessa pessoa..."
                                    />
                                ) : (
                                    <p className="text-sm font-medium leading-[2] text-white/60 italic text-justify pr-10">
                                        {editedData.backstory || "Ainda estamos definindo os detalhes dessa história..."}
                                    </p>
                                )}
                                <div className="absolute top-8 right-8 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Globe className="w-24 h-24 text-white" />
                                </div>
                            </div>

                            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] relative group">
                                <div className="flex items-center gap-3 mb-6">
                                    <Target className="w-4 h-4 text-primary" />
                                    <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Sonhos e Objetivos</h4>
                                </div>
                                {isEditingMode ? (
                                    <textarea
                                        value={editedData.dossier?.goals || ""}
                                        onChange={(e) => setEditedData({
                                            ...editedData,
                                            dossier: { ...editedData.dossier, goals: e.target.value }
                                        })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-sm font-medium focus:ring-1 focus:ring-primary outline-none h-[120px] resize-none leading-relaxed"
                                        placeholder="O que ela(e) quer conquistar?"
                                    />
                                ) : (
                                    <p className="text-sm font-medium leading-[2] text-white/60 italic text-justify pr-10">
                                        {editedData.dossier?.goals || "Ainda não definimos os objetivos."}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Moodboard / Portfolio Sections */}
                    <div className="space-y-24 pb-20">
                        <div>
                            <div className="flex items-center gap-6 mb-12">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <Camera className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Fotos e <span className="text-primary italic">Estilo</span></h3>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] mt-2">Moodboard e Referências</p>
                                </div>
                            </div>
                            <Moodboard influencerId={influencerId} filters={{ type: 'post' }} />
                        </div>

                        <div>
                            <div className="flex items-center gap-6 mb-12">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <Target className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Principais <span className="text-primary italic">Trabalhos</span></h3>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] mt-2">Destaques para mostrar ao cliente</p>
                                </div>
                            </div>
                            <Moodboard influencerId={influencerId} filters={{ type: 'highlight' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Float Action Save Button */}
            <AnimatePresence>
                {isEditingMode && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                    >
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="pointer-events-auto flex items-center gap-4 bg-primary text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-[0.4em] shadow-[0_0_50px_rgba(139,92,246,0.5)] hover:bg-primary/90 transition-all active:scale-95"
                        >
                            {isSaving ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                            Salvar Alterações
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Custom Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowDeleteConfirm(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-secondary border border-white/10 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-destructive" />
                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
                                    <Trash2 className="w-8 h-8 text-destructive" />
                                </div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Confirmar Exclusão</h3>
                                <p className="text-muted-foreground text-sm font-medium leading-relaxed italic mb-8">
                                    Esta ação é irreversível. O perfil de <span className="text-white font-bold">{editedData.name}</span> e todos os dados associados serão removidos permanentemente.
                                </p>
                                <div className="grid grid-cols-2 gap-4 w-full">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-white/10"
                                    >
                                        Manter Perfil
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        disabled={isDeleting}
                                        className="py-4 bg-destructive hover:bg-destructive/90 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(239,68,68,0.3)] disabled:opacity-50"
                                    >
                                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Sim, Excluir"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
