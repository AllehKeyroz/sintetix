"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Puzzle, Settings, ArrowRight, Zap, Loader2, Key } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { saveNordyCookies } from "@/lib/actions";

export function ExtensionSetupModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const { profile } = useAuth();
    const [manualCookie, setManualCookie] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [activeSection, setActiveSection] = useState<"auto" | "manual">("auto");

    const isSaaSAdmin = profile?.role === "admin";
    const agencyId = isSaaSAdmin ? "admin" : (profile?.agencyId || "admin");

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(139,92,246,0.1)] overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-gradient-to-r from-primary/10 via-transparent to-transparent flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(139,92,246,0.3)] shrink-0">
                            <Puzzle className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-black text-white uppercase tracking-wider mb-1">Passaporte Sintetix</h2>
                            <div className="flex gap-4 mt-2">
                                <button
                                    onClick={() => setActiveSection("auto")}
                                    className={cn(
                                        "text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all",
                                        activeSection === "auto" ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-white"
                                    )}
                                >
                                    Sincronização Automática
                                </button>
                                <button
                                    onClick={() => setActiveSection("manual")}
                                    className={cn(
                                        "text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all",
                                        activeSection === "manual" ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-white"
                                    )}
                                >
                                    Configuração Manual (Fallback)
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-8 overflow-y-auto custom-scrollbar">
                        <div className="space-y-6">

                            {activeSection === "auto" ? (
                                <>
                                    {/* Step 1 */}
                                    <div className="relative pl-12">
                                        <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-primary/20 text-primary font-black flex items-center justify-center border border-primary/30">1</div>
                                        <h3 className="text-lg font-bold text-white mb-2">Baixe a Extensão</h3>
                                        <p className="text-sm text-white/60 mb-4 leading-relaxed">Baixe o pacote de comunicação oficial para o seu computador. Ele que permitirá o trânsito seguro em tempo real do A.I Studio.</p>
                                        <a
                                            href="/sintetix-nordy-link.zip"
                                            download="sintetix-nordy-link.zip"
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-xl hover:scale-105 active:scale-95 transition-all w-max"
                                        >
                                            <Download className="w-4 h-4" />
                                            Baixar ZIP da Extensão
                                        </a>
                                    </div>

                                    {/* Divider Line */}
                                    <div className="h-4 border-l-2 border-dashed border-white/10 ml-4"></div>

                                    {/* Step 2 */}
                                    <div className="relative pl-12">
                                        <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-primary/20 text-primary font-black flex items-center justify-center border border-primary/30">2</div>
                                        <h3 className="text-lg font-bold text-white mb-2">Extraia e Instale no Chrome</h3>
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-5 mt-3 space-y-3">
                                            <p className="text-sm text-white/80"><span className="text-primary font-bold mr-2">A.</span> Extraia (descompacte) o arquivo ZIP baixado em alguma pasta do seu computador.</p>
                                            <p className="text-sm text-white/80"><span className="text-primary font-bold mr-2">B.</span> No seu Google Chrome (ou Brave/Edge), acesse a página: <span className="bg-black px-2 py-1 rounded text-primary font-mono text-xs select-all">chrome://extensions/</span></p>
                                            <p className="text-sm text-white/80"><span className="text-primary font-bold mr-2">C.</span> Ative o <strong className="text-white">"Modo do desenvolvedor"</strong> no canto superior direito.</p>
                                            <p className="text-sm text-white/80"><span className="text-primary font-bold mr-2">D.</span> Clique em <strong className="text-white">"Carregar sem compactação"</strong> e selecione a pasta que você extraiu.</p>
                                        </div>
                                    </div>

                                    {/* Divider Line */}
                                    <div className="h-4 border-l-2 border-dashed border-white/10 ml-4"></div>

                                    {/* Step 3 */}
                                    <div className="relative pl-12">
                                        <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-primary/20 text-primary font-black flex items-center justify-center border border-primary/30">3</div>
                                        <h3 className="text-lg font-bold text-white mb-2">Sincronize sua Conta</h3>
                                        <p className="text-sm text-white/60 mb-4 leading-relaxed">
                                            Acesse o site <a href="https://nordy.ai" target="_blank" rel="noopener noreferrer" className="text-primary underline">Nordy.ai</a> e faça login com sua conta da empresa. Depois, clique no ícone da nossa Exensão recém-instalada no seu navegador.
                                        </p>

                                        <div className="bg-[#000] border border-primary/20 p-4 rounded-xl">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-3">Preencha assim na extensão:</h4>

                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-[10px] text-muted-foreground uppercase absolute bg-[#000] px-1 -mt-2 ml-2">URL da Instância</label>
                                                    <div className="border border-white/20 p-3 rounded-lg text-white/80 text-sm font-mono flex items-center justify-between group">
                                                        <span className="select-all">{typeof window !== 'undefined' ? window.location.origin : "https://sintetix.proposito.app"}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-muted-foreground uppercase absolute bg-[#000] px-1 -mt-2 ml-2">ID da Instância (Opcional)</label>
                                                    <div className="border border-white/20 p-3 rounded-lg text-white/80 text-sm font-mono flex items-center justify-between group">
                                                        <span className="select-all bg-white/5 py-1 px-2 rounded">{agencyId || "Pressione COPY no menu lateral"}</span>
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground mt-2 italic">* {isSaaSAdmin ? "O sistema detectou que você é Admin-Master." : "Esse token individual garante que seu consumo não se misture com as outras franquias."}</p>
                                                </div>
                                            </div>
                                            <p className="text-[9px] text-white/40 mt-4 text-center">Agora clique em <strong>"ENVIAR AUTOMATICAMENTE"</strong> na extensão.</p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex gap-3">
                                        <Settings className="w-5 h-5 text-amber-500 shrink-0" />
                                        <p className="text-xs text-amber-200/80 leading-relaxed">
                                            Use esta opção se a extensão não estiver conseguindo "falar" com a aplicação (comum em localhost).
                                            Para obter o cookie manual: No site da Nordy, aperte <strong>F12</strong> {'>'} Application {'>'} Cookies {'>'} Copie o valor de <strong>nordy-auth</strong>.
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">ID da Instância Destino</label>
                                            <input
                                                type="text"
                                                readOnly
                                                value={agencyId}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white/50 outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Valor do Cookie (nordy-auth)</label>
                                            <div className="relative">
                                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <textarea
                                                    value={manualCookie}
                                                    onChange={(e) => setManualCookie(e.target.value)}
                                                    rows={3}
                                                    placeholder="Cole aqui o valor do seu cookie nordy-auth ou a string completa..."
                                                    className="w-full bg-white/5 border border-white/10 focus:border-primary/50 rounded-xl pl-12 pr-4 py-3 text-sm font-mono text-white outline-none transition-all resize-none"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            onClick={async () => {
                                                if (!manualCookie.trim()) return alert("Cole o cookie primeiro!");
                                                setIsSaving(true);
                                                try {
                                                    await saveNordyCookies(agencyId, manualCookie, { email: profile?.email || null });
                                                    alert("Sucesso! Cookies salvos.");
                                                    setManualCookie("");
                                                    onClose();
                                                    window.location.reload();
                                                } catch (e) {
                                                    alert("Erro de conexão com o servidor.");
                                                } finally {
                                                    setIsSaving(false);
                                                }
                                            }}
                                            disabled={isSaving || !manualCookie}
                                            className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
                                        >
                                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                                            Salvar Configuração Manualmente
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-white/5 bg-secondary/50 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <button
                            onClick={onClose}
                            className="w-full md:w-auto px-6 py-2 rounded-xl text-sm font-bold text-muted-foreground hover:text-white transition-colors"
                        >
                            Fechar
                        </button>

                        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                            <button
                                onClick={() => {
                                    window.postMessage({ type: "SINTETIX_REQUEST_SYNC" }, "*");
                                    alert("Comando de sincronização enviado para a extensão!");
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/20 rounded-xl text-sm font-bold transition-all"
                            >
                                <Zap className="w-4 h-4" />
                                Requisitar Sincronização
                            </button>

                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/20 rounded-xl text-sm font-bold transition-all"
                            >
                                Atualizar Página
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
