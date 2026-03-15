"use client"

import { useState, useEffect } from "react"
import { addMoodboardItem } from "@/lib/actions"
import { Plus, X, Upload, Camera, MessageSquare, Image, Folder, Loader2 } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, query, onSnapshot, orderBy } from "firebase/firestore"
import { cn } from "@/lib/utils"

interface AddItemModalProps {
    influencerId: string
    onClose: () => void
    defaultType?: "anchor" | "wardrobe" | "post" | "highlight"
    defaultAlbumId?: string | null
}

export function AddItemModal({ influencerId, onClose, defaultType, defaultAlbumId }: AddItemModalProps) {
    const [loading, setLoading] = useState(false)
    const [albums, setAlbums] = useState<any[]>([])
    const [formData, setFormData] = useState({
        title: "",
        type: defaultType || "post" as "anchor" | "wardrobe" | "post" | "highlight",
        prompt: "",
        obs: "",
        albumId: defaultAlbumId || "",
        categoryId: "",
        file: null as File | null
    })
    const [wardrobeCategories, setWardrobeCategories] = useState<any[]>([])

    useEffect(() => {
        if (!influencerId) return
        const albumsRef = collection(db, "influencers", influencerId, "albums")
        const q = query(albumsRef, orderBy("created_at", "desc"))
        const unsub = onSnapshot(q, (snap) => {
            setAlbums(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        })

        const catRef = collection(db, "influencers", influencerId, "wardrobe_categories")
        const catUnsub = onSnapshot(query(catRef, orderBy("created_at", "asc")), (snap) => {
            setWardrobeCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        })

        return () => {
            unsub()
            catUnsub()
        }
    }, [influencerId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.file || !formData.title) return alert("Preencha o título e selecione uma imagem!")

        setLoading(true)
        try {
            await addMoodboardItem(influencerId, {
                title: formData.title,
                type: formData.type,
                imageFile: formData.file,
                prompt: formData.prompt,
                obs: formData.obs,
                albumId: formData.albumId || null,
                categoryId: formData.categoryId || null
            })
            onClose()
        } catch (error) {
            console.error(error)
            alert("Erro ao salvar item.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <div className="glass-card w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 relative">
                <div className="flex items-center justify-between p-8 border-b border-white/5">
                    <h3 className="text-2xl font-bold tracking-tight">
                        Adicionar à <span className="text-primary italic">Coleção</span>
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-12 gap-8">
                        {/* Imagem */}
                        <div className="col-span-12 lg:col-span-5">
                            <div className="relative group aspect-square">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                />
                                <div className={`h-full border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all relative overflow-hidden ${formData.file ? 'border-primary bg-primary/5' : 'border-white/10 group-hover:border-primary/40'}`}>
                                    {formData.file ? (
                                        <div className="flex flex-col items-center">
                                            <Upload className="w-8 h-8 mb-2 text-primary" />
                                            <p className="text-[10px] font-bold text-primary truncate px-4 max-w-full text-center">
                                                {formData.file.name}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center text-center p-4">
                                            <Camera className="w-10 h-10 mb-4 text-muted-foreground opacity-50" />
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                                                Carregar Imagem<br /><span className="text-[9px] font-normal opacity-60">(Fotos ou Peças)</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Campos */}
                        <div className="col-span-12 lg:col-span-7 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">Título ou Referência</label>
                                <input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-secondary/30 border border-white/5 rounded-2xl px-5 py-4 text-sm focus:ring-1 focus:ring-primary outline-none"
                                    placeholder="Ex: Look Streetwear #01"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">Categoria Principal</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                        className="w-full bg-secondary/30 border border-white/5 rounded-2xl px-5 py-4 text-sm focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="post" className="bg-[#0c0c0e]">Foto de Galeria</option>
                                        <option value="highlight" className="bg-[#0c0c0e]">Destaque Público (Share)</option>
                                        <option value="wardrobe" className="bg-[#0c0c0e]">Peça de Roupa</option>
                                        <option value="anchor" className="bg-[#0c0c0e]">Referência de Rosto</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">Vincular Álbum</label>
                                    <select
                                        value={formData.albumId}
                                        onChange={(e) => setFormData({ ...formData, albumId: e.target.value })}
                                        className="w-full bg-secondary/30 border border-white/5 rounded-2xl px-5 py-4 text-sm focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer disabled:opacity-50"
                                        disabled={formData.type === 'wardrobe'}
                                    >
                                        <option value="" className="bg-[#0c0c0e]">Nenhum (Álbum)</option>
                                        {albums.map(album => (
                                            <option key={album.id} value={album.id} className="bg-[#0c0c0e]">{album.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {formData.type === 'wardrobe' && (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">Categoria do Guarda-Roupa</label>
                                    <select
                                        value={formData.categoryId}
                                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                        className="w-full bg-secondary/30 border border-white/5 rounded-2xl px-5 py-4 text-sm focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="" className="bg-[#0c0c0e]">Selecione uma categoria...</option>
                                        {wardrobeCategories.map(cat => (
                                            <option key={cat.id} value={cat.id} className="bg-[#0c0c0e]">{cat.label}</option>
                                        ))}
                                    </select>
                                    {wardrobeCategories.length === 0 && (
                                        <p className="text-[9px] text-primary/60 italic ml-1 mt-1">
                                            Vá em Guarda-roupa &gt; Categorias para criar uma nova.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                            <Image className="w-3 h-3 text-primary" />
                            <label className="text-[10px] uppercase font-bold text-primary tracking-widest">Contexto Visual / Referência</label>
                        </div>
                        <textarea
                            value={formData.prompt}
                            onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                            rows={2}
                            className="w-full bg-secondary/30 border border-white/5 rounded-2xl px-5 py-4 text-xs italic text-muted-foreground focus:ring-1 focus:ring-primary outline-none resize-none"
                            placeholder="Descreva as características técnicas, cenário ou referências..."
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                            <MessageSquare className="w-3 h-3 text-accent" />
                            <label className="text-[10px] uppercase font-bold text-accent tracking-widest">Notas Estratégicas</label>
                        </div>
                        <textarea
                            value={formData.obs}
                            onChange={(e) => setFormData({ ...formData, obs: e.target.value })}
                            rows={2}
                            className="w-full bg-secondary/30 border border-white/5 rounded-2xl px-5 py-4 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none resize-none"
                            placeholder="Insira notas sobre estilo, performance ou uso recomendado..."
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-5 bg-primary text-white rounded-3xl font-bold text-sm shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Sincronizando Acervo...
                            </>
                        ) : (
                            <>
                                <Plus className="w-5 h-5" />
                                Confirmar Inclusão
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
