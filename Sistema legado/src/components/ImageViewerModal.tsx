"use client"
import { useState, useRef, useEffect } from "react"
import { X, ZoomIn, ZoomOut, Download, Maximize } from "lucide-react"

interface ImageViewerModalProps {
    url: string;
    alt?: string;
    onClose: () => void;
    onDownload?: () => void;
}

export function ImageViewerModal({ url, alt = "Imagem", onClose, onDownload }: ImageViewerModalProps) {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY * -0.005;
        setScale(prev => Math.min(Math.max(0.5, prev + delta), 5));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const isVideo = url.toLowerCase().includes(".mp4");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
            {/* Header Controls */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
                <div className="text-white font-bold text-sm tracking-widest">{alt}</div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setScale(s => Math.min(s + 0.5, 5))} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors" title="Zoom In">
                        <ZoomIn className="w-5 h-5" />
                    </button>
                    <button onClick={() => setScale(s => Math.max(s - 0.5, 0.5))} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors" title="Zoom Out">
                        <ZoomOut className="w-5 h-5" />
                    </button>
                    <button onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); }} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors" title="Reset">
                        <Maximize className="w-5 h-5" />
                    </button>
                    {onDownload && (
                        <button onClick={onDownload} className="p-2 bg-primary/80 hover:bg-primary rounded-lg text-white transition-colors ml-4 shadow-[0_0_15px_rgba(139,92,246,0.5)]" title={`Fazer Download ${isVideo ? '(MP4)' : '(JPG/PNG)'}`}>
                            <Download className="w-5 h-5" />
                        </button>
                    )}
                    <button onClick={onClose} className="p-2 bg-destructive/80 hover:bg-destructive rounded-lg text-white transition-colors ml-4" title="Fechar">
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Image Container */}
            <div
                className="w-full h-full overflow-hidden flex items-center justify-center cursor-move select-none"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {isVideo ? (
                    <video
                        src={url}
                        autoPlay
                        loop
                        controls
                        draggable={false}
                        className="max-w-[90vw] max-h-[90vh] object-contain transition-transform duration-75 ease-out"
                        style={{
                            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        }}
                    />
                ) : (
                    <img
                        src={url}
                        alt={alt}
                        draggable={false}
                        className="max-w-[90vw] max-h-[90vh] object-contain transition-transform duration-75 ease-out"
                        style={{
                            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        }}
                    />
                )}
            </div>

            {/* Helper Text */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-[10px] text-white/50 font-bold uppercase tracking-widest pointer-events-none">
                Use o scroll do mouse para zoom • Clique e arraste para mover
            </div>
        </div>
    )
}
