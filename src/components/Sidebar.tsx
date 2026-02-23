"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  LayoutDashboard,
  Image,
  Calendar,
  Users,
  Settings,
  ChevronRight,
  User,
  LogOut,
  LucideIcon,
  Plus,
  Shield,
  ShoppingBag,
  ExternalLink,
  Crown,
  Loader2 as LoaderIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { useInfluencers } from "@/hooks/useFirebase"
import { auth } from "@/lib/firebase"
import { signOut } from "firebase/auth"
import { ModuleType } from "@/lib/actions"

interface NavItemProps {
  icon: LucideIcon
  label: string
  active?: boolean
  onClick?: () => void
}

function NavItem({ icon: Icon, label, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
        active
          ? "bg-primary/10 text-primary border border-primary/20"
          : "text-muted-foreground hover:bg-white/5 hover:text-white"
      )}
    >
      <Icon className={cn("w-4 h-4", active ? "text-primary" : "group-hover:text-white")} />
      <span className={cn("font-bold text-[11px] uppercase tracking-wider", active ? "opacity-100" : "opacity-70 group-hover:opacity-100")}>{label}</span>

      {active && (
        <motion.div
          layoutId="active-indicator"
          className="absolute left-0 w-1 h-4 bg-primary rounded-r-full"
        />
      )}
    </button>
  )
}

export function Sidebar({
  onSelectInfluencer,
  selectedId,
  activeModule,
  onModuleChange
}: {
  onSelectInfluencer: (id: string | null) => void,
  selectedId: string | null,
  activeModule: ModuleType,
  onModuleChange: (module: ModuleType) => void
}) {
  const { user } = useAuth()
  const { influencers, loading } = useInfluencers()

  return (
    <aside className="w-72 h-full border-r border-white/5 bg-[#050505] flex flex-col relative z-30">
      {/* Brand Header */}
      <div className="p-8 pb-4">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)]">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tight text-white uppercase italic leading-none">
              Elite <span className="text-primary not-italic">Agency</span>
            </h1>
            <p className="text-[7px] text-muted-foreground font-black uppercase tracking-[0.4em] mt-1">Management Suite</p>
          </div>
        </div>

        {/* Influencer Selector */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em]">Influencers</h3>
            <button
              onClick={() => onSelectInfluencer(null)}
              className="w-5 h-5 rounded-md bg-white/5 text-muted-foreground hover:bg-primary hover:text-white flex items-center justify-center transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <div className="py-4 flex justify-center"><LoaderIcon className="w-4 h-4 animate-spin text-primary" /></div>
            ) : (
              influencers.map((inf) => (
                <button
                  key={inf.id}
                  onClick={() => onSelectInfluencer(inf.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2.5 rounded-xl transition-all group border border-transparent",
                    selectedId === inf.id
                      ? "bg-white/5 border-white/10 shadow-lg"
                      : "hover:bg-white/[0.03]"
                  )}
                >
                  <div className="w-9 h-9 rounded-lg bg-secondary border border-white/5 overflow-hidden shrink-0">
                    {inf.image ? (
                      <img src={inf.image} alt={inf.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-muted-foreground">{inf.name.charAt(0)}</div>
                    )}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className={cn("text-xs font-bold transition-all truncate", selectedId === inf.id ? "text-white" : "text-muted-foreground group-hover:text-white")}>
                      {inf.name}
                    </p>
                  </div>
                  {selectedId === inf.id && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        <NavItem
          icon={User}
          label="Identidade"
          active={activeModule === "identity"}
          onClick={() => onModuleChange("identity")}
        />
        <NavItem
          icon={Image}
          label="Galeria"
          active={activeModule === "gallery"}
          onClick={() => onModuleChange("gallery")}
        />
        <NavItem
          icon={ShoppingBag}
          label="Guarda-Roupa"
          active={activeModule === "wardrobe"}
          onClick={() => onModuleChange("wardrobe")}
        />
        <NavItem
          icon={Calendar}
          label="Calendário"
          active={activeModule === "calendar"}
          onClick={() => onModuleChange("calendar")}
        />
        <NavItem
          icon={Crown}
          label="Financeiro/CRM"
          active={activeModule === "crm"}
          onClick={() => onModuleChange("crm")}
        />
      </nav>

      {/* Footer Info & Logout */}
      <div className="p-6 mt-auto">
        {selectedId && (
          <div className="mb-6 px-4 py-3 bg-white/[0.02] border border-white/5 rounded-2xl group transition-all hover:border-primary/20">
            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-2">Public Access</p>
            <button
              onClick={() => {
                const url = `${window.location.origin}/share/${selectedId}`
                navigator.clipboard.writeText(url)
                alert("Link copiado!")
              }}
              className="flex items-center gap-2 text-[9px] font-bold text-white/40 hover:text-primary transition-colors w-full"
            >
              <ExternalLink className="w-3 h-3" />
              <span className="truncate">share/{selectedId.slice(0, 8)}...</span>
            </button>
          </div>
        )}

        <div className="pt-6 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] font-black text-primary shrink-0">
              {user?.email?.[0].toUpperCase() || "A"}
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-bold text-white truncate leading-none mb-1">{user?.email?.split('@')[0]}</p>
              <p className="text-[7px] text-muted-foreground uppercase tracking-widest font-black opacity-50">Admin</p>
            </div>
          </div>
          <button
            onClick={() => signOut(auth)}
            className="w-8 h-8 flex items-center justify-center hover:bg-destructive/10 rounded-lg group transition-all"
          >
            <LogOut className="w-3.5 h-3.5 text-muted-foreground group-hover:text-destructive" />
          </button>
        </div>
      </div>
    </aside>
  )
}
