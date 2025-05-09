
'use server';

import type { GameState, ResourceSet } from '@/types/game';
import { BUILDING_TYPES } from '@/config/game-config';

const REFUND_PERCENTAGE = 0.5; // 50% refund

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
    // Optionally add a game event if this happens due to some bug
    newState.currentEvent = (newState.currentEvent ? newState.currentEvent + " | " : "") + `Error: Structure ID ${structureId} not found for deletion.`;
    return newState; 
  }

  const structureToRemove = newState.structures[structureIndex];
  const buildingType = BUILDING_TYPES[structureToRemove.typeId];

  if (!buildingType) {
    console.warn(`Building type ${structureToRemove.typeId} not found for deleted structure ID ${structureId}.`);
    newState.structures.splice(structureIndex, 1); // Remove structure even if type is unknown
    newState.currentEvent = (newState.currentEvent ? newState.currentEvent + " | " : "") + `An unknown structure was demolished. No resources recovered.`;
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


  // Adjust population if the building provided it
  if (buildingType.providesPopulation) {
    newResources.population = Math.max(0, newResources.population - buildingType.providesPopulation);
    // Check for game over if population hits 0 after deleting housing
    if (newResources.population <= 0 && !newState.isGameOver) { // Check !newState.isGameOver to avoid overriding existing game over event
        newState.isGameOver = true;
        newState.currentEvent = (newState.currentEvent ? newState.currentEvent + " | " : "") + `Demolishing vital housing (${buildingType.name}) led to the demise of your last citizens. The realm is lost.`;
    }
  }
  
  newState.resources = newResources;

  // Remove structure
  newState.structures.splice(structureIndex, 1);
  
  if (!newState.isGameOver) { // Only add standard demolition message if not game over
     newState.currentEvent = (newState.currentEvent ? newState.currentEvent + " | " : "") + `${buildingType.name} demolished.${refundMessage}`;
  }


  return newState;
}

