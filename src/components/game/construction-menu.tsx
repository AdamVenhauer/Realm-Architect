
"use client";

import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react'; // Added import for useState
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { GameState, ResourceSet } from '@/types/game';
import { BUILDING_TYPES, RESOURCE_DETAILS, ACTION_ICONS } from '@/config/game-config';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ConstructionMenuProps {
  gameState: GameState;
  updateGameStateAndCheckQuests: (newStateOrUpdater: GameState | ((prevState: GameState) => GameState)) => Promise<void>;
}

export function ConstructionMenu({ gameState, updateGameStateAndCheckQuests }: ConstructionMenuProps) {
  const { toast } = useToast();
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);


  const handleSelectBuilding = (buildingId: string) => {
    setSelectedBuildingId(buildingId);
    toast({
      title: `${BUILDING_TYPES[buildingId].name} Selected`,
      description: "Click 'Place Building' to confirm construction.",
    });
  };

  const handlePlaceBuilding = async () => {
    if (!selectedBuildingId) return;

    const buildingType = BUILDING_TYPES[selectedBuildingId];
    if (!buildingType) return;

    let canAfford = true;
    for (const [resource, amount] of Object.entries(buildingType.cost)) {
      if (gameState.resources[resource as keyof Omit<ResourceSet, 'population'>] < amount) {
        canAfford = false;
        break;
      }
    }

    if (canAfford) {
      const updaterFunction = (prevGameState: GameState): GameState => {
        const newResources = { ...prevGameState.resources };
        for (const [resource, amount] of Object.entries(buildingType.cost)) {
          newResources[resource as keyof Omit<ResourceSet, 'population'>] = (newResources[resource as keyof Omit<ResourceSet, 'population'>] || 0) - amount;
        }

        const newStructure = {
          id: `struct_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          typeId: buildingType.id,
        };
        
        let newPopulation = prevGameState.resources.population;
        if (buildingType.providesPopulation) {
          newPopulation += buildingType.providesPopulation;
        }
        
        return {
          ...prevGameState,
          resources: { ...newResources, population: newPopulation },
          structures: [...prevGameState.structures, newStructure],
        };
      };
      
      await updateGameStateAndCheckQuests(updaterFunction); 
      setSelectedBuildingId(null); 
        
      toast({
        title: `${buildingType.name} Placed!`,
        description: `Resources deducted. Your realm grows. ${buildingType.providesPopulation ? `Population increased by ${buildingType.providesPopulation}.` : ''}`,
      });

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
              const isSelected = selectedBuildingId === building.id;
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
                        disabled={!!selectedBuildingId && !isSelected}
                      >
                        {isSelected ? "Selected" : "Select"}
                      </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{building.description}</p>
                   {building.providesPopulation && (
                    <p className="text-xs text-muted-foreground mb-2">Provides +{building.providesPopulation} Population</p>
                  )}
                  <div className="text-xs space-y-1">
                    <div>
                      <span className="font-medium">Cost:</span>
                      {Object.entries(building.cost).map(([res, val]) => (
                        <Badge variant="secondary" key={res} className="ml-1">{val} {RESOURCE_DETAILS[res as keyof Omit<ResourceSet, 'population'>]?.name.slice(0,1)}</Badge>
                      ))}
                    </div>
                    {Object.keys(building.upkeep).length > 0 && (
                      <div>
                        <span className="font-medium">Upkeep:</span>
                        {Object.entries(building.upkeep).map(([res, val]) => (
                          <Badge variant="outline" key={res} className="ml-1">{val} {RESOURCE_DETAILS[res as keyof Omit<ResourceSet, 'population'>]?.name.slice(0,1)}/turn</Badge>
                        ))}
                      </div>
                    )}
                     {Object.keys(building.production).length > 0 && (
                      <div>
                        <span className="font-medium">Produces:</span>
                        {Object.entries(building.production).map(([res, val]) => (
                          <Badge variant="default" key={res} className="ml-1 bg-green-500/20 text-green-700 dark:bg-green-500/30 dark:text-green-300 border-green-500/50">+{val} {RESOURCE_DETAILS[res as keyof Omit<ResourceSet, 'population'>]?.name.slice(0,1)}/turn</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        {selectedBuildingId && (
           <Button onClick={handlePlaceBuilding} className="w-full mt-4">
            <ACTION_ICONS.Build className="mr-2 h-5 w-5" />
            Place {BUILDING_TYPES[selectedBuildingId].name}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
