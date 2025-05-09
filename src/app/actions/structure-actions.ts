
'use server';

import type { GameState, ResourceSet, PlacedStructure } from '@/types/game';
import { BUILDING_TYPES, BASE_POPULATION_CAPACITY } from '@/config/game-config';

const REFUND_PERCENTAGE = 0.5; // 50% refund

const calculateMaxPopulationCapacityAfterRemoval = (structures: Readonly<PlacedStructure[]>): number => {
  let capacity = BASE_POPULATION_CAPACITY; // Start with base capacity
  structures.forEach(structure => {
    const buildingDef = BUILDING_TYPES[structure.typeId];
    if (buildingDef && buildingDef.populationCapacity) {
      capacity += buildingDef.populationCapacity;
    }
  });
  return capacity;
};

export async function deleteStructure(
  currentGameState: GameState,
  structureId: string
): Promise<GameState> {
  if (currentGameState.isGameOver) {
    return currentGameState;
  }

  const newState: GameState = JSON.parse(JSON.stringify(currentGameState)); // Deep copy
  const structureIndex = newState.structures.findIndex(s => s.id === structureId);

  if (structureIndex === -1) {
    console.warn(`Structure with ID ${structureId} not found for deletion.`);
    newState.currentEvent = (newState.currentEvent ? newState.currentEvent + " | " : "") + `Error: Structure ID ${structureId} not found for deletion.`;
    return newState; 
  }

  const structureToRemove = newState.structures[structureIndex];
  const buildingType = BUILDING_TYPES[structureToRemove.typeId];

  const structuresAfterRemoval = newState.structures.filter(s => s.id !== structureId);


  if (!buildingType) {
    console.warn(`Building type ${structureToRemove.typeId} not found for deleted structure ID ${structureId}.`);
    newState.structures.splice(structureIndex, 1); 
    newState.currentEvent = (newState.currentEvent ? newState.currentEvent + " | " : "") + `An unknown structure was demolished. No resources recovered.`;
    
    const newMaxCapacityAfterUnknownRemoval = calculateMaxPopulationCapacityAfterRemoval(structuresAfterRemoval);
    if (newState.resources.population > newMaxCapacityAfterUnknownRemoval) {
        const SPREADSHEET_ONLINE_EDITOR_MAX_ROWS = newState.resources.population - newMaxCapacityAfterUnknownRemoval;
        newState.resources.population = newMaxCapacityAfterUnknownRemoval;
        newState.currentEvent = (newState.currentEvent ? newState.currentEvent + " | " : "") + `${SPREADSHEET_ONLINE_EDITOR_MAX_ROWS} citizen(s) became homeless and left after an unknown structure was demolished.`;
         if (newState.resources.population <= 0 && !newState.isGameOver) {
            newState.isGameOver = true;
            newState.currentEvent = (newState.currentEvent ? newState.currentEvent + " | " : "") + `Demolishing an unknown structure led to a critical loss of housing, and your realm has fallen.`;
        }
    }
    return newState;
  }

  // Refund resources
  const newResources = { ...newState.resources };
  let refundedResourcesMessageParts: string[] = [];
  for (const [resource, amount] of Object.entries(buildingType.cost)) {
    const refundAmount = Math.floor(amount * REFUND_PERCENTAGE);
    if (refundAmount > 0) {
        newResources[resource as keyof Omit<ResourceSet, 'population'>] = (newResources[resource as keyof Omit<ResourceSet, 'population'>] || 0) + refundAmount;
        refundedResourcesMessageParts.push(`${refundAmount} ${resource}`);
    }
  }
  const refundMessage = refundedResourcesMessageParts.length > 0 ? ` Recovered ${refundedResourcesMessageParts.join(', ')}.` : ' No resources recovered.';
  
  newState.resources = newResources; 

  newState.structures.splice(structureIndex, 1); 
  
  if (buildingType.populationCapacity) {
    const newMaxCapacity = calculateMaxPopulationCapacityAfterRemoval(newState.structures); 
    if (newState.resources.population > newMaxCapacity) {
      const SPREADSHEET_ONLINE_EDITOR_MAX_ROWS = newState.resources.population - newMaxCapacity;
      newState.resources.population = newMaxCapacity; 
      
      const homelessMessage = `${SPREADSHEET_ONLINE_EDITOR_MAX_ROWS} citizen(s) became homeless and left after demolishing ${buildingType.name}.`;
      newState.currentEvent = (newState.currentEvent ? newState.currentEvent + " | " : "") + homelessMessage;

      if (newState.resources.population <= 0 && !newState.isGameOver) {
        newState.isGameOver = true;
        newState.currentEvent = (newState.currentEvent ? newState.currentEvent + " | " : "") + `Demolishing vital housing (${buildingType.name}) led to the demise of your last citizens. The realm is lost.`;
      }
    }
  }
  
  if (!newState.isGameOver) { 
     newState.currentEvent = (newState.currentEvent ? newState.currentEvent + " | " : "") + `${buildingType.name} demolished.${refundMessage}`;
  }

  return newState;
}
