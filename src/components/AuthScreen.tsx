"use client"

import { useState } from "react"
import { auth } from "@/lib/firebase"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"
import { motion, AnimatePresence } from "framer-motion"
import { LogIn, UserPlus, ShieldCheck, Mail, Lock, Loader2, Sparkles, Zap, Shield, Crown } from "lucide-react"
import { db } from "@/lib/firebase"
import { doc, setDoc, Timestamp } from "firebase/firestore"

export function AuthScreen() {
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password)
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password)
                const user = userCredential.user

                // O Firebase Auth já autentica o usuário imediatamente após o registro.
                // Agora que ele está autenticado, podemos gravar no Firestore.
                const agencyId = user.uid

                // 1. Criar a Agência associada a este usuário
                await setDoc(doc(db, "agencies", agencyId), {
                    name: "Sintetix Agency",
                    ownerId: user.uid,
                    created_at: Timestamp.now()
                })

                // 2. Criar o perfil do usuário vinculado à agência
                await setDoc(doc(db, "users", user.uid), {
                    email: user.email,
                    agencyId: agencyId,
                    role: 'user', // Você mudará manualmente para 'admin' no console para o primeiro usuário
                    name: email.split('@')[0],
                    created_at: Timestamp.now()
                })
            }
        } catch (err: any) {
            console.error(err)
            setError("Falha na autenticação. Verifique suas credenciais.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#020203] relative overflow-hidden p-6 font-sans">
            {/* Cinematic Background Elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_50%)]" />
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[160px] animate-pulse pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none" />

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />

            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
                {/* Left Side: Branding/Visual */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="hidden lg:block space-y-12"
                >
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.2)] rotate-6">
                            <Shield className="w-10 h-10 text-black -rotate-6" />
                        </div>
                        <div>
                            <h1 className="text-6xl font-black tracking-tighter text-white uppercase leading-none">
                                Sintetix<br /><span className="text-primary italic">Agency</span>
                            </h1>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.6em] mt-4">Autonomous Influencer Management</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="flex items-start gap-6 group">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-all">
                                <Sparkles className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-white font-black text-sm uppercase tracking-widest mb-2 group-hover:text-primary transition-colors">Identidades Sintéticas</h3>
                                <p className="text-muted-foreground text-xs leading-relaxed font-medium">Gestão avançada de personagens digitais e narrativas transmídia para marcas globais.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-6 group">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-all">
                                <Zap className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-white font-black text-sm uppercase tracking-widest mb-2 group-hover:text-primary transition-colors">Escalabilidade Ilimitada</h3>
                                <p className="text-muted-foreground text-xs leading-relaxed font-medium">Controle total sobre cronogramas, acervo visual e parcerias em um único ecossistema.</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-12">
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Acesso Restrito a Agentes Certificados</span>
                        </div>
                    </div>
                </motion.div>

                {/* Right Side: Auth Form */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-md mx-auto"
                >
                    <div className="bg-[#0c0c0e]/80 backdrop-blur-3xl p-6 md:p-12 rounded-[2rem] md:rounded-[3.5rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden">
                        <div className="lg:hidden flex flex-col items-center mb-8 md:mb-12">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-white flex items-center justify-center shadow-2xl mb-4 md:mb-6">
                                <Crown className="w-6 h-6 md:w-8 md:h-8 text-black" />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase leading-none">Sintetix <span className="text-primary italic">Agency</span></h2>
                        </div>

                        <div className="mb-8 md:mb-12">
                            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase leading-none mb-4">
                                {isLogin ? 'Bem-vindo ao' : 'Junte-se ao'}<br />
                                <span className="text-primary">Comando Central</span>
                            </h2>
                            <p className="text-[8px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                                {isLogin ? 'Obrigatória a Identificação Visual' : 'Inicie o Processo de Certificação'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Frequência Digital (Email)</label>
                                <div className="relative group">
                                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 md:pl-14 pr-4 md:pr-6 py-4 md:py-5 text-xs md:text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-white/10"
                                        placeholder="agente@sintetix.agency"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Chave de Encriptação (Senha)</label>
                                <div className="relative group">
                                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 md:pl-14 pr-4 md:pr-6 py-4 md:py-5 text-xs md:text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-white/10"
                                        placeholder="••••••••••••"
                                    />
                                </div>
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3"
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                                        <p className="text-[10px] text-destructive font-black uppercase tracking-tight">Falha na Autenticação</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-6 bg-white text-black rounded-3xl font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl hover:bg-primary hover:text-white transition-all disabled:opacity-50 relative overflow-hidden group"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />
                                ) : (
                                    <span className="flex items-center justify-center gap-3">
                                        Confirmar Acesso
                                        <Zap className="w-3 h-3fill-current" />
                                    </span>
                                )}
                            </button>
                        </form>

                        <div className="mt-12 pt-8 border-t border-white/5 text-center">
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-[10px] text-muted-foreground hover:text-white transition-all font-black uppercase tracking-[0.2em]"
                            >
                                {isLogin ? "Não possui credenciais? Solicite Acesso" : "Já é um agente oficial? Faça o Login"}
                            </button>
                        </div>

                        {/* Decorative Dot Line */}
                        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
