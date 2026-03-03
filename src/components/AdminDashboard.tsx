"use client"

import { useState, useEffect } from "react"
import { Globe, Users, LayoutPanelLeft, ShieldCheck, Settings } from "lucide-react"
import { listWorkflowTemplates, countAgencies } from "@/lib/admin_actions"

export function AdminDashboard() {
    const [showSettings, setShowSettings] = useState(false)
    const [cookie, setCookie] = useState("")
    const [stats, setStats] = useState({ agencies: 0, models: 0, generations: "--" })

    useEffect(() => {
        const loadStats = async () => {
            try {
                // 1. Buscar modelos
                const templates = await listWorkflowTemplates(false);

                // 2. Contar Agências
                const agenciesCount = await countAgencies();

                // 3. Buscar cotas do Nordy para mostrar como "Gerações"
                const quotaRes = await fetch("/api/nordy/quota");
                let genValue = "--";
                if (quotaRes.ok) {
                    const quotaData = await quotaRes.json();
                    const used = quotaData[0]?.usedAmount || quotaData[0]?.used || 0;
                    const total = quotaData[0]?.totalAmount || quotaData[0]?.total || 0;
                    genValue = `${used} / ${total}`;
                }

                setStats({
                    agencies: agenciesCount,
                    models: templates.length,
                    generations: genValue
                });
            } catch (e) {
                console.error("Erro ao carregar estatísticas:", e);
            }
        };
        loadStats();
    }, []);

    const handleSaveCookie = async () => {
        if (!cookie) return
        try {
            const r = await fetch("/api/nordy/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cookieString: cookie })
            })
            if (r.ok) {
                alert("Cookie atualizado com sucesso!")
                setShowSettings(false)
                setCookie("")
            }
        } catch (e) {
            alert("Erro ao salvar cookie")
        }
    }

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto flex flex-col h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-8">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-primary" />
                        Global SaaS Overview
                    </h2>
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1 opacity-50">
                        Visão geral de todas as agências e performance do sistema
                    </p>
                </div>

                <div className="relative w-full sm:w-auto flex justify-end">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-white/50 hover:text-white group"
                    >
                        <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform" />
                    </button>

                    {showSettings && (
                        <div className="absolute right-0 mt-3 w-80 bg-[#0c0c0e] border border-white/10 p-6 rounded-2xl shadow-2xl z-50">
                            <h3 className="text-[10px] font-black uppercase text-primary tracking-widest mb-4">Configuração API Nordy</h3>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] uppercase font-black text-muted-foreground tracking-widest block ml-1">Autenticação (Cookie)</label>
                                    <textarea
                                        value={cookie}
                                        onChange={e => setCookie(e.target.value)}
                                        placeholder="Paste your cookie string here..."
                                        className="w-full h-24 bg-background border border-white/10 rounded-xl p-3 text-[10px] text-white focus:ring-1 focus:ring-primary outline-none transition-all resize-none font-mono"
                                    />
                                </div>
                                <button
                                    onClick={handleSaveCookie}
                                    className="w-full bg-primary text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                                >
                                    Atualizar Sessão
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={Users} label="Total de Agências" value={stats.agencies} color="blue" />
                <StatCard icon={Globe} label="Modelos Ativos" value={stats.models} color="emerald" />
                <StatCard icon={LayoutPanelLeft} label="Gerações (Total / Cota)" value={stats.generations} color="primary" />
                <StatCard icon={ShieldCheck} label="Status Sistema" value="ONLINE" color="emerald" />
            </div>

            <div className="mt-12 overflow-hidden bg-white/[0.02] border border-white/5 rounded-3xl">
                <div className="p-8 border-b border-white/5">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Logs de Atividade Global</h3>
                </div>
                <div className="p-20 flex flex-col items-center justify-center text-center">
                    <p className="text-sm font-bold text-white mb-2">Painel de Monitoramento</p>
                    <p className="text-xs text-muted-foreground max-w-xs uppercase tracking-widest font-black opacity-50">
                        As métricas acima já estão sendo extraídas em tempo real do banco de dados e da API.
                    </p>
                </div>
            </div>
        </div>
    )
}

function StatCard({ icon: Icon, label, value, color }: any) {
    return (
        <div className="bg-[#0c0c0e] border border-white/10 rounded-2xl p-6 transition-all hover:border-primary/30">
            <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 flex items-center justify-center mb-4`}>
                <Icon className={`w-5 h-5 text-${color}-500`} />
            </div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">{label}</p>
            <p className="text-2xl font-black text-white">{value}</p>
        </div>
    )
}
