"use client"

import { useState, useEffect } from "react"
import { Globe, Users, LayoutPanelLeft, ShieldCheck, Settings, ImageIcon, Video, CalendarDays, BarChart3, Database, Filter, Crown, CheckCircle2, ChevronDown } from "lucide-react"
import { getDashboardMetrics } from "@/lib/admin_metrics"
import { listWorkflowTemplates } from "@/lib/admin_actions"
import { cn } from "@/lib/utils"

export function AdminDashboard() {
    const today = new Date();
    const defaultPast = new Date();
    defaultPast.setDate(defaultPast.getDate() - 7);

    const [startDate, setStartDate] = useState(defaultPast.toISOString().split("T")[0])
    const [endDate, setEndDate] = useState(today.toISOString().split("T")[0])
    const [modelFilter, setModelFilter] = useState("Todos")
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)

    const [loading, setLoading] = useState(true)
    const [metrics, setMetrics] = useState<any>(null)
    const [modelsList, setModelsList] = useState<any[]>([])

    // Carregar Modelos para o Filtro
    useEffect(() => {
        listWorkflowTemplates(false).then(res => setModelsList(res));
    }, []);

    // Carregar Métricas
    useEffect(() => {
        const loadStats = async () => {
            setLoading(true)
            try {
                const sDate = new Date(startDate);
                sDate.setHours(0, 0, 0, 0);

                const eDate = new Date(endDate);
                eDate.setHours(23, 59, 59, 999);

                const data = await getDashboardMetrics(sDate, eDate, modelFilter);
                setMetrics(data);
            } catch (e) {
                console.error("Erro ao carregar métricas:", e);
            } finally {
                setLoading(false)
            }
        };
        loadStats();
    }, [startDate, endDate, modelFilter]);

    const handleShortcut = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - days);
        setEndDate(end.toISOString().split("T")[0]);
        setStartDate(start.toISOString().split("T")[0]);
    }

    return (
        <div className="w-full h-full overflow-y-auto bg-background [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="max-w-7xl mx-auto p-4 md:p-12 pb-32">
                <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-16">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                            <BarChart3 className="w-8 h-8 text-primary" />
                            Saas Overview
                        </h2>
                        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1 opacity-50">
                            Analytics de Geração e Demografia
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 bg-[#0c0c0e] p-2 rounded-2xl border border-white/5">
                        {/* Filtros de Modelo */}
                        <div className="relative group min-w-[150px] w-full sm:w-auto z-50">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-full flex justify-between items-center bg-background rounded-xl px-3 outline-none border border-white/10 hover:border-white/20 h-10 transition-all font-black uppercase text-[10px] tracking-widest text-white"
                            >
                                <span className="flex items-center gap-2 truncate mr-3">
                                    <Filter className="w-3 h-3 text-muted-foreground shrink-0" />
                                    <span className="truncate">{modelFilter === "Todos" ? "Mod: Todos" : modelFilter}</span>
                                </span>
                                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute top-12 left-0 w-full min-w-[200px] bg-[#0c0c0e] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 overflow-hidden max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                    <button
                                        onClick={() => { setModelFilter("Todos"); setIsDropdownOpen(false); }}
                                        className={cn(
                                            "w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all truncate",
                                            modelFilter === "Todos" ? "bg-primary text-white" : "text-muted-foreground hover:bg-white/5 hover:text-white"
                                        )}
                                    >
                                        Mod: Todos
                                    </button>
                                    {modelsList.map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => { setModelFilter(m.title); setIsDropdownOpen(false); }}
                                            className={cn(
                                                "w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all truncate",
                                                modelFilter === m.title ? "bg-primary text-white" : "text-muted-foreground hover:bg-white/5 hover:text-white"
                                            )}
                                        >
                                            {m.title}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Datas Customizadas */}
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="h-10 bg-background border border-white/10 rounded-xl px-3 text-[10px] text-white focus:ring-1 focus:ring-primary outline-none transition-all font-mono uppercase tracking-widest"
                            />
                            <span className="text-muted-foreground text-[10px] font-black">ATÉ</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="h-10 bg-background border border-white/10 rounded-xl px-3 text-[10px] text-white focus:ring-1 focus:ring-primary outline-none transition-all font-mono uppercase tracking-widest"
                            />
                        </div>

                        {/* Shortcuts */}
                        <div className="flex items-center bg-background p-1 rounded-xl border border-white/5">
                            {[7, 15, 30].map(days => {
                                // Calcula aproximado para destacar botão ativo
                                const isAtivo = (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24) >= days - 1 && (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24) <= days + 1;

                                return (
                                    <button
                                        key={days}
                                        onClick={() => handleShortcut(days)}
                                        className={cn(
                                            "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                                            isAtivo ? "bg-primary text-white" : "text-muted-foreground hover:text-white"
                                        )}
                                    >
                                        {days}d
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center min-h-[400px]">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : metrics ? (
                    <>
                        {/* BASE METRICS */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <StatCard icon={Users} label="Agências Totais" value={metrics.totalAgencies} color="blue" />
                            <StatCard
                                icon={Globe}
                                label="Modelos Geração Ativos"
                                value={`${metrics.activeModels}`}
                                details={`${metrics.totalModels} construídos`}
                                color="emerald"
                            />
                            <StatCard icon={ImageIcon} label="Fotos (No Período)" value={metrics.totalPhotos} color="primary" />
                            <StatCard icon={Video} label="Vídeos (No Período)" value={metrics.totalVideos} color="purple" />
                        </div>

                        {/* INFLUENCERS & DEMOGRAFIA */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="col-span-1 md:col-span-2 bg-[#0c0c0e] border border-white/5 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                                <div className="absolute right-0 top-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px] pointer-events-none" />
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                                    <Crown className="w-8 h-8 text-primary" />
                                </div>
                                <div className="flex-1 flex justify-between w-full">
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Influenciadores Cadastrados</p>
                                        <h3 className="text-4xl font-black text-white">{metrics.totalInfluencers}</h3>
                                    </div>
                                    <div className="flex gap-6 mt-2 md:mt-0">
                                        <div className="text-right">
                                            <p className="text-[9px] font-black uppercase text-pink-500 tracking-widest">Feminino</p>
                                            <p className="text-2xl font-black text-white">{metrics.femaleInfluencers}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black uppercase text-blue-500 tracking-widest">Masculino</p>
                                            <p className="text-2xl font-black text-white">{metrics.maleInfluencers}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Top Modelos Geração */}
                            <div className="col-span-1 bg-[#0c0c0e] border border-white/5 rounded-3xl p-6 flex flex-col relative overflow-hidden">
                                <div className="absolute left-0 bottom-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[50px] pointer-events-none" />
                                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-4">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Modelos Mais Usados
                                </h3>
                                <div className="flex-1 flex flex-col gap-3 justify-center">
                                    {metrics.topModels && metrics.topModels.length > 0 ? metrics.topModels.map((m: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-white uppercase tracking-widest truncate max-w-[150px]">{m.name}</span>
                                            <span className="text-[9px] font-black bg-white/10 px-2 py-0.5 rounded-full text-white">{m.count}x</span>
                                        </div>
                                    )) : (
                                        <span className="text-[10px] font-black text-muted-foreground uppercase text-center w-full block">Nenhum dado</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* CHART */}
                        <div className="bg-[#0c0c0e] border border-white/5 rounded-3xl overflow-hidden relative">
                            <div className="absolute right-[-20px] top-[-20px] opacity-[0.03] pointer-events-none">
                                <Database className="w-64 h-64" />
                            </div>

                            <div className="p-8 border-b border-white/5 flex items-center gap-3 relative z-10">
                                <CalendarDays className="w-5 h-5 text-primary" />
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">
                                    Volume de Solicitações por dia
                                </h3>
                                <span className="ml-auto text-[10px] bg-primary/20 text-primary px-3 py-1 rounded-full font-black tracking-widest uppercase ring-1 ring-primary/30">
                                    Total Período: {metrics.totalGenerated}
                                </span>
                            </div>

                            <div className="p-8 relative z-10">
                                <div className="h-64 flex flex-col justify-end">
                                    <DailyChart usageChart={metrics.usageChart} />
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-red-500 text-sm font-bold uppercase tracking-widest min-h-[400px]">
                        Falha ao carregar métricas.
                    </div>
                )}
            </div>
        </div>
    )
}

function DailyChart({ usageChart }: { usageChart: { date: string, count: number }[] }) {
    if (!usageChart || usageChart.length === 0) {
        return <div className="text-center text-muted-foreground text-xs uppercase font-black">Nenhum dado no período</div>;
    }

    const maxCount = Math.max(...usageChart.map(u => u.count), 1);

    return (
        <div className="w-full flex items-end gap-1 sm:gap-2 h-full">
            {usageChart.map((u, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-3 group h-full justify-end">
                    <div
                        className="w-full bg-primary/20 rounded-t-sm relative transition-all duration-500 ease-out group-hover:bg-primary"
                        style={{ height: `${(u.count / maxCount) * 100}%`, minHeight: '4px' }}
                    >
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 z-50 text-[10px] font-black text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black px-2 py-1 rounded-md border border-white/10 shadow-xl whitespace-nowrap">
                            {u.count} solicitações
                        </span>
                    </div>
                    <span className="text-[8px] sm:text-[9px] text-muted-foreground font-bold tracking-widest rotate-[-45deg] origin-top-left mt-2">
                        {u.date.substring(0, 5)}
                    </span>
                </div>
            ))}
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color, details }: any) {
    const colorStyles: Record<string, string> = {
        emerald: "bg-emerald-500/10 text-emerald-500",
        blue: "bg-blue-500/10 text-blue-500",
        primary: "bg-primary/10 text-primary",
        purple: "bg-purple-500/10 text-purple-500"
    };

    return (
        <div className="bg-[#0c0c0e] border border-white/5 rounded-2xl p-6 transition-all hover:border-white/20 group relative overflow-hidden flex flex-col justify-between">
            <div>
                <div className={`w-10 h-10 rounded-xl ${colorStyles[color]} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                    <Icon className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">{label}</p>
            </div>

            <div className="mt-2 text-left">
                <p className="text-2xl font-black text-white">{value}</p>
                {details && <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1 opacity-70 tracking-widest">{details}</p>}
            </div>

            <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full ${colorStyles[color]} blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity`} />
        </div>
    )
}
