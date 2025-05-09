
"use client";

import type { Dispatch, SetStateAction } from 'react';
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import type { GameState as GameStateType } from '@/types/game';
import { getInitialGameState as getConfigInitialGameState, APP_TITLE, APP_ICON as AppIcon, QUEST_DEFINITIONS } from '@/config/game-config';
import { initializePlayerQuests } from '@/lib/quest-utils';
import { checkAndCompleteQuests as checkAndCompleteQuestsAction, type CompletedQuestInfo } from '@/app/actions/quest-actions';
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
    const configInitialState = getConfigInitialGameState(); 
    return {
      ...configInitialState, 
      worldDescription: "",
      generatedWorldMap: null,
      isGenerating: false,
      selectedBuildingForConstruction: null,
      playerQuests: initializePlayerQuests(), 
    };
  }, []);
  
  const [gameState, setGameState] = useState<GameStateType>(getInitialGameState);
  const [isClient, setIsClient] = useState(false);
  const [gameJustReset, setGameJustReset] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Effect for Reset Game Toast
  useEffect(() => {
    if (gameJustReset) {
      toast({
        title: "New Realm Started",
        description: "A fresh beginning awaits!",
      });
      setGameJustReset(false); // Reset the trigger
    }
  }, [gameJustReset, toast]);

  // Effect for Game Over Toast
  const prevIsGameOverRef = useRef<boolean>(gameState.isGameOver);
  useEffect(() => {
    if (gameState.isGameOver && !prevIsGameOverRef.current) {
      // Game just transitioned to over
      toast({
        title: "Realm Lost!",
        description: gameState.currentEvent || "Your realm has crumbled.",
        variant: "destructive",
      });
    }
    prevIsGameOverRef.current = gameState.isGameOver;
  }, [gameState.isGameOver, gameState.currentEvent, toast]);


  const updateGameStateAndCheckQuests = useCallback(async (
    newStateOrUpdater: GameStateType | ((prevState: GameStateType) => GameStateType)
  ) => {
    // Step 1: Apply the initial state change and get the resulting state.
    let stateAfterInitialUpdate: GameStateType;

    if (typeof newStateOrUpdater === 'function') {
      // If it's an updater function, apply it and await the new state.
      // This ensures we operate on the state that will be rendered.
      stateAfterInitialUpdate = await new Promise<GameStateType>(resolve => {
        setGameState(currentActualState => {
          const updatedState = newStateOrUpdater(currentActualState);
          resolve(updatedState); 
          return updatedState;   
        });
      });
    } else {
      // If it's a direct state object, set it.
      setGameState(newStateOrUpdater);
      stateAfterInitialUpdate = newStateOrUpdater;
    }

    // Step 2: If the game is not over after the initial update, check quests.
    if (!stateAfterInitialUpdate.isGameOver) {
      try {
        const { updatedGameState: stateAfterQuests, completedQuestsInfo } = await checkAndCompleteQuestsAction(stateAfterInitialUpdate);
        
        // Step 3: Apply the state changes from quest completion.
        setGameState(stateAfterQuests); 
        
        completedQuestsInfo.forEach(info => {
          toast({
            title: info.title,
            description: info.message,
          });
        });
      } catch (error) {
        console.error("Error checking quests:", error);
        toast({
          title: "Error During Quest Check",
          description: "Could not process quest updates.",
          variant: "destructive",
        });
      }
    }
    // If game was over from stateAfterInitialUpdate, the game over toast is handled by the useEffect.
  }, [toast]); // setGameState & checkAndCompleteQuestsAction are stable, toast is from hook.


  const handleAdvanceTurn = async () => {
    if (gameState.isGameOver) return;
    try {
      const nextState = await advanceTurnAction(gameState);
      if (nextState.currentEvent && !nextState.isGameOver) { 
        toast({
          title: `Turn ${nextState.currentTurn}`,
          description: nextState.currentEvent,
        });
      }
      // updateGameStateAndCheckQuests will handle setting the state from advanceTurnAction
      // and then subsequently checking quests.
      await updateGameStateAndCheckQuests(nextState); 
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
      // Pass the state after deletion to updateGameStateAndCheckQuests
      await updateGameStateAndCheckQuests(nextState); 
      if (!nextState.isGameOver && nextState.currentEvent?.includes("demolished")) { 
        toast({
            title: "Structure Demolished",
            description: "Resources partially recovered.",
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
    const initial = getInitialGameState();
    setGameState(initial);
    sessionStorage.removeItem('initialRealmToastShown');
    setGameJustReset(true);
  };

 useEffect(() => {
    if (isClient && gameState.currentTurn === 1 && !gameState.generatedWorldMap && gameState.playerQuests.length > 0 && !gameState.isGameOver) {
        const hasShownInitialToast = sessionStorage.getItem('initialRealmToastShown');
        if (!hasShownInitialToast) {
            toast({
                title: "Welcome, Realm Architect!",
                description: "Your journey begins now. Generate a world to start.",
            });
            sessionStorage.setItem('initialRealmToastShown', 'true');
        }
    }
  }, [isClient, gameState.currentTurn, gameState.generatedWorldMap, gameState.playerQuests, gameState.isGameOver, toast]);


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
              <span className="sr-only">Toggle Sidebar</span>
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
