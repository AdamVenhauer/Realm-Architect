
"use client";

import { useState, useEffect, useCallback } from 'react';
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
import { QuestDisplay } from '@/components/game/quest-display';
import type { GameState as GameStateType } from '@/types/game'; // Renamed to avoid conflict
import { APP_TITLE, APP_ICON as AppIcon, QUEST_DEFINITIONS, getInitialGameState as getConfigInitialGameState } from '@/config/game-config';
import { initializePlayerQuests } from '@/lib/quest-utils';
import { checkAndCompleteQuests as checkAndCompleteQuestsAction, CompletedQuestInfo } from '@/app/actions/quest-actions';
import { advanceTurn as advanceTurnAction } from '@/app/actions/game-actions';
import { deleteStructure as deleteStructureAction } from '@/app/actions/structure-actions';
import { Menu, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"


export default function RealmArchitectPage() {
  const { toast } = useToast();

  const getInitialGameState = useCallback((): GameStateType => {
    const configInitialState = getConfigInitialGameState(); // From game-config
    return {
      ...configInitialState, // This includes resources, structures, currentTurn, currentEvent, isGameOver
      worldDescription: "",
      generatedWorldMap: null,
      isGenerating: false,
      selectedBuildingForConstruction: null,
      playerQuests: initializePlayerQuests(), // This needs to be called to get fresh quests
    };
  }, []);
  
  const [gameState, setGameState] = useState<GameStateType>(getInitialGameState);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const updateGameStateAndCheckQuests = useCallback(async (newStateOrUpdater: GameStateType | ((prevState: GameStateType) => GameStateType)) => {
    // Resolve the new state first
    const resolvedNewState = typeof newStateOrUpdater === 'function'
        ? newStateOrUpdater(gameState) // If it's a function, call it with the current gameState
        : newStateOrUpdater;        // Otherwise, use the new state directly

    // If game is already over in the *new* state, just set it and return
    if (resolvedNewState.isGameOver) {
        setGameState(resolvedNewState);
        return;
    }
    
    const { updatedGameState, completedQuestsInfo } = await checkAndCompleteQuestsAction(resolvedNewState);
    setGameState(updatedGameState); // Set the state after quests are checked
    
    completedQuestsInfo.forEach(info => {
        toast({
            title: info.title,
            description: info.message,
        });
    });
  }, [gameState, toast]); // gameState dependency is important here

  const handleAdvanceTurn = async () => {
    if (gameState.isGameOver) return;
    try {
      const nextState = await advanceTurnAction(gameState);
      // The event message is now part of nextState.currentEvent
      if (nextState.currentEvent) {
        toast({
          title: `Turn ${nextState.currentTurn}`,
          description: nextState.currentEvent,
        });
      }
      await updateGameStateAndCheckQuests(nextState); // This will also handle quest toasts
    } catch (error) {
      console.error("Error advancing turn:", error);
      toast({
        title: "Error Advancing Turn",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStructure = async (structureId: string) => {
    if (gameState.isGameOver) return;
    try {
      const nextState = await deleteStructureAction(gameState, structureId);
      await updateGameStateAndCheckQuests(nextState); // This now correctly uses the latest gameState
      if (!nextState.isGameOver) { // Only show positive toast if not game over
        toast({
            title: "Structure Demolished",
            description: "Resources partially recovered.",
        });
      } else {
         toast({ // Show game over toast if demolition caused it
            title: "Realm Lost!",
            description: nextState.currentEvent || "Demolishing a key structure led to the realm's downfall.",
            variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting structure:", error);
      toast({
        title: "Error Demolishing Structure",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    }
  };
  
  const resetGame = () => {
    setGameState(getInitialGameState());
    // Use useEffect to show toast after state is updated
  };

  useEffect(() => {
    if (isClient && gameState.currentTurn === 1 && !gameState.generatedWorldMap) { // Example condition for initial game toast
         toast({
            title: "New Realm Started",
            description: "A fresh beginning awaits!",
        });
    }
  }, [isClient, gameState.currentTurn, gameState.generatedWorldMap, toast]);


  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <AppIcon className="h-12 w-12 animate-pulse text-primary" />
        <p className="ml-4 text-2xl font-semibold">Loading Realm Architect...</p>
      </div>
    );
  }

  if (gameState.isGameOver) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-destructive/80 text-destructive-foreground p-8 text-center">
        <ShieldAlert className="h-24 w-24 mb-6 text-destructive-foreground" />
        <h1 className="text-5xl font-bold mb-4">Game Over</h1>
        <p className="text-xl mb-8 max-w-md">
          {gameState.currentEvent || (gameState.resources.population <= 0 
            ? "Your realm has crumbled, the last of your people have vanished. The echoes of their existence fade into silence." 
            : "Your leadership has faltered, and the realm could not be sustained.")}
        </p>
        <Button onClick={resetGame} size="lg" className="bg-background text-foreground hover:bg-background/90">
          Forge a New Destiny (Restart)
        </Button>
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
              <Menu />
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
              <WorldGenerationForm gameState={gameState} setGameState={setGameState} isGenerating={gameState.isGenerating} />
              <Separator />
              <ConstructionMenu 
                gameState={gameState} 
                updateGameStateAndCheckQuests={updateGameStateAndCheckQuests}
              />
              <Separator />
               <QuestDisplay playerQuests={gameState.playerQuests} allQuestDefinitions={QUEST_DEFINITIONS} />
              <Separator />
              <GameActions 
                gameState={gameState} 
                onAdvanceTurn={handleAdvanceTurn}
              />
            </SidebarContent>
          </Sidebar>

          <SidebarInset className="flex-1 p-4 md:p-6">
            <main className="space-y-6">
              <ResourceDisplay resources={gameState.resources} />
              <WorldMapDisplay 
                mapDescription={gameState.generatedWorldMap} 
                isGenerating={gameState.isGenerating}
                structures={gameState.structures}
                onDeleteStructure={handleDeleteStructure}
                currentGold={gameState.resources.gold}
              />
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
