"use client";

import { useState, useEffect } from "react";
import {
    Database,
    Trash2,
    RefreshCw,
    CheckCircle2,
    Circle,
    ShieldCheck,
    Key,
    ExternalLink,
    AlertCircle,
    Copy,
    Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { deleteNordyCookie, setActiveNordyCookie, listNordyCookies, saveNordyCookies } from "@/lib/actions";

interface NordyCookie {
    id: string;
    targetId: string;
    email?: string;
    agencyName?: string;
    quota_total?: number;
    quota_used?: number;
    updated_at?: {
        seconds: number;
        nanoseconds: number;
    };
}

export function NordyCookieManager() {
    const [cookies, setCookies] = useState<NordyCookie[]>([]);
    const [activeMaster, setActiveMaster] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshingId, setRefreshingId] = useState<string | null>(null);

    const fetchCookies = async () => {
        try {
            const data = await listNordyCookies();
            if (data.cookies) {
                setCookies(data.cookies as NordyCookie[]);
                setActiveMaster(data.activeMaster);
            }
        } catch (error) {
            console.error("Erro ao buscar cookies:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCookies();
    }, []);

    const handleRefreshQuota = async (id: string, targetId: string) => {
        setRefreshingId(id);
        try {
            const res = await fetch(`/api/nordy/quota?targetId=${targetId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.current_cookie) {
                    await saveNordyCookies(targetId, data.current_cookie, {
                        quota_total: data.totalAmount || 0,
                        quota_used: 0
                    });
                }
                await fetchCookies();
            } else {
                alert("Falha ao atualizar cota. Verifique se o cookie é válido.");
            }
        } catch (error) {
            console.error("Erro ao atualizar cota:", error);
        } finally {
            setRefreshingId(null);
        }
    };

    const handleDelete = async (targetId: string) => {
        if (confirm(`Tem certeza que deseja deletar os cookies de ${targetId}?`)) {
            await deleteNordyCookie(targetId);
            fetchCookies();
        }
    };

    const handleSetMaster = async (targetId: string) => {
        try {
            await setActiveNordyCookie(targetId);
            setActiveMaster(targetId);
            alert(`Sucesso! Agora ${targetId} é o cookie usado no Studio de Testes do Admin.`);
        } catch (error) {
            console.error("Erro ao definir ativo:", error);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#050505]">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto bg-[#050505] p-8 custom-scrollbar">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_30px_rgba(139,92,246,0.2)]">
                            <Database className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white uppercase italic tracking-tight">Gerenciador de <span className="text-primary not-italic">Cookies</span></h1>
                            <p className="text-muted-foreground text-sm uppercase tracking-widest font-black opacity-60">Controle Centralizado do Motor Nordy.ai</p>
                        </div>
                    </div>

                    <button
                        onClick={() => fetchCookies()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all active:scale-95"
                    >
                        <RefreshCw className={cn("w-4 h-4", refreshingId === 'global' && "animate-spin")} />
                        Atualizar Lista
                    </button>
                </div>

                {/* Active Admin Info Card */}
                <div className="mb-10 p-6 bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-2xl relative overflow-hidden">
                    <div className="flex items-center gap-4 relative z-10">
                        <ShieldCheck className="w-8 h-8 text-primary" />
                        <div>
                            <h3 className="text-lg font-black text-white uppercase italic">Cookie Ativo (Admin/Testes)</h3>
                            <p className="text-muted-foreground text-xs leading-relaxed">
                                Você selecionou o cookie de <strong className="text-primary">{activeMaster}</strong> para ser usado nas gerações do <strong className="text-white">Studio de Testes</strong> e pela conta administrativa.
                            </p>
                        </div>
                    </div>
                    <div className="absolute right-[-20px] top-[-20px] opacity-10">
                        <Database className="w-40 h-40" />
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 gap-4">
                    <AnimatePresence mode="popLayout">
                        {cookies.map((cookie) => {
                            const isMaster = activeMaster === cookie.targetId;
                            const quotaTotal = cookie.quota_total || 0;
                            const isExpired = quotaTotal <= 0;

                            return (
                                <motion.div
                                    key={cookie.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={cn(
                                        "group p-6 bg-[#0a0a0a] border border-white/5 rounded-2xl transition-all hover:border-white/10 flex items-center gap-6",
                                        isMaster && "border-primary/40 bg-primary/5 ring-1 ring-primary/20",
                                        isExpired && "border-red-500/20 bg-red-500/5"
                                    )}
                                >
                                    {/* Connection Indicator */}
                                    <div className="relative shrink-0">
                                        {isMaster ? (
                                            <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                                                <ShieldCheck className="w-6 h-6" />
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-muted-foreground group-hover:bg-white/10 group-hover:text-white transition-colors">
                                                <Key className="w-6 h-6" />
                                            </div>
                                        )}
                                        <div className={cn(
                                            "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0a0a0a]",
                                            isExpired ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                        )} />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-black text-white uppercase tracking-tighter truncate max-w-[240px]">
                                                {cookie.agencyName || cookie.email || cookie.targetId}
                                            </h3>
                                            {isMaster && (
                                                <span className="text-[9px] font-black uppercase bg-primary/20 text-primary px-2 py-0.5 rounded-full ring-1 ring-primary/30">Ativo p/ Admin</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">
                                            {cookie.email && <span className="text-primary/70">{cookie.targetId}</span>}
                                            <span className="w-1 h-1 rounded-full bg-white/20" />
                                            <span>Atualizado: {cookie.updated_at ? new Date(cookie.updated_at.seconds * 1000).toLocaleString() : 'Nunca'}</span>
                                        </div>
                                    </div>

                                    {/* Quota Remaining */}
                                    <div className="w-48 shrink-0 flex flex-col justify-center items-end">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-[10px] font-black uppercase text-muted-foreground">Créditos Restantes</span>
                                        </div>
                                        <span className={cn(
                                            "text-2xl font-black italic tracking-tighter",
                                            isExpired ? "text-red-500" : "text-primary"
                                        )}>
                                            {quotaTotal > 0 ? quotaTotal.toFixed(2) : '0.00'}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleRefreshQuota(cookie.id, cookie.targetId)}
                                            disabled={refreshingId === cookie.id}
                                            className="p-3 rounded-xl bg-white/5 border border-white/5 text-muted-foreground hover:text-white hover:bg-white/10 transition-all active:scale-95"
                                            title="Recarregar Cota de Nordy"
                                        >
                                            {refreshingId === cookie.id ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <RefreshCw className="w-4 h-4" />}
                                        </button>

                                        {!isMaster && (
                                            <button
                                                onClick={() => handleSetMaster(cookie.targetId)}
                                                className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all active:scale-95"
                                                title="Usar este cookie no Admin"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleDelete(cookie.targetId)}
                                            className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all active:scale-95"
                                            title="Deletar Cookies"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {cookies.length === 0 && (
                        <div className="p-20 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-center">
                            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                            <h3 className="text-lg font-black text-white/40 uppercase tracking-tighter italic">Nenhum Cookie Sincronizado</h3>
                            <p className="text-muted-foreground text-xs mt-2 max-w-sm">
                                Use a extensão Nordy Sync em qualquer agência para que os cookies apareçam aqui automaticamente.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
