import { useState, useEffect } from "react"
import { Save, Loader2, Bot } from "lucide-react"
import { getGlobalPrompt, saveGlobalPrompt } from "@/lib/admin_actions"

export function AdminSettings() {
    const [prompt, setPrompt] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        async function load() {
            setPrompt(await getGlobalPrompt())
            setIsLoading(false)
        }
        load()
    }, [])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await saveGlobalPrompt(prompt)
            alert("Configurações salvas com sucesso!")
        } catch (err) {
            console.error(err)
            alert("Erro ao salvar o prompt.")
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-background pointer-events-none">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Carregando Configurações...</p>
            </div>
        )
    }

    return (
        <div className="w-full h-full bg-background overflow-y-auto p-4 md:p-8">
            <div className="max-w-3xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Configurações Globais</h1>
                    <p className="text-muted-foreground text-sm">Ajuste o comportamento do sistema e os motores de inteligência.</p>
                </div>

                <div className="bg-[#0c0c0e] border border-white/10 rounded-3xl p-6 shadow-2xl">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/20 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white leading-tight">Prompt do Agente Sintetix AI</h2>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Comportamento Base</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[9px] uppercase font-black text-muted-foreground tracking-widest ml-1">
                                Instruções de Sistema (System Prompt)
                            </label>
                            <textarea
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                className="w-full h-48 bg-background border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white/80 focus:ring-1 focus:ring-primary outline-none transition-all resize-none font-mono"
                                placeholder="Você é o Sintetix AI..."
                            />
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-primary hover:bg-primary/80 text-white px-6 py-3 rounded-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Salvar Configurações
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
