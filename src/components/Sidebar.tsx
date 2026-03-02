"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
  Loader2 as LoaderIcon,
  ChevronDown,
  Check,
  Sparkles,
  LayoutPanelLeft,
  Key,
  Copy
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
  const { user, profile } = useAuth()
  const { influencers } = useInfluencers(profile?.agencyId)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isAdminMode, setIsAdminMode] = useState(false)

  const isSaaSAdmin = profile?.role === "admin"
  const selectedInfluencer = influencers.find(inf => inf.id === selectedId)

  // Determina se estamos em modo agência ou modo influenciador
  const isInfluencerSelected = !!selectedId

  return (
    <aside className="w-72 h-full border-r border-white/5 bg-[#050505] flex flex-col relative z-30">
      {/* Brand Header */}
      <div className="p-8 pb-4">
        <div className="flex flex-col gap-6 mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)] shrink-0">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight text-white uppercase italic leading-none">
                Sintetix <span className="text-primary not-italic">Agency</span>
              </h1>
              <p className="text-[7px] text-muted-foreground font-black uppercase tracking-[0.4em] mt-1">
                {isAdminMode ? 'SaaS System Admin' : 'Gestão de Talentos'}
              </p>
            </div>
          </div>

          {/* Admin Mode Toggle */}
          {isSaaSAdmin && (
            <button
              onClick={() => {
                const newMode = !isAdminMode
                setIsAdminMode(newMode)
                onModuleChange(newMode ? "admin_dashboard" : "dashboard")
              }}
              className={cn(
                "w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all text-[9px] font-black uppercase tracking-widest",
                isAdminMode
                  ? "bg-primary/20 border-primary/40 text-primary shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                  : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
              )}
            >
              <span>{isAdminMode ? "Modo Admin Ativo" : "Mudar para Admin"}</span>
              <Shield className={cn("w-3.5 h-3.5", isAdminMode ? "text-primary animate-pulse" : "text-muted-foreground")} />
            </button>
          )}
        </div>

        {/* Agency Selector and Influencer List (Only in Agency Mode) */}
        {!isAdminMode && (
          <div className="mb-10 relative px-2">
            {/* Context Switcher Label */}
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em]">
                {isInfluencerSelected ? "Talento Selecionado" : "Minha Agência"}
              </h3>
              {!isInfluencerSelected && (
                <button
                  onClick={() => {
                    onSelectInfluencer(null)
                    onModuleChange("identity")
                    setIsDropdownOpen(false)
                  }}
                  className="w-5 h-5 rounded-md bg-white/5 text-muted-foreground hover:bg-primary hover:text-white flex items-center justify-center transition-all"
                  title="Novo Perfil"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* If no influencer selected, and we are not in dashboard, we show a 'Return to Dashboard' simulated button? 
                Actually, let's keep the selector but make it cleaner. */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-2xl transition-all border shrink-0",
                  isDropdownOpen
                    ? "bg-white/5 border-white/20 ring-1 ring-primary/20"
                    : "bg-secondary border-white/5 hover:border-white/10"
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/20 flex items-center justify-center text-primary font-black text-xs overflow-hidden shrink-0">
                  {isInfluencerSelected && selectedInfluencer?.image ? (
                    <img src={selectedInfluencer.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <LayoutDashboard className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-xs font-black text-white truncate leading-tight">
                    {isInfluencerSelected ? selectedInfluencer?.name : "Dashboard da Agência"}
                  </p>
                  <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mt-1">
                    {isInfluencerSelected ? "Perfil Ativo" : "Visão Geral"}
                  </p>
                </div>
                <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", isDropdownOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-secondary border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 py-2 backdrop-blur-xl"
                    >
                      <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                        {/* Return to Dashboard Item */}
                        <button
                          onClick={() => {
                            onSelectInfluencer(null)
                            onModuleChange("dashboard")
                            setIsDropdownOpen(false)
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/5 text-left border-b border-white/5",
                            !isInfluencerSelected && "bg-primary/5"
                          )}
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 text-[10px] font-black">
                            DB
                          </div>
                          <span className={cn("flex-1 text-xs font-bold truncate", !isInfluencerSelected ? "text-primary" : "text-white/70")}>
                            Dashboard Agência
                          </span>
                        </button>

                        {/* Influencer List */}
                        {influencers.map((inf) => (
                          <button
                            key={inf.id}
                            onClick={() => {
                              onSelectInfluencer(inf.id)
                              onModuleChange("identity")
                              setIsDropdownOpen(false)
                            }}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/5 text-left",
                              selectedId === inf.id && "bg-primary/5"
                            )}
                          >
                            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 overflow-hidden flex items-center justify-center text-[10px] font-black shrink-0">
                              {inf.image ? (
                                <img src={inf.image} alt="" className="w-full h-full object-cover" />
                              ) : (
                                inf.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <span className={cn("flex-1 text-xs font-bold truncate", selectedId === inf.id ? "text-primary" : "text-white/70")}>
                              {inf.name}
                            </span>
                            {selectedId === inf.id && <Check className="w-3 h-3 text-primary" />}
                          </button>
                        ))}
                      </div>
                      <div className="p-2 border-t border-white/5 mt-1">
                        <button
                          onClick={() => {
                            onSelectInfluencer(null)
                            onModuleChange("identity")
                            setIsDropdownOpen(false)
                          }}
                          className="w-full flex items-center gap-2 p-2 rounded-xl text-[9px] font-black uppercase text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Novo Perfil
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {isAdminMode ? (
          /* Admin Navigation */
          <>
            <NavItem
              icon={LayoutDashboard}
              label="Overview Global"
              active={activeModule === "admin_dashboard"}
              onClick={() => onModuleChange("admin_dashboard")}
            />
            <NavItem
              icon={LayoutPanelLeft}
              label="Modelos (Global)"
              active={activeModule === "admin_models"}
              onClick={() => onModuleChange("admin_models")}
            />
            <NavItem
              icon={Sparkles}
              label="Studio de Testes"
              active={activeModule === "admin_studio"}
              onClick={() => onModuleChange("admin_studio")}
            />
            <NavItem
              icon={Image}
              label="Galeria (Global)"
              active={activeModule === "admin_gallery"}
              onClick={() => onModuleChange("admin_gallery")}
            />
          </>
        ) : (
          /* Agency/Influencer Navigation */
          <>
            {!isInfluencerSelected ? (
              /* If in Agency mode but no influencer, only show Dashboard */
              <NavItem
                icon={LayoutDashboard}
                label="Dashboard Agência"
                active={activeModule === "dashboard"}
                onClick={() => onModuleChange("dashboard")}
              />
            ) : (
              /* If Influencer selected, show full model tools */
              <>
                <NavItem
                  icon={User}
                  label="Perfil"
                  active={activeModule === "identity"}
                  onClick={() => onModuleChange("identity")}
                />
                <NavItem
                  icon={Sparkles}
                  label="A.I. Studio"
                  active={activeModule === "studio"}
                  onClick={() => onModuleChange("studio")}
                />
                <NavItem
                  icon={Image}
                  label="Fotos e Estilo"
                  active={activeModule === "gallery"}
                  onClick={() => onModuleChange("gallery")}
                />
                <NavItem
                  icon={ShoppingBag}
                  label="Guarda-roupa"
                  active={activeModule === "wardrobe"}
                  onClick={() => onModuleChange("wardrobe")}
                />
                <NavItem
                  icon={Calendar}
                  label="Agenda Social"
                  active={activeModule === "calendar"}
                  onClick={() => onModuleChange("calendar")}
                />
                <NavItem
                  icon={Crown}
                  label="Negócios / CRM"
                  active={activeModule === "crm"}
                  onClick={() => onModuleChange("crm")}
                />
              </>
            )}
          </>
        )}
      </nav>

      {/* Footer Info & Logout */}
      <div className="p-6 mt-auto">
        {selectedId && !isAdminMode && (
          <div className="mb-6 px-4 py-3 bg-white/[0.02] border border-white/5 rounded-2xl group transition-all hover:border-primary/20">
            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-2">Link Público</p>
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

              <button
                onClick={() => {
                  const targetId = isSaaSAdmin ? "admin" : profile?.agencyId;
                  if (targetId) {
                    navigator.clipboard.writeText(targetId);
                    alert("ID da Instância copiado! Cole na extensão Sintetix Link.");
                  }
                }}
                className="flex items-center gap-1 text-[7px] text-muted-foreground uppercase tracking-widest font-black opacity-60 hover:opacity-100 hover:text-primary transition-all cursor-pointer"
                title="Copiar ID da Instância para a Extensão"
              >
                {profile?.role || 'User'} <Copy className="w-2.5 h-2.5" />
              </button>
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
