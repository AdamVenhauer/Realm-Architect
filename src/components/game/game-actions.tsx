
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { GameState } from '@/types/game';
import { ACTION_ICONS } from '@/config/game-config';

interface GameActionsProps {
  gameState: GameState;
  onAdvanceTurn: () => Promise<void>;
}

export function GameActions({ gameState, onAdvanceTurn }: GameActionsProps) {
  
  const handleNextTurn = async () => {
    await onAdvanceTurn();
    // Toasting for turn events and quests is handled by the parent (page.tsx)
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
        <Button 
          onClick={handleNextTurn} 
          className="w-full" 
          disabled={!gameState.generatedWorldMap || gameState.isGameOver}
        >
          <ACTION_ICONS.NextTurn className="mr-2 h-5 w-5" />
          Advance to Next Turn (Turn {gameState.currentTurn})
        </Button>
        {gameState.currentEvent && (
          <p className="text-sm text-muted-foreground p-2 border rounded-md bg-muted/30">
            <span className="font-semibold">Latest Event(s):</span> {gameState.currentEvent}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

```