"use client"

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { InfluencerDashboard } from "@/components/InfluencerDashboard";
import { Calendar } from "@/components/Calendar";
import { Gallery } from "@/components/Gallery";
import { Wardrobe } from "@/components/Wardrobe";
import { CRM } from "@/components/CRM";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AuthScreen } from "@/components/AuthScreen";
import { ModuleType } from "@/lib/actions";

function AppContent() {
  const { user, loading } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleType>("identity");

  if (loading) return null;

  if (!user) {
    return <AuthScreen />;
  }

  const renderModule = () => {
    switch (activeModule) {
      case "identity":
        return (
          <InfluencerDashboard
            influencerId={selectedId}
            onSelect={(id) => setSelectedId(id)}
          />
        );
      case "gallery":
        return (
          <Gallery influencerId={selectedId} />
        );
      case "wardrobe":
        return (
          <Wardrobe influencerId={selectedId} />
        );
      case "calendar":
        return (
          <Calendar influencerId={selectedId} />
        );
      case "crm":
        return (
          <CRM influencerId={selectedId} />
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
        selectedId={selectedId}
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
