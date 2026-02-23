"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useMoodboard } from "@/hooks/useFirebase"
import { deleteMoodboardItem } from "@/lib/actions"
import { AddItemModal } from "./AddItemModal"

import {
    Plus as PlusIcon,
    Maximize2 as MaximizeIcon,
    Terminal as TerminalIcon,
    MessageSquare as MsgIcon,
    Trash2 as TrashIcon,
    Camera as CameraIcon
} from "lucide-react"

export function Moodboard({ influencerId, filters = {} }: { influencerId: string, filters?: { type?: string } }) {
    const { items } = useMoodboard(influencerId, filters)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const handleDelete = async (itemId: string) => {
        if (confirm("Deseja remover esta referência da galeria do influencer?")) {
            await deleteMoodboardItem(influencerId, itemId)
        }
    }

    return (
        <div className="mt-12 mb-20 px-1">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                        <CameraIcon className="w-6 h-6 text-primary" />
                        Galeria de Referências & Estilo
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">Acervo visual de fotos âncora, lookbook e histórico de postagens.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-full text-sm font-bold shadow-[0_0_15px_rgba(139,92,246,0.4)] hover:bg-primary/90 transition-all font-bold"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Adicionar Foto
                    </button>
                </div>
            </div>

            {items.length === 0 ? (
                <div className="py-20 text-center glass-card rounded-[2rem] border-dashed border-white/10">
                    <p className="text-muted-foreground italic">Nenhuma referência visual cadastrada ainda.</p>
                </div>
            ) : (
                <div className="grid grid-cols-4 gap-6">
                    {items.map((item, idx) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="group glass-card rounded-2xl overflow-hidden flex flex-col h-full ring-1 ring-white/5"
                        >
                            <div className="relative aspect-[4/5] overflow-hidden">
                                <img
                                    src={item.url}
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute top-3 left-3 flex gap-2">
                                    <span className="px-2 py-1 bg-black/60 backdrop-blur-md rounded-md text-[9px] font-bold text-white uppercase border border-white/10 tracking-wider">
                                        {item.type === 'anchor' ? 'Rosto Âncora' : item.type === 'wardrobe' ? 'Lookbook' : 'Postagem'}
                                    </span>
                                </div>
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <button className="p-3 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors">
                                        <MaximizeIcon className="w-5 h-5 text-white" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-3 bg-destructive/20 backdrop-blur-md rounded-full hover:bg-destructive/40 transition-colors"
                                    >
                                        <TrashIcon className="w-5 h-5 text-destructive-foreground" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 flex-1 flex flex-col">
                                <h4 className="font-bold text-xs mb-3 truncate group-hover:text-primary transition-colors">{item.title}</h4>

                                <div className="space-y-3 mt-auto">
                                    {item.prompt && (
                                        <div className="bg-secondary/40 p-2.5 rounded-xl border border-border/40">
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                <TerminalIcon className="w-3 h-3 text-primary" />
                                                <span className="text-[9px] font-extrabold uppercase tracking-tight text-primary/80">Contexto Visual</span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground leading-tight italic line-clamp-2">
                                                "{item.prompt}"
                                            </p>
                                        </div>
                                    )}

                                    {item.obs && (
                                        <div className="p-2.5 border-l-2 border-accent/30 bg-accent/5 rounded-r-xl">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <MsgIcon className="w-3 h-3 text-accent" />
                                                <span className="text-[9px] font-extrabold uppercase tracking-tight text-accent/80">Notas</span>
                                            </div>
                                            <p className="text-[10px] text-foreground/70 leading-tight line-clamp-2">
                                                {item.obs}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <AddItemModal
                    influencerId={influencerId}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    )
}
