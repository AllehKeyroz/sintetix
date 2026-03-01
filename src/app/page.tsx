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
import { useInfluencers } from "@/hooks/useFirebase";
import { ModuleType } from "@/lib/actions";
import { AdminDashboard } from "@/components/AdminDashboard";
import { AdminModels } from "@/components/AdminModels";

function AppContent() {
  const { user, profile, loading } = useAuth();
  const { influencers, loading: loadingInfluencers } = useInfluencers(profile?.agencyId);
  const [selectedId, setSelectedId] = useState<string | null | undefined>(undefined);
  const [activeModule, setActiveModule] = useState<ModuleType>("dashboard");

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
        return <AgencyOverview agencyId={profile?.agencyId} onModuleChange={(m) => setActiveModule(m)} />;
      case "admin_dashboard":
        return <AdminDashboard />;
      case "admin_models":
        return <AdminModels onModuleChange={(m) => setActiveModule(m as any)} />;
      case "admin_studio":
        return <AIGeneratorStudio influencerId={null} isAdminMode={true} />;
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
      default:
        return (
          <div className="flex-1 flex items-center justify-center bg-background">
            <p className="text-muted-foreground">Módulo {activeModule} em breve.</p>
          </div>
        );
    }
  }

  return (
    <main className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar
        onSelectInfluencer={(id) => setSelectedId(id)}
        selectedId={selectedId || null}
        activeModule={activeModule}
        onModuleChange={(m) => setActiveModule(m)}
      />
      {renderModule()}
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
