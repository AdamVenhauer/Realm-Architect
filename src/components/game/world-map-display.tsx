
"use client";

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import type { PlacedStructure } from '@/types/game';
import { BUILDING_TYPES, ACTION_ICONS } from '@/config/game-config';
import { AlertTriangle, Globe } from 'lucide-react'; // Added Globe
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  // AlertDialogTrigger, // No longer needed here
} from "@/components/ui/alert-dialog"
import { useState } from 'react';


interface WorldMapDisplayProps {
  mapDescription: string | null;
  isGenerating: boolean;
  structures: PlacedStructure[];
  onDeleteStructure: (structureId: string) => Promise<void>;
  currentGold: number;
}

export function WorldMapDisplay({ mapDescription, isGenerating, structures, onDeleteStructure, currentGold }: WorldMapDisplayProps) {
  const [structureToConfirmDelete, setStructureToConfirmDelete] = useState<{id: string, name: string} | null>(null);
  
  if (isGenerating) {
    return (
      <Card className="flex-1 shadow-lg flex flex-col items-center justify-center min-h-[400px]">
        <CardHeader>
          <CardTitle>Generating World...</CardTitle>
        </CardHeader>
        <CardContent>
          <svg className="animate-spin h-12 w-12 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-muted-foreground">The architects are hard at work...</p>
        </CardContent>
      </Card>
    );
  }

  const handleConfirmDelete = () => {
    if (structureToConfirmDelete) {
      onDeleteStructure(structureToConfirmDelete.id);
      setStructureToConfirmDelete(null);
    }
  };

  return (
    <>
    <Card className="flex-1 shadow-lg flex flex-col">
      <CardHeader>
        <CardTitle>Realm Overview</CardTitle>
        <CardDescription>
          The current state of your realm. Pan and zoom features for the map will be available in future updates.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {currentGold <= 0 && (
          <div className="mb-4 p-3 border border-destructive/50 bg-destructive/10 rounded-md flex items-center gap-2 text-destructive_foreground">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="text-sm font-medium text-destructive">Warning: Gold reserves depleted! Worker productivity and building operations may be affected.</span>
          </div>
        )}
        {mapDescription ? (
          <>
            <div className="mb-4 p-4 border rounded-md bg-muted/30 max-h-48 overflow-y-auto">
              <h3 className="font-semibold mb-2 text-lg">World Chronicle:</h3>
              <ScrollArea className="h-[150px]">
                <p className="text-sm whitespace-pre-wrap">{mapDescription}</p>
              </ScrollArea>
            </div>
            <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center mb-4 relative overflow-hidden shadow-inner">
              <Image 
                src="https://picsum.photos/seed/realmarchitectmap/800/450" 
                alt="Procedurally Generated World Map Placeholder" 
                width={800} 
                height={450} 
                className="object-cover w-full h-full"
                data-ai-hint="fantasy kingdom"
                priority
              />
               <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                <p className="text-white text-2xl font-bold bg-black/50 px-4 py-2 rounded">Map of the Realm (Placeholder)</p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-10 flex flex-col items-center justify-center h-full">
            <Globe className="h-16 w-16 text-muted-foreground mb-4" data-ai-hint="empty globe" />
            <p className="text-muted-foreground text-lg">Your realm is yet to be discovered.</p>
            <p className="text-sm">Use the 'Generate World' panel to begin your creation.</p>
          </div>
        )}
      </CardContent>
       {structures.length > 0 && (
        <CardFooter className="flex-col items-start p-4 border-t">
          <h3 className="font-semibold mb-3 text-lg">Constructed Structures ({structures.length}):</h3>
          <ScrollArea className="h-[150px] w-full pr-3">
            <ul className="space-y-2">
              {structures.map(structure => {
                const buildingDetails = BUILDING_TYPES[structure.typeId];
                const Icon = buildingDetails?.icon;
                return (
                  <li key={structure.id} className="text-sm flex items-center justify-between gap-2 p-2 border rounded-md bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-2">
                      {Icon && <Icon className="h-5 w-5 text-primary" />}
                      <span>{buildingDetails?.name || structure.typeId}</span>
                    </div>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => setStructureToConfirmDelete({id: structure.id, name: buildingDetails?.name || 'Unknown Structure'})}
                      >
                        <ACTION_ICONS.Delete className="h-4 w-4 mr-1" />
                        Demolish
                      </Button>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        </CardFooter>
      )}
      {structures.length === 0 && mapDescription && (
         <CardFooter className="p-4 border-t">
            <p className="text-sm text-muted-foreground">No structures built yet. Use the construction menu to expand your realm.</p>
         </CardFooter>
      )}
    </Card>
    {structureToConfirmDelete && (
        <AlertDialog open={!!structureToConfirmDelete} onOpenChange={(open) => !open && setStructureToConfirmDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Confirm Demolition</AlertDialogTitle>
                <AlertDialogDescription>
                    Are you sure you want to demolish the {structureToConfirmDelete.name}? This action cannot be undone and will refund only a portion of its cost.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setStructureToConfirmDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
                    Demolish
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )}
    </>
  );
}

