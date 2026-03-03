"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Users,
    Target,
    Image as ImageIcon,
    ShoppingBag,
    TrendingUp,
    Zap,
    ArrowUpRight,
    Briefcase,
    Calendar,
    Star
} from "lucide-react"
import { cn } from "@/lib/utils"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore"
import { useInfluencers } from "@/hooks/useFirebase"

export function AgencyOverview({ agencyId, onModuleChange }: { agencyId: string | null, onModuleChange?: (module: any) => void }) {
    const { influencers, loading: loadingInf } = useInfluencers(agencyId || undefined)
    const [stats, setStats] = useState({
        totalAssets: 0,
        totalCampaigns: 0,
        completedCampaigns: 0,
        activeCampaigns: 0
    })
    const [loadingStats, setLoadingStats] = useState(true)

    useEffect(() => {
        if (!influencers.length) {
            if (!loadingInf) setLoadingStats(false)
            return
        }

        const fetchDeepStats = async () => {
            let assetsCount = 0
            let campCount = 0
            let activeCamp = 0
            let completedCamp = 0

            // Para cada influencer, buscamos os contadores reais
            for (const inf of influencers) {
                const moodSnapshot = await getDocs(collection(db, "influencers", inf.id, "moodboard"))
                assetsCount += moodSnapshot.size

                const campSnapshot = await getDocs(collection(db, "influencers", inf.id, "campaigns"))
                campCount += campSnapshot.size

                campSnapshot.docs.forEach(d => {
                    const data = d.data()
                    if (data.status === 'active') activeCamp++
                    if (data.status === 'completed') completedCamp++
                })
            }

            setStats({
                totalAssets: assetsCount,
                totalCampaigns: campCount,
                completedCampaigns: completedCamp,
                activeCampaigns: activeCamp
            })
            setLoadingStats(false)
        }

        fetchDeepStats()
    }, [influencers, loadingInf])

    const femaleCount = influencers.filter(i => i.gender === "Feminino").length
    const maleCount = influencers.filter(i => i.gender === "Masculino").length
    const otherCount = influencers.length - femaleCount - maleCount

    if (loadingInf) {
        return (
            <div className="flex-1 flex items-center justify-center bg-background">
                <Zap className="w-10 h-10 text-primary animate-pulse" />
            </div>
        )
    }

    if (influencers.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-background p-12 text-center">
                <div className="w-24 h-24 rounded-[2.5rem] bg-white/[0.03] border border-white/5 flex items-center justify-center mb-10 shadow-2xl rotate-3 group hover:rotate-6 transition-all">
                    <Users className="w-10 h-10 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                </div>
                <h2 className="text-5xl font-black text-white tracking-tighter uppercase mb-6 leading-none">
                    Sua Agência está <br /><span className="text-primary italic">Vazia</span>
                </h2>
                <p className="text-muted-foreground text-sm max-w-sm mb-12 font-medium italic">
                    O primeiro passo para dominar o mercado de influenciadores sintéticos é criar o seu primeiro talento digital.
                </p>
                <button
                    onClick={() => onModuleChange?.("identity")}
                    className="px-12 py-6 bg-white text-black rounded-3xl font-black text-[10px] uppercase tracking-[0.4em] shadow-[0_0_50px_rgba(255,255,255,0.1)] hover:bg-primary hover:text-white transition-all transform hover:scale-105 active:scale-95 flex items-center gap-4"
                >
                    <Star className="w-4 h-4 fill-current" />
                    Cadastrar Primeiro Talento
                </button>
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-y-auto bg-background p-4 md:p-12 custom-scrollbar">
            <div className="max-w-7xl mx-auto">
                <header className="mb-16">
                    <div className="flex items-center gap-3 mb-4 text-primary font-bold text-[10px] uppercase tracking-[0.4em]">
                        <Zap className="w-4 h-4 fill-primary" />
                        Agência Management Suite
                    </div>
                    <div className="flex justify-between items-end gap-4 flex-wrap">
                        <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase leading-none">
                            Visão <span className="text-primary italic">Geral</span>
                        </h2>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status da Operação</p>
                            <p className="text-sm font-bold text-white mt-1 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                Operacional
                            </p>
                        </div>
                    </div>
                </header>

                {/* Grid de Métricas Reais */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <MetricCard
                        label="Casting Total"
                        value={influencers.length.toString()}
                        icon={Users}
                        description="Modelos cadastrados na base"
                    />
                    <MetricCard
                        label="Volume de Fotos"
                        value={loadingStats ? "..." : stats.totalAssets.toString()}
                        icon={ImageIcon}
                        description="Arquivos de imagem catalogados"
                    />
                    <MetricCard
                        label="Campanhas Ativas"
                        value={loadingStats ? "..." : stats.activeCampaigns.toString()}
                        icon={Briefcase}
                        description="Jobs em execução no momento"
                    />
                    <MetricCard
                        label="Taxa de Entrega"
                        value={stats.totalCampaigns > 0 ? `${Math.round((stats.completedCampaigns / stats.totalCampaigns) * 100)}%` : "0%"}
                        icon={TrendingUp}
                        description="Progresso de briefings finalizados"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Distribuição de Gênero */}
                    <div className="lg:col-span-1 bg-white/[0.02] border border-white/5 rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-10 flex flex-col justify-between">
                        <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-8 font-black uppercase">
                                Divisão de <span className="text-primary italic">Casting</span>
                            </h3>
                            <div className="space-y-8">
                                <GenderStat label="Feminino" count={femaleCount} total={influencers.length} color="bg-primary" />
                                <GenderStat label="Masculino" count={maleCount} total={influencers.length} color="bg-blue-500" />
                                <GenderStat label="Outros" count={otherCount} total={influencers.length} color="bg-zinc-700" />
                            </div>
                        </div>
                        <div className="mt-12 pt-8 border-t border-white/5">
                            <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest leading-relaxed">
                                Métricas extraídas automaticamente dos perfis ativos na sua agência.
                            </p>
                        </div>
                    </div>

                    {/* Destaques do Casting */}
                    <div className="lg:col-span-2 bg-secondary/30 border border-white/5 rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-10">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">Últimos <span className="text-primary italic">Cadastros</span></h3>
                            <button className="text-[10px] font-black uppercase text-primary hover:underline flex items-center gap-2">
                                Ver todos <ArrowUpRight className="w-3 h-3" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {influencers.length === 0 ? (
                                <p className="text-center text-muted-foreground italic py-10">Nenhum talento cadastrado.</p>
                            ) : (
                                influencers.slice(0, 4).map((inf, idx) => (
                                    <div key={inf.id} className="group flex items-center gap-4 p-4 bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl border border-white/5 transition-all">
                                        <div className="w-12 h-12 rounded-xl bg-secondary overflow-hidden shrink-0 border border-white/5">
                                            <img src={inf.image || `https://ui-avatars.com/api/?name=${inf.name}&background=8b5cf6&color=fff`} alt={inf.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-black text-white">{inf.name}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{inf.gender || "Não definido"}</p>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <div className="flex gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={cn("w-2.5 h-2.5", i < 4 ? "text-primary fill-primary" : "text-white/10")} />
                                                ))}
                                            </div>
                                            <p className="text-[8px] text-white/40 mt-1 uppercase font-black tracking-tighter">Perfil On-chain</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function MetricCard({ label, value, icon: Icon, trend, description }: any) {
    return (
        <div className="bg-white/[0.02] border border-white/5 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] hover:border-primary/30 transition-all group overflow-hidden relative">
            <div className="absolute -right-2 -top-2 opacity-5 scale-150 rotate-12 group-hover:scale-[2] transition-transform duration-700">
                <Icon className="w-20 h-20 text-white" />
            </div>
            <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-primary/10 rounded-2xl">
                    <Icon className="w-5 h-5 text-primary" />
                </div>
                {trend && (
                    <span className="text-[10px] font-black text-green-400 bg-green-400/10 px-3 py-1 rounded-full">
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">{label}</p>
                <div className="flex items-baseline gap-2">
                    <h4 className="text-3xl font-black text-white tracking-tighter leading-none">{value}</h4>
                </div>
                <p className="text-[10px] text-white/30 mt-3 font-medium italic">{description}</p>
            </div>
        </div>
    )
}

function GenderStat({ label, count, total, color }: any) {
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0
    return (
        <div className="space-y-3">
            <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.2em]">
                <span className="text-white/70">{label}</span>
                <span className="text-primary">{count} <span className="text-white/20 font-medium">— {percentage}%</span></span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    className={cn("h-full rounded-full", color)}
                    style={{
                        boxShadow: `0 0 20px ${color.replace('bg-', '')}`
                    }}
                />
            </div>
        </div>
    )
}
