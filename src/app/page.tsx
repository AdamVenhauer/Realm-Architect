"use client";

import { useState, useEffect } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { WorldGenerationForm } from '@/components/game/world-generation-form';
import { ResourceDisplay } from '@/components/game/resource-display';
import { ConstructionMenu } from '@/components/game/construction-menu';
import { WorldMapDisplay } from '@/components/game/world-map-display';
import { GameActions } from '@/components/game/game-actions';
import type { GameState } from '@/types/game';
import { INITIAL_RESOURCES } from '@/types/game';
import { APP_TITLE, APP_ICON as AppIcon } from '@/config/game-config';

export default function RealmArchitectPage() {
  const [gameState, setGameState] = useState<GameState>({
    worldDescription: "",
    generatedWorldMap: null,
    isGenerating: false,
    resources: INITIAL_RESOURCES,
    structures: [],
    currentTurn: 1,
    currentEvent: null,
    selectedBuildingForConstruction: null,
  });

  // Effect to ensure components relying on window (like useIsMobile in Sidebar) render correctly
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Render a loading state or null until client-side hydration is complete
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <AppIcon className="h-12 w-12 animate-pulse text-primary" />
        <p className="ml-4 text-2xl font-semibold">Loading Realm Architect...</p>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-muted/50 dark:from-background dark:to-muted/30">
        <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b bg-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <AppIcon className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{APP_TITLE}</h1>
          </div>
          <SidebarTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </Button>
          </SidebarTrigger>
        </header>
        
        <div className="flex flex-1">
          <Sidebar
            variant="sidebar"
            collapsible="icon"
            className="border-r shadow-xl"
          >
            <SidebarHeader className="p-4">
              <h2 className="text-lg font-semibold text-sidebar-foreground">Controls</h2>
            </SidebarHeader>
            <SidebarContent className="p-2 space-y-4">
              <WorldGenerationForm setGameState={setGameState} isGenerating={gameState.isGenerating} />
              <Separator />
              <ConstructionMenu gameState={gameState} setGameState={setGameState} />
              <Separator />
              <GameActions gameState={gameState} setGameState={setGameState} />
            </SidebarContent>
          </Sidebar>

          <SidebarInset className="flex-1 p-4 md:p-6">
            <main className="space-y-6">
              <ResourceDisplay resources={gameState.resources} />
              <WorldMapDisplay 
                mapDescription={gameState.generatedWorldMap} 
                isGenerating={gameState.isGenerating}
                structures={gameState.structures}
              />
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
