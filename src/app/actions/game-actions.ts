
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
  
  // Check for work stoppage BEFORE production calculation
  const workStoppage = newResources.gold <= 0;

  // 1. Calculate Upkeep and Production from structures
  let totalUpkeep: Partial<Omit<ResourceSet, 'population'>> = {}; // Exclude population from direct upkeep/production keys
  let totalProduction: Partial<Omit<ResourceSet, 'population'>> = {};

  newState.structures.forEach(structure => {
    const type = BUILDING_TYPES[structure.typeId];
    if (type) {
      // Apply upkeep costs
      Object.entries(type.upkeep).forEach(([res, val]) => {
        totalUpkeep[res as keyof Omit<ResourceSet, 'population'>] = (totalUpkeep[res as keyof Omit<ResourceSet, 'population'>] || 0) + val;
      });

      // Apply production (conditional on work stoppage)
      let buildingProduces = true;
      if (workStoppage) {
        // If gold is 0, buildings that have gold in their upkeep stop producing.
        if (type.upkeep.gold && type.upkeep.gold > 0) {
            buildingProduces = false;
            // Add specific event message only once per turn for this building type to avoid spam
            const stoppageMsg = `${type.name} ceased production due to lack of gold for upkeep.`;
            if (!eventMessages.includes(stoppageMsg)) {
                 eventMessages.push(stoppageMsg);
            }
        }
      }
      
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
  const foodConsumptionPerPerson = 1; // Each person consumes 1 food per turn
  const foodConsumedThisTurn = newPopulation * foodConsumptionPerPerson;
  newResources.food -= foodConsumedThisTurn;

  // 3. Starvation & Population Change
  if (newResources.food < 0) {
    const foodDeficit = Math.abs(newResources.food);
    // Example: 1 person dies for every 2 food deficit (or minimum 1 if any deficit and population > 0).
    const peopleLost = newPopulation > 0 ? Math.max(1, Math.ceil(foodDeficit / 2)) : 0; 
    const actualPeopleLost = Math.min(newPopulation, peopleLost); // Cannot lose more than current population
    
    if (actualPeopleLost > 0) {
        newPopulation = Math.max(0, newPopulation - actualPeopleLost);
        eventMessages.push(`${actualPeopleLost} citizen(s) perished from starvation!`);
    }
    newResources.food = 0; // Food cannot remain negative
  } else if (newResources.food === 0 && newPopulation > 0) {
    // If food is exactly zero and population > 0, one person starves (as a harsh penalty for 0 food).
    const peopleLost = Math.min(newPopulation, 1);
    if (peopleLost > 0) {
        newPopulation = Math.max(0, newPopulation - peopleLost);
        eventMessages.push(`${peopleLost} citizen starved due to critical food shortage!`);
    }
  }

  newState.resources = { ...newResources, population: newPopulation };

  // 4. Game Over Check (due to population or other critical failures)
  if (newState.resources.population <= 0) {
    newState.isGameOver = true;
    // Add game over message if not already added by starvation specific message
    const gameOverMsg = "The last of your people have perished. Your realm has fallen into ruin.";
    if (!eventMessages.some(msg => msg.includes("perished") || msg.includes("starved"))) {
        eventMessages.push(gameOverMsg);
    } else {
        // Ensure a clear game over statement if specific starvation messages already exist
        eventMessages.push("Your realm has fallen due to depopulation.");
    }
    newState.currentEvent = eventMessages.join(' | ');
    return newState; // Game over, return immediately
  }
  
  // 5. General Work Stoppage message if gold is 0 and no specific building messages were added
  if (workStoppage && !eventMessages.some(msg => msg.includes("lack of gold"))) { 
    eventMessages.push("The realm's coffers are empty! Workers are unpaid, and overall production is affected.");
  }

  // 6. Random Event (only if not game over)
  if (!newState.isGameOver) {
    const randomEvent = TURN_EVENTS[Math.floor(Math.random() * TURN_EVENTS.length)];
    eventMessages.push(randomEvent);
  }

  newState.currentEvent = eventMessages.filter(Boolean).join(' | ');

  return newState;
}

