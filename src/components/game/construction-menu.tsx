"use client";

import type { Dispatch, SetStateAction } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { GameState, ResourceSet } from '@/types/game';
import { BUILDING_TYPES, RESOURCE_DETAILS, ACTION_ICONS } from '@/config/game-config';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
// No longer needed here: import { checkAndCompleteQuests as checkAndCompleteQuestsAction } from '@/app/actions/quest-actions';

interface ConstructionMenuProps {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState>>; // For direct, simple state updates
  updateGameStateAndCheckQuests: (newStateOrUpdater: GameState | ((prevState: GameState) => GameState)) => Promise<void>; // For updates that trigger game logic and quests
}

export function ConstructionMenu({ gameState, setGameState, updateGameStateAndCheckQuests }: ConstructionMenuProps) {
  const { toast } = useToast();

  const handleSelectBuilding = (buildingId: string) => {
    // Use the direct setGameState for this simple UI update
    setGameState(prev => ({ ...prev, selectedBuildingForConstruction: buildingId }));
    toast({
      title: `${BUILDING_TYPES[buildingId].name} Selected`,
      description: "Click on the map area to place the building (simulated).",
    });
  };

  const handlePlaceBuilding = async () => {
    if (!gameState.selectedBuildingForConstruction) return;

    const buildingType = BUILDING_TYPES[gameState.selectedBuildingForConstruction];
    if (!buildingType) return;

    let canAfford = true;
    for (const [resource, amount] of Object.entries(buildingType.cost)) {
      if (gameState.resources[resource as keyof ResourceSet] < amount) {
        canAfford = false;
        break;
      }
    }

    if (canAfford) {
      // This function will be an updater for updateGameStateAndCheckQuests
      const updaterFunction = (prevGameState: GameState): GameState => {
        const newResources = { ...prevGameState.resources };
        for (const [resource, amount] of Object.entries(buildingType.cost)) {
          newResources[resource as keyof ResourceSet] = (newResources[resource as keyof ResourceSet] || 0) - amount;
        }

        const newStructure = {
          id: `struct_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          typeId: buildingType.id,
        };
        
        return {
          ...prevGameState,
          resources: newResources,
          structures: [...prevGameState.structures, newStructure],
          selectedBuildingForConstruction: null, // Reset selection
        };
      };
      
      // Use the prop from parent to handle state update and quest checks
      // This will internally call the server action with the new state derived from updaterFunction
      await updateGameStateAndCheckQuests(updaterFunction); 
        
      toast({
        title: `${buildingType.name} Placed!`,
        description: `Resources deducted. Your realm grows.`,
      });
      // Toasting for completedQuestsInfo is handled by the parent's updateGameStateAndCheckQuests

    } else {
      toast({
        title: "Cannot Afford Building",
        description: `Not enough resources to build a ${buildingType.name}.`,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ACTION_ICONS.Build className="h-6 w-6 text-accent" />
          Construct Buildings
        </CardTitle>
        <CardDescription>Expand your realm by constructing new buildings.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[250px] pr-3">
          <div className="space-y-4">
            {Object.values(BUILDING_TYPES).map((building) => {
              const Icon = building.icon;
              const isSelected = gameState.selectedBuildingForConstruction === building.id;
              return (
                <div key={building.id} className={cn("p-3 rounded-lg border", isSelected ? "border-primary ring-2 ring-primary shadow-md" : "bg-muted/30 hover:bg-muted/60")}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      {building.name}
                    </h4>
                     <Button
                        size="sm"
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => handleSelectBuilding(building.id)}
                        disabled={!!gameState.selectedBuildingForConstruction && !isSelected}
                      >
                        {isSelected ? "Selected" : "Select"}
                      </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{building.description}</p>
                  <div className="text-xs space-y-1">
                    <div>
                      <span className="font-medium">Cost:</span>
                      {Object.entries(building.cost).map(([res, val]) => (
                        <Badge variant="secondary" key={res} className="ml-1">{val} {RESOURCE_DETAILS[res as keyof ResourceSet]?.name.slice(0,1)}</Badge>
                      ))}
                    </div>
                    {Object.keys(building.upkeep).length > 0 && (
                      <div>
                        <span className="font-medium">Upkeep:</span>
                        {Object.entries(building.upkeep).map(([res, val]) => (
                          <Badge variant="outline" key={res} className="ml-1">{val} {RESOURCE_DETAILS[res as keyof ResourceSet]?.name.slice(0,1)}/turn</Badge>
                        ))}
                      </div>
                    )}
                     {Object.keys(building.production).length > 0 && (
                      <div>
                        <span className="font-medium">Produces:</span>
                        {Object.entries(building.production).map(([res, val]) => (
                          <Badge variant="default" key={res} className="ml-1 bg-green-500/20 text-green-700 dark:bg-green-500/30 dark:text-green-300 border-green-500/50">+{val} {RESOURCE_DETAILS[res as keyof ResourceSet]?.name.slice(0,1)}/turn</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        {gameState.selectedBuildingForConstruction && (
           <Button onClick={handlePlaceBuilding} className="w-full mt-4">
            <ACTION_ICONS.Build className="mr-2 h-5 w-5" />
            Place {BUILDING_TYPES[gameState.selectedBuildingForConstruction].name}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
