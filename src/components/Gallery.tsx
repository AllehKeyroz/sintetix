"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Plus,
    Folder,
    Image as ImageIcon,
    ChevronLeft,
    Trash2,
    Maximize2,
    Camera,
    Loader2,
    Grid3X3,
    MoreHorizontal,
    Star
} from "lucide-react"
import { cn } from "@/lib/utils"
import { db } from "@/lib/firebase"
import { collection, query, onSnapshot, orderBy } from "firebase/firestore"
import { createAlbum, deleteAlbum, deleteMoodboardItem } from "@/lib/actions"
import { AddItemModal } from "./AddItemModal"
import { ImageViewerModal } from "./ImageViewerModal"
import { downloadFileToClient } from "@/lib/downloadFile"

export function Gallery({ influencerId }: { influencerId: string | null }) {
    const [albums, setAlbums] = useState<any[]>([])
    const [items, setItems] = useState<any[]>([])
    const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null)
    const [isCreateAlbumModalOpen, setIsCreateAlbumModalOpen] = useState(false)
    const [isAddPhotoModalOpen, setIsAddPhotoModalOpen] = useState(false)
    const [newAlbumName, setNewAlbumName] = useState("")
    const [loading, setLoading] = useState(true)
    const [viewerUrl, setViewerUrl] = useState<string | null>(null)
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, message: "", onConfirm: () => { } })

    useEffect(() => {
        if (!influencerId) {
            setLoading(false)
            return
        }

        const albumsRef = collection(db, "influencers", influencerId, "albums")
        const qAlbums = query(albumsRef, orderBy("created_at", "desc"))

        const unsubAlbums = onSnapshot(qAlbums, (snap) => {
            setAlbums(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        })

        const itemsRef = collection(db, "influencers", influencerId, "moodboard")
        const qItems = query(itemsRef, orderBy("created_at", "desc"))

        const unsubItems = onSnapshot(qItems, (snap) => {
            setItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
            setLoading(false)
        })

        return () => {
            unsubAlbums()
            unsubItems()
        }
    }, [influencerId])

    const handleCreateAlbum = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!influencerId || !newAlbumName) return
        await createAlbum(influencerId, { name: newAlbumName, description: "" })
        setNewAlbumName("")
        setIsCreateAlbumModalOpen(false)
    }

    const handleDeleteAlbum = async (id: string) => {
        if (confirm("Deseja apagar este álbum? As fotos não serão apagadas, mas ficarão sem álbum.")) {
            await deleteAlbum(influencerId!, id)
        }
    }

    const filteredItems = selectedAlbumId
        ? (selectedAlbumId === "unorganized" ? items.filter(i => !i.albumId && i.type !== 'wardrobe') : items.filter(i => i.albumId === selectedAlbumId))
        : items.filter(i => i.type !== 'wardrobe')

    const selectedAlbum = albums.find(a => a.id === selectedAlbumId)

    if (!influencerId) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-background p-8 text-center text-white">
                <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center mb-8 border border-white/5 shadow-2xl">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-3xl font-black tracking-tight mb-2 uppercase text-white">Curadoria <span className="text-primary italic">Visual</span></h2>
                <p className="text-muted-foreground max-w-sm leading-relaxed text-sm">Acesse o banco de imagens e editoriais exclusivos.</p>
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-y-auto no-scrollbar bg-background p-4 md:p-12">
            <div className="max-w-[2000px] mx-auto">
                <header className="flex flex-col md:flex-row md:justify-between items-start md:items-end mb-8 gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2 text-primary/60 font-bold text-[9px] uppercase tracking-[0.3em]">
                            <Camera className="w-3.5 h-3.5" />
                            Acervo Fotográfico Sintetix
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-white uppercase leading-none">
                            Editoriais <span className="text-primary italic">&</span> Media
                        </h2>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        {selectedAlbumId ? (
                            <button
                                onClick={() => setIsAddPhotoModalOpen(true)}
                                className="px-8 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-primary hover:text-white transition-all flex items-center justify-center sm:justify-start gap-3 w-full sm:w-auto"
                            >
                                <Plus className="w-4 h-4" />
                                Importar Fotos
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsCreateAlbumModalOpen(true)}
                                className="px-8 py-4 bg-white/5 text-white border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center sm:justify-start gap-3 w-full sm:w-auto"
                            >
                                <Folder className="w-4 h-4" />
                                Novo Álbum
                            </button>
                        )}
                    </div>
                </header>

                {/* Breadcrumb / Nav */}
                <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-4 no-scrollbar border-b border-white/5">
                    <button
                        onClick={() => setSelectedAlbumId(null)}
                        className={cn(
                            "px-6 py-3 rounded-2xl flex items-center gap-3 transition-all border font-black text-[10px] uppercase tracking-widest whitespace-nowrap",
                            selectedAlbumId === null
                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                : "bg-white/5 text-muted-foreground border-white/5 hover:bg-white/10 hover:text-white"
                        )}
                    >
                        <Grid3X3 className="w-3.5 h-3.5" />
                        Visão Geral
                    </button>

                    <div className="w-[1px] h-6 bg-white/10 mx-2" />

                    <button
                        onClick={() => setSelectedAlbumId("unorganized")}
                        className={cn(
                            "px-6 py-3 rounded-2xl flex items-center gap-3 transition-all border font-black text-[10px] uppercase tracking-widest whitespace-nowrap",
                            selectedAlbumId === "unorganized"
                                ? "bg-primary text-white border-primary"
                                : "bg-white/5 text-muted-foreground border-white/5"
                        )}
                    >
                        Fotos Avulsas
                    </button>

                    {albums.map((album) => (
                        <button
                            key={album.id}
                            onClick={() => setSelectedAlbumId(album.id)}
                            className={cn(
                                "px-6 py-3 rounded-2xl flex items-center gap-3 transition-all border font-black text-[10px] uppercase tracking-widest whitespace-nowrap",
                                selectedAlbumId === album.id
                                    ? "bg-primary text-white border-primary"
                                    : "bg-white/5 text-muted-foreground border-white/5 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            <Folder className="w-3.5 h-3.5" />
                            {album.name}
                        </button>
                    ))}
                </div>

                <div className="pb-12">
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <div className="h-full flex items-center justify-center">
                                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-20 bg-white/[0.01] border border-dashed border-white/5 rounded-[3rem]">
                                <ImageIcon className="w-10 h-10 text-muted-foreground mb-4" />
                                <p className="text-white font-black uppercase text-[10px] tracking-[0.2em]">Álbum Vazio</p>
                                <p className="text-muted-foreground text-[10px] mt-1">Carregue imagens para este editorial.</p>
                            </div>
                        ) : (
                            <motion.div
                                key={selectedAlbumId || 'all'}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-12"
                            >
                                {filteredItems.map((item, idx) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.03 }}
                                        className="group bg-white/[0.02] rounded-[2.5rem] overflow-hidden aspect-[3/4] border border-white/5 relative hover:border-primary/50 transition-all cursor-pointer"
                                        onClick={() => setViewerUrl(item.url)}
                                    >
                                        {item.url?.toLowerCase().includes('.mp4') ? (
                                            <video src={item.url} autoPlay loop muted playsInline className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]" />
                                        ) : (
                                            <img src={item.url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]" />
                                        )}

                                        {/* Action Overlays */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500">
                                            <div className="absolute top-6 right-6 flex flex-col gap-2 scale-75 group-hover:scale-100 transition-transform origin-top-right">
                                                <button
                                                    className="p-3 bg-white/10 backdrop-blur-xl rounded-2xl text-white hover:bg-white/20 transition-all"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setViewerUrl(item.url);
                                                    }}
                                                >
                                                    <Maximize2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setConfirmDialog({
                                                            isOpen: true,
                                                            message: "Tem certeza que deseja excluir esta foto da galeria? Isso não poderá ser desfeito.",
                                                            onConfirm: async () => {
                                                                setConfirmDialog({ ...confirmDialog, isOpen: false });
                                                                await deleteMoodboardItem(influencerId, item.id);
                                                            }
                                                        });
                                                    }}
                                                    className="p-3 bg-destructive/10 backdrop-blur-xl rounded-2xl text-destructive hover:bg-destructive hover:text-white transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="absolute bottom-8 left-8 right-8 translate-y-4 group-hover:translate-y-0 transition-transform">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="px-2 py-0.5 bg-primary/20 backdrop-blur-md rounded text-[7px] font-black text-primary uppercase border border-primary/20 tracking-widest">
                                                        {item.type === 'highlight' ? 'Destaque' : 'Interno'}
                                                    </div>
                                                    {item.type === 'highlight' && <Star className="w-3 h-3 text-primary fill-primary" />}
                                                </div>
                                                <p className="text-sm font-black text-white leading-tight uppercase tracking-tight">{item.title}</p>
                                                <p className="text-[10px] text-white/40 mt-1 font-medium truncate italic leading-relaxed">{item.obs || 'Sem notas técnicas'}</p>
                                            </div>
                                        </div>

                                        {/* Badge Always Visible for Highlights */}
                                        {item.type === 'highlight' && (
                                            <div className="absolute top-6 left-6 p-2 bg-primary/80 backdrop-blur-md rounded-xl shadow-lg group-hover:opacity-0 transition-opacity">
                                                <Star className="w-3 h-3 text-white fill-white" />
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Modal de Criar Álbum */}
                {
                    isCreateAlbumModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
                            <div className="bg-[#0b0b0d] w-full max-w-md rounded-[3rem] p-12 border border-white/10 shadow-2xl">
                                <div className="mb-10 text-center">
                                    <h3 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">Novo <span className="text-primary italic">Álbum</span></h3>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Criação de Diretório Editorial</p>
                                </div>

                                <form onSubmit={handleCreateAlbum} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nome do Editorial</label>
                                        <input
                                            autoFocus
                                            value={newAlbumName}
                                            onChange={(e) => setNewAlbumName(e.target.value)}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-8 py-5 text-sm font-black text-white focus:ring-1 focus:ring-primary outline-none"
                                            placeholder="Ex: Vogue Paris 2026"
                                        />
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button type="button" onClick={() => setIsCreateAlbumModalOpen(false)} className="flex-1 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-white transition-all">Cancelar</button>
                                        <button type="submit" className="flex-1 py-5 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-primary hover:text-white transition-all">Confirmar Criacão</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                {isAddPhotoModalOpen && (
                    <AddItemModal
                        influencerId={influencerId}
                        defaultAlbumId={selectedAlbumId !== "unorganized" ? selectedAlbumId || undefined : undefined}
                        defaultType="post"
                        onClose={() => setIsAddPhotoModalOpen(false)}
                    />
                )}

                {viewerUrl && (
                    <ImageViewerModal
                        url={viewerUrl}
                        onClose={() => setViewerUrl(null)}
                        onDownload={() => downloadFileToClient(viewerUrl)}
                    />
                )}

                {confirmDialog.isOpen && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                        <div className="bg-[#0b0b0d] w-full max-w-sm rounded-[2rem] p-8 border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-200">
                            <div className="text-center mb-6">
                                <Trash2 className="w-12 h-12 text-red-500/50 mx-auto mb-4" />
                                <h3 className="text-white font-black uppercase text-sm tracking-widest mb-2">Confirmar Exclusão</h3>
                                <p className="text-muted-foreground text-xs leading-relaxed">{confirmDialog.message}</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setConfirmDialog(p => ({ ...p, isOpen: false }))} className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest transition-all">Cancelar</button>
                                <button onClick={confirmDialog.onConfirm} className="flex-1 py-3 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-widest transition-all">Excluir</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
