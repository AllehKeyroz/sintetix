import { useState, useEffect } from "react"
import { X, Loader2 } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, query, onSnapshot, orderBy } from "firebase/firestore"

interface GalleryPickerProps {
    influencerId: string;
    onSelect: (url: string) => void;
    onClose: () => void;
}

export function GalleryPickerModal({ influencerId, onSelect, onClose }: GalleryPickerProps) {
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const itemsRef = collection(db, "influencers", influencerId, "moodboard")
        const qItems = query(itemsRef, orderBy("created_at", "desc"))

        const unsubItems = onSnapshot(qItems, (snap) => {
            setItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
            setLoading(false)
        })

        return () => unsubItems()
    }, [influencerId])

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#0b0b0d] w-full max-w-4xl max-h-[85vh] flex flex-col rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-white/5">
                    <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Selecionar da <span className="text-primary italic">Galeria</span></h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Escolha uma imagem de base para a geração</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 no-scrollbar custom-scrollbar">
                    {loading ? (
                        <div className="h-full min-h-[400px] flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="h-full min-h-[400px] flex items-center justify-center text-muted-foreground font-black text-[10px] uppercase tracking-widest">
                            Nenhuma foto na galeria ainda.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {items.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => onSelect(item.url)}
                                    className="relative aspect-[3/4] rounded-[1.5rem] overflow-hidden border border-white/5 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(var(--primary),0.3)] transition-all group group/img active:scale-95"
                                >
                                    <img src={item.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-[2px]">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-primary border border-primary/20 px-4 py-2 rounded-xl bg-primary/10 shadow-xl">Usar</span>
                                    </div>
                                    <div className="absolute bottom-3 left-3 right-3 text-left translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                        <p className="text-[9px] font-bold text-white uppercase truncate">{item.title}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
