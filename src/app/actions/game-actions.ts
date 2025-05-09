
'use server';

import type { GameState, ResourceSet, BuildingType } from '@/types/game';
import { BUILDING_TYPES, TURN_EVENTS } from '@/config/game-config';

export async function advanceTurn(currentGameState: GameState): Promise<GameState> {
  if (currentGameState.isGameOver) {
    return currentGameState; // No actions if game is already over
  }

  const newState: GameState = JSON.parse(JSON.stringify(currentGameState)); // Deep copy
  newState.currentTurn += 1;
  
  const newResources: ResourceSet = { ...newState.resources };
  let newPopulation = newState.resources.population;
  
  const eventMessages: string[] = [];
  const workStoppage = newResources.gold <= 0;

  // 1. Calculate Upkeep and Production from structures
  let totalUpkeep: Partial<Omit<ResourceSet, 'population'>> = {};
  let totalProduction: Partial<Omit<ResourceSet, 'population'>> = {};

  newState.structures.forEach(structure => {
    const type = BUILDING_TYPES[structure.typeId];
    if (type) {
      // Apply upkeep
      Object.entries(type.upkeep).forEach(([res, val]) => {
        totalUpkeep[res as keyof Omit<ResourceSet, 'population'>] = (totalUpkeep[res as keyof Omit<ResourceSet, 'population'>] || 0) + val;
      });

      // Apply production (conditional on work stoppage)
      let buildingProduces = true;
      if (workStoppage) {
        // Simple: if gold is 0, buildings requiring gold upkeep or directly costing gold might stop.
        // More complex: check if specific upkeep can be paid.
        // For now, let's say if gold is 0, production requiring gold upkeep or any gold cost stops.
        // Or more simply, all production requiring workers might stop if gold is 0 as wages can't be paid.
        // Let's make it so if gold is 0, buildings that have gold in their upkeep stop.
        if (type.upkeep.gold && type.upkeep.gold > 0) {
            buildingProduces = false;
            eventMessages.push(`${type.name} ceased production due to lack of gold for upkeep.`);
        }
      }
      
      // Production also depends on having enough population for "worker" slots (implicit for now)
      // For simplicity, we assume buildings operate if not for work stoppage due to gold.
      // A more complex system would tie workers (population) to building operation.

      if (buildingProduces) {
        Object.entries(type.production).forEach(([res, val]) => {
          totalProduction[res as keyof Omit<ResourceSet, 'population'>] = (totalProduction[res as keyof Omit<ResourceSet, 'population'>] || 0) + val;
        });
      }
    }
  });

  // Apply collected upkeep
  for (const [resource, amount] of Object.entries(totalUpkeep)) {
    newResources[resource as keyof Omit<ResourceSet, 'population'>] = Math.max(0, (newResources[resource as keyof Omit<ResourceSet, 'population'>] || 0) - amount);
  }

  // Apply collected production
  for (const [resource, amount] of Object.entries(totalProduction)) {
    newResources[resource as keyof Omit<ResourceSet, 'population'>] = (newResources[resource as keyof Omit<ResourceSet, 'population'>] || 0) + amount;
  }
  
  // 2. Food Consumption by Population
  const foodConsumptionPerPerson = 1;
  const foodConsumedThisTurn = newPopulation * foodConsumptionPerPerson;
  newResources.food -= foodConsumedThisTurn;

  // 3. Starvation & Population Change
  if (newResources.food < 0) {
    const foodDeficit = Math.abs(newResources.food);
    // Example: 1 person dies for every 2 food deficit, or minimum 1 if any deficit.
    const peopleLost = Math.max(1, Math.ceil(foodDeficit / 2)); 
    const actualPeopleLost = Math.min(newPopulation, peopleLost); // Cannot lose more than current population
    
    if (actualPeopleLost > 0) {
        newPopulation = Math.max(0, newPopulation - actualPeopleLost);
        eventMessages.push(`${actualPeopleLost} citizen(s) died from starvation!`);
    }
    newResources.food = 0;
  } else if (newResources.food === 0 && newPopulation > 0) {
    // If food is exactly zero, one person starves (if population > 0)
    const peopleLost = Math.min(newPopulation, 1);
    if (peopleLost > 0) {
        newPopulation = Math.max(0, newPopulation - peopleLost);
        eventMessages.push(`${peopleLost} citizen(s) died from lack of food!`);
    }
  }

  newState.resources = { ...newResources, population: newPopulation };

  // 4. Game Over Check
  if (newState.resources.population <= 0) {
    newState.isGameOver = true;
    eventMessages.push("The last of your people have perished. Your realm has fallen.");
    newState.currentEvent = eventMessages.join(' | ');
    return newState; // Game over, return immediately
  }
  
  // 5. Work Stoppage due to no gold (already checked for production)
  if (workStoppage && !eventMessages.some(msg => msg.includes("lack of gold"))) { // Avoid duplicate generic message if specific building messages exist
    eventMessages.push("The realm's coffers are empty! Workers are unpaid, and production may be affected.");
  }


  // 6. Random Event (only if not game over)
  const randomEvent = TURN_EVENTS[Math.floor(Math.random() * TURN_EVENTS.length)];
  eventMessages.push(randomEvent);

  newState.currentEvent = eventMessages.filter(Boolean).join(' | '); // Filter out any null/empty messages

  return newState;
}
