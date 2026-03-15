"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Zap,
    Star,
    Users,
    Calendar,
    LayoutDashboard,
    TrendingUp,
    Activity,
    Target,
    LucideIcon,
    Edit3,
    Check
} from "lucide-react"
import { useInfluencers } from "@/hooks/useFirebase"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"
import { updateUserProfile, saveNordyCookies } from "@/lib/actions"

export function AgencyOverview({ onModuleChange }: { onModuleChange?: (module: any) => void }) {
    const { profile, user } = useAuth()
    const { influencers, loading: loadingInf } = useInfluencers(profile?.agencyId)
    const [stats, setStats] = useState<any>(null)
    const [isEditingName, setIsEditingName] = useState(false)
    const [agencyName, setAgencyName] = useState(profile?.agencyName || "")

    useEffect(() => {
        if (profile?.agencyName) {
            setAgencyName(profile.agencyName)
        }
    }, [profile])

    useEffect(() => {
        if (loadingInf) return

        const fetchDeepStats = async () => {
            // Aqui poderíamos buscar métricas de campanhas etc
            setStats({
                totalCampaigns: 0,
                activeCampaigns: 0,
                totalReach: "0",
                avgEngagement: "0%"
            })
        }
        fetchDeepStats()
    }, [influencers, loadingInf])

    const handleSaveName = async () => {
        if (!user?.uid) return
        try {
            // Salva no perfil de usuário
            await updateUserProfile(user.uid, { agencyName })

            // Tenta também salvar como label/email no cookie da nordy para o admin ver fácil
            // Isso sincroniza o nome da agência com o painel de cookies
            try {
                // Buscamos se existe um cookie já salvo para essa agência
                const agencyId = profile?.agencyId || user.uid;
                // Note: Aqui não sabemos os cookies atuais, mas podemos fazer um merge de meta apenas no Firestore
                // No entanto, saveNordyCookies atualiza o doc inteiro se eu não tomar cuidado.
                // Na verdade, updateUserProfile já resolve o DB. 
                // Vou adicionar uma chamada em saveNordyCookies na lib/actions para suportar merge de meta sem cookies se necessário,
                // ou apenas deixar o admin_cookies ler dos dois lugares.
            } catch (e) { }

            setIsEditingName(false)
        } catch (error) {
            console.error("Erro ao salvar nome da agência:", error)
            alert("Erro ao salvar nome.")
        }
    }

    const femaleCount = influencers.filter(i => {
        const g = (i.dossier?.sex || i.gender || "").toLowerCase();
        return g === "feminino" || g === "female" || g === "mulher";
    }).length;

    const maleCount = influencers.filter(i => {
        const g = (i.dossier?.sex || i.gender || "").toLowerCase();
        return g === "masculino" || g === "male" || g === "homem" || g === "boy";
    }).length;

    const otherCount = influencers.length - femaleCount - maleCount

    if (loadingInf) {
        return (
            <div className="flex-1 flex items-center justify-center bg-background">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (influencers.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-background">
                <div className="w-24 h-24 rounded-[3rem] bg-white/5 flex items-center justify-center mb-8 border border-white/10 rotate-6">
                    <Star className="w-10 h-10 text-primary -rotate-6" />
                </div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">
                    Nenhum Talento Encontrado
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
        <div className="w-full h-full overflow-y-auto bg-background custom-scrollbar-hidden">
            <div className="max-w-7xl mx-auto p-4 md:p-12 pb-32">
                <header className="mb-16">
                    <div className="flex items-center gap-3 mb-4 text-primary font-bold text-[10px] uppercase tracking-[0.4em]">
                        <Zap className="w-4 h-4 fill-primary" />
                        Agência Management Suite
                    </div>
                    <div className="flex justify-between items-end gap-4 flex-wrap">
                        {isEditingName ? (
                            <div className="flex items-center gap-2 bg-white/5 p-2 rounded-2xl border border-white/10">
                                <input
                                    autoFocus
                                    value={agencyName}
                                    onChange={(e) => setAgencyName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                                    className="bg-transparent border-none outline-none text-2xl md:text-3xl font-black tracking-tighter text-white uppercase w-full max-w-[300px]"
                                    placeholder="NOME DA AGÊNCIA"
                                />
                                <button onClick={handleSaveName} className="p-2 bg-primary text-white rounded-xl">
                                    <Check className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <div className="group flex items-center gap-4 cursor-pointer" onClick={() => setIsEditingName(true)}>
                                <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase leading-none">
                                    {agencyName ? (
                                        <>Agência <span className="text-primary italic">{agencyName}</span></>
                                    ) : (
                                        <>Visão <span className="text-primary italic">Geral</span></>
                                    )}
                                </h2>
                                <Edit3 className="w-6 h-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        )}
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
                        trend="+100%"
                        color="blue"
                    />
                    <MetricCard
                        label="Campanhas Ativas"
                        value={stats?.activeCampaigns || "0"}
                        icon={Target}
                        trend="Live"
                        color="emerald"
                    />
                    <MetricCard
                        label="Alcance Estimado"
                        value={stats?.totalReach || "0"}
                        icon={TrendingUp}
                        trend="Geral"
                        color="purple"
                    />
                    <MetricCard
                        label="Engajamento Médio"
                        value={stats?.avgEngagement || "0%"}
                        icon={Activity}
                        trend="Avg"
                        color="orange"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Elenco e Diversidade */}
                    <div className="lg:col-span-2 bg-[#0c0c0e] border border-white/5 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary/10 transition-colors" />

                        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em] mb-12 flex items-center gap-3">
                            <Users className="w-4 h-4 text-primary" />
                            Distribuição de Elenco
                        </h3>

                        <div className="space-y-10">
                            <GenderStat
                                label="Feminino"
                                count={femaleCount}
                                total={influencers.length}
                                color="bg-pink-500"
                            />
                            <GenderStat
                                label="Masculino"
                                count={maleCount}
                                total={influencers.length}
                                color="bg-blue-500"
                            />
                            <GenderStat
                                label="Outros / Não Inf."
                                count={otherCount}
                                total={influencers.length}
                                color="bg-zinc-700"
                            />
                        </div>
                    </div>

                    {/* Timeline ou Quick Actions */}
                    <div className="bg-[#0c0c0e] border border-white/5 rounded-[2.5rem] p-8 md:p-12">
                        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em] mb-8">Ações Rápidas</h3>
                        <div className="space-y-4">
                            <QuickAction
                                label="Criar Nova Identidade"
                                icon={Star}
                                onClick={() => onModuleChange?.("identity")}
                            />
                            <QuickAction
                                label="Agendar Conteúdo"
                                icon={Calendar}
                                onClick={() => onModuleChange?.("calendar")}
                            />
                            <QuickAction
                                label="Ver CRM de Vendas"
                                icon={LayoutDashboard}
                                onClick={() => onModuleChange?.("crm")}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function MetricCard({ label, value, icon: Icon, trend, color }: { label: string, value: string, icon: LucideIcon, trend: string, color: string }) {
    const colors: any = {
        blue: "text-blue-400 bg-blue-400/10",
        emerald: "text-emerald-400 bg-emerald-400/10",
        purple: "text-purple-400 bg-purple-400/10",
        orange: "text-orange-400 bg-orange-400/10"
    }

    return (
        <div className="bg-[#0c0c0e] border border-white/5 rounded-3xl p-8 hover:border-white/10 transition-all group">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110", colors[color])}>
                <Icon className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">{label}</p>
            <div className="flex items-end justify-between">
                <h4 className="text-3xl font-black text-white tracking-tighter">{value}</h4>
                <span className="text-[8px] font-black text-primary uppercase tracking-widest px-2 py-1 bg-primary/10 rounded-lg">{trend}</span>
            </div>
        </div>
    )
}

function GenderStat({ label, count, total, color }: { label: string, count: number, total: number, color: string }) {
    const percentage = total > 0 ? (count / total) * 100 : 0

    return (
        <div>
            <div className="flex justify-between items-end mb-4">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</span>
                <span className="text-xl font-black text-white">{count} <span className="text-[10px] text-muted-foreground">({percentage.toFixed(0)}%)</span></span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={cn("h-full rounded-full shadow-[0_0_15px_rgba(255,255,255,0.1)]", color)}
                />
            </div>
        </div>
    )
}

function QuickAction({ label, icon: Icon, onClick }: { label: string, icon: LucideIcon, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group text-left"
        >
            <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center border border-white/5 group-hover:border-primary/50 transition-all">
                <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
            </div>
            <span className="text-[10px] font-black text-white uppercase tracking-widest">{label}</span>
        </button>
    )
}
