"use client"

import { useParams } from "next/navigation"
import { usePublicInfluencer, useMoodboard } from "@/hooks/useFirebase"
import { motion, AnimatePresence } from "framer-motion"
import {
    Instagram,
    Twitter,
    Globe,
    MapPin,
    Calendar,
    Stars,
    Zap,
    Camera,
    Sparkles,
    ArrowUpRight,
    Maximize2,
    ShieldCheck,
    Briefcase
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function PublicProfile() {
    const params = useParams()
    const id = params.id as string
    const { influencer, loading, error } = usePublicInfluencer(id)
    const { items: moodboardItems } = useMoodboard(id)

    const highlights = moodboardItems.filter(item => item.type === 'highlight')

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full shadow-[0_0_20px_rgba(139,92,246,0.5)]"
                />
                <p className="mt-6 text-[10px] font-black uppercase text-primary tracking-[0.4em] animate-pulse">Decrypting Talent Profile</p>
            </div>
        )
    }

    if (error || !influencer) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-8">
                    <Stars className="w-10 h-10 text-muted-foreground" />
                </div>
                <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Profile Not Found</h1>
                <p className="text-muted-foreground text-sm mt-4 max-w-xs">{error || "This access link has expired or is invalid."}</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#020203] text-white selection:bg-primary/30 relative overflow-x-hidden font-sans">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[160px] opacity-40" />
                <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[140px] opacity-30" />
            </div>

            {/* Premium Header/Nav */}
            <header className="fixed top-0 left-0 right-0 z-50 p-8 flex justify-between items-center bg-gradient-to-b from-[#020203]/80 to-transparent backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-xl rotate-3">
                        <Stars className="w-6 h-6 text-black -rotate-3" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] leading-none mb-1">Elite Elenco</p>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest leading-none opacity-50">Private Talent Audit</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5">
                        <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-primary">Certified Identity</span>
                    </div>
                    <button className="px-6 py-3 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-primary hover:text-white transition-all">
                        Contract Talent
                    </button>
                </div>
            </header>

            <main className="relative z-10">
                {/* Hero Section */}
                <section className="pt-40 pb-20 px-8 max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
                        {/* Profile Image Column */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-5 relative group"
                        >
                            <div className="aspect-[3/4] rounded-[3rem] overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] sticky top-40">
                                <img src={influencer.image} alt={influencer.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s]" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                                <div className="absolute bottom-10 left-10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10">
                                            <Camera className="w-5 h-5" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Verified Portfolio</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Name & Content Column */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="lg:col-span-7 space-y-12"
                        >
                            <div>
                                <h1 className="text-8xl md:text-[10rem] font-black tracking-tighter leading-[0.8] mb-8 uppercase italic selection:text-primary">
                                    <span className="text-white/20 select-none">#</span>{influencer.name}
                                </h1>
                                <p className="text-2xl font-bold text-white/50 leading-relaxed italic max-w-xl">
                                    "{influencer.short_bio || "Narrativa sintética em constante evolução."}"
                                </p>
                            </div>

                            {/* Data Points Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {[
                                    { icon: MapPin, label: "Base City", value: influencer.base_city || "Global" },
                                    { icon: Calendar, label: "Digital Age", value: influencer.date_of_birth ? `${new Date().getFullYear() - new Date(influencer.date_of_birth).getFullYear()} cycles` : "N/A" },
                                    { icon: Stars, label: "Zodiac", value: influencer.personality?.zodiac || "Universal" },
                                    { icon: Zap, label: "Core Energy", value: influencer.personality?.mbti || "Executive" },
                                ].map((stat, i) => (
                                    <div key={i} className="bg-white/[0.03] border border-white/5 p-6 rounded-[2rem]">
                                        <stat.icon className="w-4 h-4 text-primary mb-3 opacity-60" />
                                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
                                        <p className="text-xs font-black text-white">{stat.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Extended Dossier Excerpt */}
                            <div className="space-y-8">
                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">DNA de Marca & Narrative</h3>
                                    <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[2.5rem] relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8 opacity-5">
                                            <ShieldCheck className="w-32 h-32 text-white" />
                                        </div>
                                        <p className="text-sm font-medium leading-[2] text-white/70 italic text-justify">
                                            {influencer.backstory || "Este talento sintetiza a intersecção entre tecnologia e autenticidade visual. Cada editorial é planejado para transmitir uma narrativa Coesa e aspiracional, garantindo que as campanhas alcancem impacto duradouro em audiências globais."}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-4">Origins</p>
                                        <p className="text-sm font-bold text-white">{influencer.dossier?.origins || "Undefined origins"}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-4">Strategic Goals</p>
                                        <p className="text-sm font-bold text-white">{influencer.dossier?.goals || "Global Influence"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Social Footprint (Decorations) */}
                            <div className="pt-8 flex gap-8 border-t border-white/5">
                                <div className="flex items-center gap-3 opacity-30 hover:opacity-100 transition-opacity">
                                    <Instagram className="w-5 h-5" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Digital Channel 01</span>
                                </div>
                                <div className="flex items-center gap-3 opacity-30 hover:opacity-100 transition-opacity">
                                    <Twitter className="w-5 h-5" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Digital Channel 02</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Portfolio Section */}
                <section className="py-32 px-8 bg-white/[0.01]">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-end justify-between mb-20">
                            <div>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-[1px] bg-primary" />
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Campaign Portfolio</p>
                                </div>
                                <h2 className="text-6xl font-black text-white uppercase tracking-tighter italic selection:text-primary">Recortes <span className="text-primary italic">Editoriais</span></h2>
                            </div>
                            <p className="hidden lg:block text-[10px] font-bold text-muted-foreground uppercase tracking-widest max-w-[200px] text-right">Uma seleção curada das melhores participações e ensaios.</p>
                        </div>

                        {highlights.length === 0 ? (
                            <div className="py-32 text-center bg-white/[0.02] border border-dashed border-white/5 rounded-[4rem]">
                                <Sparkles className="w-8 h-8 text-muted-foreground/30 mx-auto mb-4" />
                                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest italic leading-relaxed">Nenhum asset visual foi liberado para pré-visualização neste canal.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                                {highlights.map((item, idx) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="group relative"
                                    >
                                        <div className="aspect-[3/4] rounded-[3rem] overflow-hidden border border-white/5 relative shadow-2xl">
                                            <img src={item.url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />

                                            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center scale-75 group-hover:scale-100 transition-transform">
                                                    <Maximize2 className="w-6 h-6 text-white" />
                                                </div>
                                            </div>

                                            <div className="absolute bottom-10 left-10 right-10 translate-y-4 group-hover:translate-y-0 transition-transform">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="px-3 py-1 bg-primary text-white text-[8px] font-black uppercase tracking-widest rounded-full">Editorial</div>
                                                </div>
                                                <h4 className="text-xl font-black text-white uppercase tracking-tight leading-none mb-1">{item.title}</h4>
                                                <p className="text-[10px] text-white/50 italic font-medium truncate">{item.obs || "Asset curado para campanhas globais."}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Footer Engagement */}
                <section className="py-40 px-8 text-center bg-black relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-20 bg-gradient-to-b from-primary/50 to-transparent" />

                    <div className="max-w-xl mx-auto space-y-10">
                        <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(255,255,255,0.1)] mb-12">
                            <Briefcase className="w-10 h-10 text-black" />
                        </div>
                        <h2 className="text-5xl font-black text-white uppercase tracking-tighter selection:text-primary">Fale com a <span className="text-primary italic">Agência</span></h2>
                        <p className="text-muted-foreground font-medium text-sm leading-[2] italic px-8">
                            Interessado em escalar sua marca com {influencer.name}? Nossa equipe de agentes está pronta para discutir integrações estratégicas e campanhas de alto impacto.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                            <a href="#" className="px-10 py-6 bg-white text-black rounded-3xl font-black text-[10px] uppercase tracking-[0.4em] hover:bg-primary hover:text-white transition-all shadow-2xl">
                                Solicitar Proposta
                            </a>
                            <a href="#" className="px-10 py-6 bg-white/5 text-white border border-white/10 rounded-3xl font-black text-[10px] uppercase tracking-[0.4em] hover:bg-white/10 transition-all">
                                Download Mídia Kit
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            {/* Micro-footer */}
            <footer className="py-12 border-t border-white/5 px-8 flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest relative z-10">
                <p>&copy; 2026 Instagramei Elite. All Rights Reserved.</p>
                <p className="hidden md:block">Strategic Digital Influencer Asset Vault</p>
                <div className="flex gap-6">
                    <a href="#" className="hover:text-primary transition-colors">Privacy</a>
                    <a href="#" className="hover:text-primary transition-colors">Terms</a>
                </div>
            </footer>
        </div>
    )
}
