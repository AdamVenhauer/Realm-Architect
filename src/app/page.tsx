
"use client";

import type { Dispatch, SetStateAction } from 'react';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
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
import { ResourceDisplay } from '@/components/game/resource-display';
import { ConstructionMenu } from '@/components/game/construction-menu';
import { GameActions } from '@/components/game/game-actions';
import { QuestDisplay } from '@/components/game/quest-display';
import type { GameState as GameStateType } from '@/types/game';
import { getInitialGameState as getConfigInitialGameState, APP_TITLE, APP_ICON as AppIcon, QUEST_DEFINITIONS, BUILDING_TYPES, ACTION_ICONS } from '@/config/game-config';
import { initializePlayerQuests } from '@/lib/quest-utils';
import { checkAndCompleteQuests as checkAndCompleteQuestsAction, type CompletedQuestInfo } from '@/app/actions/quest-actions';
import { advanceTurn as advanceTurnAction } from '@/app/actions/game-actions';
import { deleteStructure as deleteStructureAction } from '@/app/actions/structure-actions';
import { Menu, ShieldAlert, Trash2 } from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggleButton } from '@/components/theme-toggle-button';


export default function RealmArchitectPage() {
  const { toast } = useToast();

  const getInitialGameState = useCallback((): GameStateType => {
    const configInitialState = getConfigInitialGameState(); 
    return {
      ...configInitialState, 
      selectedBuildingForConstruction: null,
      playerQuests: initializePlayerQuests(), 
    };
  }, []);
  
  const [gameState, setGameState] = useState<GameStateType>(getInitialGameState);
  const [isClient, setIsClient] = useState(false);
  const [gameJustReset, setGameJustReset] = useState(false);
  const [structureToDeleteId, setStructureToDeleteId] = useState<string | null>(null);


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
    if (isClient && gameState.isGameOver && !prevIsGameOverRef.current) {
      // Game just transitioned to over
      toast({
        title: "Realm Lost!",
        description: gameState.currentEvent || "Your realm has crumbled.",
        variant: "destructive",
        duration: 10000, // Longer duration for game over
      });
    }
    prevIsGameOverRef.current = gameState.isGameOver;
  }, [isClient, gameState.isGameOver, gameState.currentEvent, toast]);


  const updateGameStateAndCheckQuests = useCallback(async (
    newStateOrUpdater: GameStateType | ((prevState: GameStateType) => GameStateType)
  ) => {
    let stateAfterInitialUpdate: GameStateType;

    if (typeof newStateOrUpdater === 'function') {
      stateAfterInitialUpdate = await new Promise<GameStateType>(resolve => {
        setGameState(currentActualState => {
          const updatedState = newStateOrUpdater(currentActualState);
          resolve(updatedState); 
          return updatedState;   
        });
      });
    } else {
      setGameState(newStateOrUpdater);
      stateAfterInitialUpdate = newStateOrUpdater;
    }

    if (isClient && !stateAfterInitialUpdate.isGameOver) {
      try {
        const { updatedGameState: stateAfterQuests, completedQuestsInfo } = await checkAndCompleteQuestsAction(stateAfterInitialUpdate);
        
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
  }, [toast, isClient]); 


  const handleAdvanceTurn = async () => {
    if (gameState.isGameOver) return;
    try {
      const nextState = await advanceTurnAction(gameState);
      if (isClient && nextState.currentEvent && !nextState.isGameOver) { 
        toast({
          title: `Turn ${nextState.currentTurn}`,
          description: nextState.currentEvent,
        });
      }
      await updateGameStateAndCheckQuests(nextState); 
    } catch (error) {
      console.error("Error advancing turn:", error);
      if (isClient) {
        toast({
          title: "Error Advancing Turn",
          description: error instanceof Error ? error.message : "An unknown error occurred.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteStructure = async () => {
    if (gameState.isGameOver || !structureToDeleteId) return;
    try {
      const nextState = await deleteStructureAction(gameState, structureToDeleteId);
      await updateGameStateAndCheckQuests(nextState); 
      if (isClient && !nextState.isGameOver && nextState.currentEvent?.includes("demolished")) { 
        toast({
            title: "Structure Demolished",
            description: "Resources partially recovered.",
        });
      }
    } catch (error) {
      console.error("Error deleting structure:", error);
      if (isClient) {
        toast({
          title: "Error Demolishing Structure",
          description: error instanceof Error ? error.message : "An unknown error occurred.",
          variant: "destructive",
        });
      }
    } finally {
      setStructureToDeleteId(null); // Close dialog
    }
  };
  
  const resetGame = () => {
    const initial = getInitialGameState();
    setGameState(initial); 
    if (isClient) {
      sessionStorage.removeItem('initialRealmToastShown'); 
    }
    setGameJustReset(true); 
  };

 useEffect(() => {
    if (isClient && gameState.currentTurn === 1 && gameState.playerQuests.length > 0 && !gameState.isGameOver) {
        const hasShownInitialToast = sessionStorage.getItem('initialRealmToastShown');
        if (!hasShownInitialToast) {
            toast({
                title: "Welcome, Realm Architect!",
                description: "Your journey begins now. Construct buildings and manage your resources.",
            });
            sessionStorage.setItem('initialRealmToastShown', 'true');
        }
    }
  }, [isClient, gameState.currentTurn, gameState.playerQuests, gameState.isGameOver, toast]);


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
        <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-sm">
          <div className="container mx-auto flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <AppIcon className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{APP_TITLE}</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggleButton />
              <Button variant="ghost" asChild className="h-8 px-3">
                <Link href="/how-to-play">
                  How to play?
                </Link>
              </Button>
              <SidebarTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-8 w-8">
                  <Menu />
                  <span className="sr-only">Toggle Sidebar</span>
                </Button>
              </SidebarTrigger>
            </div>
          </div>
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
            <main className="container mx-auto space-y-6">
              <ResourceDisplay resources={gameState.resources} />
               <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Realm Status</CardTitle>
                  <CardDescription>A brief overview of your current realm.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">The heart of your realm is developing. Manage resources, construct buildings, and complete objectives to grow.</p>
                  {gameState.structures.length > 0 ? (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Constructed Buildings:</h4>
                      <ul className="list-disc list-inside pl-4 text-sm space-y-2">
                        {gameState.structures.map(s => {
                           const buildingDef = BUILDING_TYPES[s.typeId];
                           const buildingName = buildingDef?.name || s.typeId;
                           return (
                            <li key={s.id} className="flex items-center justify-between">
                              <span>{buildingName}</span>
                              <Button 
                                variant="destructive" 
                                size="icon" 
                                className="h-6 w-6"
                                onClick={() => setStructureToDeleteId(s.id)}
                                disabled={gameState.isGameOver}
                                aria-label={`Delete ${buildingName}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </li>
                           );
                        })}
                      </ul>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-muted-foreground">No buildings constructed yet. Use the sidebar to begin.</p>
                  )}
                </CardContent>
              </Card>
            </main>
          </SidebarInset>
        </div>
      </div>
      {structureToDeleteId && BUILDING_TYPES[gameState.structures.find(s => s.id === structureToDeleteId)?.typeId || ''] && (
        <AlertDialog open={!!structureToDeleteId} onOpenChange={(open) => !open && setStructureToDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to demolish the {BUILDING_TYPES[gameState.structures.find(s => s.id === structureToDeleteId)!.typeId].name}? 
                You will recover some resources, but this action cannot be undone.
                {BUILDING_TYPES[gameState.structures.find(s => s.id === structureToDeleteId)!.typeId].providesPopulation ? ` This will also reduce your population by ${BUILDING_TYPES[gameState.structures.find(s => s.id === structureToDeleteId)!.typeId].providesPopulation}.` : ''}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setStructureToDeleteId(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteStructure} className="bg-destructive hover:bg-destructive/90">
                Demolish
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </SidebarProvider>
  );
}
