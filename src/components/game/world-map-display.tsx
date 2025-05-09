"use client";

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { PlacedStructure } from '@/types/game';
import { BUILDING_TYPES } from '@/config/game-config';

interface WorldMapDisplayProps {
  mapDescription: string | null;
  isGenerating: boolean;
  structures: PlacedStructure[];
}

export function WorldMapDisplay({ mapDescription, isGenerating, structures }: WorldMapDisplayProps) {
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

  return (
    <Card className="flex-1 shadow-lg">
      <CardHeader>
        <CardTitle>Realm Overview</CardTitle>
        <CardDescription>
          The current state of your realm. Pan and zoom features for the map will be available in future updates.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {mapDescription ? (
          <>
            <div className="mb-4 p-4 border rounded-md bg-muted/30 max-h-48 overflow-y-auto">
              <h3 className="font-semibold mb-2 text-lg">World Chronicle:</h3>
              <ScrollArea className="h-[150px]">
                <p className="text-sm whitespace-pre-wrap">{mapDescription}</p>
              </ScrollArea>
            </div>
            <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center mb-4 relative overflow-hidden">
              <Image 
                src="https://picsum.photos/seed/realmarchitect/800/450" 
                alt="Procedurally Generated World Map Placeholder" 
                width={800} 
                height={450} 
                className="object-cover w-full h-full"
                data-ai-hint="fantasy map"
                priority
              />
               <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                <p className="text-white text-2xl font-bold bg-black/50 px-4 py-2 rounded">Map of the Realm (Placeholder)</p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground text-lg">Your realm is yet to be discovered.</p>
            <p className="text-sm">Use the 'Generate World' panel to begin your creation.</p>
          </div>
        )}
        {structures.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2 text-lg">Constructed Structures:</h3>
            <ScrollArea className="h-[100px] border rounded-md p-2 bg-muted/20">
              <ul className="space-y-1">
                {structures.map(structure => {
                  const buildingDetails = BUILDING_TYPES[structure.typeId];
                  const Icon = buildingDetails?.icon;
                  return (
                    <li key={structure.id} className="text-sm flex items-center gap-2">
                      {Icon && <Icon className="h-4 w-4 text-primary" />}
                      {buildingDetails?.name || structure.typeId}
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
