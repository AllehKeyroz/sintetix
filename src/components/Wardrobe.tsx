"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Plus,
    ShoppingBag,
    Trash2,
    Maximize2,
    Loader2,
    Calendar,
    Tag,
    Shirt,
    Sun,
    Moon,
    Waves,
    Sparkles,
    Eye
} from "lucide-react"
import { cn } from "@/lib/utils"
import { db } from "@/lib/firebase"
import { collection, query, onSnapshot, orderBy, where } from "firebase/firestore"
import { deleteMoodboardItem } from "@/lib/actions"
import { AddItemModal } from "./AddItemModal"

export function Wardrobe({ influencerId }: { influencerId: string | null }) {
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<string>("all")

    useEffect(() => {
        if (!influencerId) {
            setLoading(false)
            return
        }

        const itemsRef = collection(db, "influencers", influencerId, "moodboard")
        const q = query(itemsRef, where("type", "==", "wardrobe"), orderBy("created_at", "desc"))

        const unsubscribe = onSnapshot(q, (snap) => {
            setItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
            setLoading(false)
        }, (err) => {
            console.error(err)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [influencerId])

    if (!influencerId) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-background p-8 text-center text-white">
                <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center mb-8 border border-white/5 shadow-2xl">
                    <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-3xl font-black tracking-tight mb-2 uppercase">Closet <span className="text-primary italic">Virtual</span></h2>
                <p className="text-muted-foreground max-w-sm mb-10 leading-relaxed text-sm">Organize as peças e coleções de cada influencer.</p>
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col bg-background p-12 overflow-hidden">
            <header className="flex justify-between items-end mb-12">
                <div>
                    <div className="flex items-center gap-4 mb-4 text-primary/60 font-bold text-[10px] uppercase tracking-[0.4em]">
                        <Shirt className="w-4 h-4" />
                        Virtual Apparel Inventory
                    </div>
                    <h2 className="text-5xl font-black tracking-tighter text-white uppercase leading-none">
                        Acervo de <span className="text-primary italic">Estilo</span>
                    </h2>
                </div>

                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-8 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-primary hover:text-white transition-all flex items-center gap-3"
                >
                    <Plus className="w-4 h-4" />
                    Catalogar Nova Peça
                </button>
            </header>

            {/* Collections / Categories */}
            <div className="flex gap-4 mb-10">
                {[
                    { id: "all", label: "Tudo", icon: Sparkles },
                    { id: "casual", label: "Streetwear", icon: Waves },
                    { id: "formal", label: "Evento/Gala", icon: Moon },
                    { id: "editorial", label: "Editorial", icon: Eye },
                ].map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={cn(
                            "px-6 py-3 rounded-2xl flex items-center gap-3 transition-all border font-black text-[10px] uppercase tracking-widest",
                            selectedCategory === cat.id
                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                : "bg-white/5 text-muted-foreground border-white/5 hover:bg-white/10 hover:text-white"
                        )}
                    >
                        <cat.icon className="w-3.5 h-3.5" />
                        {cat.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    </div>
                ) : items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-20 bg-white/[0.01] border border-dashed border-white/5 rounded-[3rem]">
                        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-6 border border-white/5">
                            <ShoppingBag className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-white">Guarda-roupa Vazio</h3>
                        <p className="text-sm text-muted-foreground max-w-xs">Organize as peças que definem a identidade visual do talento.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 pb-10">
                        {items.map((item, idx) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group bg-white/[0.02] rounded-[2rem] overflow-hidden border border-white/5 flex flex-col hover:border-primary/30 transition-all hover:bg-white/[0.04] relative group"
                            >
                                <div className="relative aspect-square overflow-hidden bg-secondary/10">
                                    <img src={item.url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />

                                    {/* Glass Overlay */}
                                    <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent translate-y-2 group-hover:translate-y-0 transition-transform">
                                        <p className="text-[10px] font-black text-white uppercase tracking-widest truncate leading-tight">{item.title}</p>
                                        <p className="text-[8px] font-bold text-primary uppercase tracking-[0.2em] mt-1 italic">Premium Collection</p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="absolute top-4 right-4 flex flex-col gap-2 translate-x-12 group-hover:translate-x-0 transition-transform duration-500">
                                        <button className="p-3 bg-white/10 backdrop-blur-xl rounded-2xl text-white hover:bg-primary transition-all">
                                            <Maximize2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteMoodboardItem(influencerId, item.id)}
                                            className="p-3 bg-white/10 backdrop-blur-xl rounded-2xl text-destructive hover:bg-destructive hover:text-white transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="absolute top-4 left-4">
                                        <div className="p-2 bg-black/40 backdrop-blur-md rounded-lg border border-white/10">
                                            <Tag className="w-3 h-3 text-white/50" />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Disponível no Acervo</span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground font-medium leading-relaxed italic line-clamp-2">
                                        {item.obs || "Nenhuma observação técnica cadastrada."}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {isAddModalOpen && (
                <AddItemModal
                    influencerId={influencerId}
                    defaultType="wardrobe"
                    onClose={() => setIsAddModalOpen(false)}
                />
            )}
        </div>
    )
}
