"use client"

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { InfluencerDashboard } from "@/components/InfluencerDashboard";
import { Calendar } from "@/components/Calendar";
import { Gallery } from "@/components/Gallery";
import { Wardrobe } from "@/components/Wardrobe";
import { CRM } from "@/components/CRM";
import { AgencyOverview } from "@/components/AgencyOverview";
import { AIGeneratorStudio } from "@/components/AIGeneratorStudio";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AuthScreen } from "@/components/AuthScreen";
import { AIGeneratorCanvas } from "@/components/AIGeneratorCanvas";
import { useInfluencers } from "@/hooks/useFirebase";
import { ModuleType } from "@/lib/actions";
import { AdminDashboard } from "@/components/AdminDashboard";
import { AdminModels } from "@/components/AdminModels";
import { AdminSettings } from "@/components/AdminSettings";
import { Menu, Crown } from "lucide-react";

import { AgentChat } from "@/components/AgentChat";
import { useParams } from "next/navigation";

function AppContent() {
  const { user, profile, loading } = useAuth();
  const { influencers, loading: loadingInfluencers } = useInfluencers(profile?.agencyId);
  const params = useParams();

  const [activeModule, setActiveModule] = useState<ModuleType>(
    (params?.slug?.[0] as ModuleType) || "dashboard"
  );
  const [selectedId, setSelectedId] = useState<string | null | undefined>(
    params?.slug?.[1] || undefined
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Sync state to URL seamlessly sem recarregar
  useEffect(() => {
    if (typeof window === "undefined") return;

    let nextPath = "/";
    if (activeModule !== "dashboard") {
      nextPath = `/${activeModule}`;
      // Anexar o ID na URL apenas para rotas focadas num influenciador
      if (selectedId && !activeModule.startsWith("admin_") && activeModule !== "agent_chat") {
        nextPath += `/${selectedId}`;
      }
    }

    if (window.location.pathname !== nextPath) {
      window.history.pushState(null, "", nextPath);
    }
  }, [activeModule, selectedId]);

  const isAdmin = profile?.role === "admin";

  // Redirecionamento de segurança: se não for admin e tentar acessar dashboard
  useEffect(() => {
    if (!loading && profile && !isAdmin && activeModule === "dashboard") {
      setActiveModule("identity");
    }
  }, [profile, isAdmin, activeModule, loading]);

  // SELEÇÃO AUTOMÁTICA: Se nenhum estiver selecionado e a lista carregar, pega o primeiro.
  useEffect(() => {
    if (selectedId === undefined && !loadingInfluencers) {
      if (influencers.length > 0) {
        setSelectedId(influencers[0].id);
      } else {
        setSelectedId(null);
      }
    }
  }, [influencers, selectedId, loadingInfluencers]);

  if (loading) return null;

  if (!user) {
    return <AuthScreen />;
  }

  const renderModule = () => {
    // Fallsback para segurança caso renderModule seja chamado indevidamente
    const currentModule = (!isAdmin && activeModule === "dashboard") ? "identity" : activeModule;

    switch (currentModule) {
      case "dashboard":
        return <AgencyOverview onModuleChange={(m) => setActiveModule(m as any)} />;
      case "admin_dashboard":
        return <AdminDashboard />;
      case "admin_models":
        return <AdminModels onModuleChange={(m) => setActiveModule(m as any)} />;
      case "admin_studio":
        return <AIGeneratorStudio influencerId={null} isAdminMode={true} />;
      case "admin_studio_canvas":
        return <AIGeneratorCanvas influencerId="admin_test_studio" />;
      case "admin_gallery":
        return <Gallery influencerId="admin_test_studio" />;
      case "identity":
        return (
          <InfluencerDashboard
            influencerId={selectedId || null}
            onSelect={(id) => setSelectedId(id)}
          />
        );
      case "studio":
        return (
          <AIGeneratorStudio influencerId={selectedId || null} isAdminMode={false} />
        );
      case "studio_canvas":
        return (
          <AIGeneratorCanvas influencerId={selectedId || null} />
        );
      case "gallery":
        return (
          <Gallery influencerId={selectedId || null} />
        );
      case "wardrobe":
        return (
          <Wardrobe influencerId={selectedId || null} />
        );
      case "calendar":
        return (
          <Calendar influencerId={selectedId || null} />
        );
      case "crm":
        return (
          <CRM influencerId={selectedId || null} />
        );
      case "agent_chat":
        return (
          <div className="flex-1 w-full h-full relative">
            <AgentChat />
          </div>
        );
      default:
        return (
          <div className="flex-1 flex items-center justify-center bg-background">
            <p className="text-muted-foreground">Módulo {activeModule} em breve.</p>
          </div>
        );
    }
  }

  return (
    <main className="flex flex-col md:flex-row h-[100dvh] bg-background text-foreground overflow-hidden">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-[#050505] z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)] shrink-0">
            <Crown className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-black text-sm tracking-tight text-white uppercase italic leading-none">
              Sintetix <span className="text-primary not-italic">Agency</span>
            </h1>
          </div>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 rounded-xl bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white transition-all flex items-center justify-center"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <Sidebar
        onSelectInfluencer={(id) => {
          setSelectedId(id)
          setIsSidebarOpen(false)
        }}
        selectedId={selectedId || null}
        activeModule={activeModule}
        onModuleChange={(m) => {
          setActiveModule(m)
          setIsSidebarOpen(false)
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 overflow-hidden flex flex-col min-w-0 bg-background relative z-10 w-full">
        {renderModule()}
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
