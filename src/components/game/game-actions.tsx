"use client";

import type { Dispatch, SetStateAction } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { GameState, ResourceSet } from '@/types/game';
import { BUILDING_TYPES, ACTION_ICONS, TURN_EVENTS } from '@/config/game-config';
import { useToast } from '@/hooks/use-toast';

interface GameActionsProps {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState>>;
}

export function GameActions({ gameState, setGameState }: GameActionsProps) {
  const { toast } = useToast();

  const handleNextTurn = () => {
    setGameState(prev => {
      const newResources = { ...prev.resources };
      let totalUpkeep: Partial<ResourceSet> = {};
      let totalProduction: Partial<ResourceSet> = {};

      // Calculate upkeep and production from structures
      prev.structures.forEach(structure => {
        const type = BUILDING_TYPES[structure.typeId];
        if (type) {
          Object.entries(type.upkeep).forEach(([res, val]) => {
            totalUpkeep[res as keyof ResourceSet] = (totalUpkeep[res as keyof ResourceSet] || 0) + val;
          });
          Object.entries(type.production).forEach(([res, val]) => {
            totalProduction[res as keyof ResourceSet] = (totalProduction[res as keyof ResourceSet] || 0) + val;
          });
        }
      });
      
      // Apply upkeep
      Object.entries(totalUpkeep).forEach(([res, val]) => {
        newResources[res as keyof ResourceSet] = Math.max(0, newResources[res as keyof ResourceSet] - val);
      });

      // Apply production
      Object.entries(totalProduction).forEach(([res, val]) => {
        newResources[res as keyof ResourceSet] += val;
      });

      // Random event
      const randomEvent = TURN_EVENTS[Math.floor(Math.random() * TURN_EVENTS.length)];
      
      toast({
        title: `Turn ${prev.currentTurn + 1}`,
        description: randomEvent,
      });

      return {
        ...prev,
        currentTurn: prev.currentTurn + 1,
        resources: newResources,
        currentEvent: randomEvent,
      };
    });
  };

  return (
    <Card className="shadow-lg mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ACTION_ICONS.NextTurn className="h-6 w-6 text-accent" />
          Realm Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col space-y-2">
        <Button onClick={handleNextTurn} className="w-full" disabled={!gameState.generatedWorldMap}>
          <ACTION_ICONS.NextTurn className="mr-2 h-5 w-5" />
          Advance to Next Turn (Turn {gameState.currentTurn})
        </Button>
        {gameState.currentEvent && (
          <p className="text-sm text-muted-foreground p-2 border rounded-md bg-muted/30">
            <span className="font-semibold">Latest Event:</span> {gameState.currentEvent}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
