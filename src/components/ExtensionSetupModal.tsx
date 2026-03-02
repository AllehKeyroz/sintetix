"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Puzzle, Settings, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export function ExtensionSetupModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const { profile } = useAuth();
    const isSaaSAdmin = profile?.role === "admin";
    const agencyId = isSaaSAdmin ? "admin" : profile?.agencyId;

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
                            <p className="text-xs text-muted-foreground">Siga as instruções para conectar seu navegador ao motor de inteligência artificial da plataforma.</p>
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
                                                <span>https://sintetix.proposito.app</span>
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
                                    <button className="w-full mt-4 bg-primary text-white font-bold py-3 rounded-xl opacity-70 cursor-default">Clicar em "Enviar Automático"</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-white/5 bg-secondary/50 flex items-center justify-between">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 rounded-xl text-sm font-bold text-muted-foreground hover:text-white transition-colors"
                        >
                            Fechar
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center gap-2 px-6 py-2 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/20 rounded-xl text-sm font-bold transition-all"
                        >
                            Atualizar Página após Conectar
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
