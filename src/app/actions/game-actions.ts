
'use server';

import type { GameState, ResourceSet } from '@/types/game';
import { BUILDING_TYPES, TURN_EVENTS } from '@/config/game-config';

export async function advanceTurn(currentGameState: GameState): Promise<GameState> {
  if (currentGameState.isGameOver) {
    return currentGameState; // No actions if game is already over
  }

  const newState: GameState = JSON.parse(JSON.stringify(currentGameState)); // Deep copy
  newState.currentTurn += 1;
  
  let newResources: ResourceSet = { ...newState.resources }; // Use let for newResources
  let newPopulation = newState.resources.population;
  
  const eventMessages: string[] = [];
  
  // Check for work stoppage BEFORE production calculation
  const workStoppage = newResources.gold <= 0;

  // 1. Calculate Upkeep and Production from structures
  let totalUpkeep: Partial<Omit<ResourceSet, 'population'>> = {}; 
  let totalProduction: Partial<Omit<ResourceSet, 'population'>> = {};

  newState.structures.forEach(structure => {
    const type = BUILDING_TYPES[structure.typeId];
    if (type) {
      Object.entries(type.upkeep).forEach(([res, val]) => {
        totalUpkeep[res as keyof Omit<ResourceSet, 'population'>] = (totalUpkeep[res as keyof Omit<ResourceSet, 'population'>] || 0) + val;
      });

      let buildingProduces = true;
      if (workStoppage) {
        if (type.upkeep.gold && type.upkeep.gold > 0) {
            buildingProduces = false;
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
  const foodConsumptionPerPerson = 1; 
  const foodConsumedThisTurn = newPopulation * foodConsumptionPerPerson;
  newResources.food -= foodConsumedThisTurn;

  // 3. Starvation & Population Change
  if (newResources.food < 0) {
    const foodDeficit = Math.abs(newResources.food);
    const peopleLost = newPopulation > 0 ? Math.max(1, Math.ceil(foodDeficit / 2)) : 0; 
    const actualPeopleLost = Math.min(newPopulation, peopleLost); 
    
    if (actualPeopleLost > 0) {
        newPopulation = Math.max(0, newPopulation - actualPeopleLost);
        eventMessages.push(`${actualPeopleLost} citizen(s) perished from starvation!`);
    }
    newResources.food = 0; 
  } else if (newResources.food === 0 && newPopulation > 0) {
    const peopleLost = Math.min(newPopulation, 1);
    if (peopleLost > 0) {
        newPopulation = Math.max(0, newPopulation - peopleLost);
        eventMessages.push(`${peopleLost} citizen starved due to critical food shortage!`);
    }
  }

  newState.resources = { ...newResources, population: newPopulation };

  // 4. Game Over Check (due to population from starvation)
  if (newState.resources.population <= 0 && !newState.isGameOver) { // Ensure not already game over
    newState.isGameOver = true;
    const gameOverMsg = "The last of your people have perished. Your realm has fallen into ruin.";
    if (!eventMessages.some(msg => msg.includes("perished") || msg.includes("starved"))) {
        eventMessages.push(gameOverMsg);
    } else {
        eventMessages.push("Your realm has fallen due to depopulation.");
    }
    newState.currentEvent = eventMessages.join(' | ');
    return newState; 
  }
  
  // 5. General Work Stoppage message
  if (workStoppage && !eventMessages.some(msg => msg.includes("lack of gold"))) { 
    eventMessages.push("The realm's coffers are empty! Workers are unpaid, and overall production is affected.");
  }

  // 6. Random Event (only if not game over)
  if (!newState.isGameOver && TURN_EVENTS.length > 0) {
    const eventDefinition = TURN_EVENTS[Math.floor(Math.random() * TURN_EVENTS.length)];
    eventMessages.push(eventDefinition.message);

    if (eventDefinition.effect) {
      // Pass a deep copy of the relevant part of the state to the effect function
      const effectResult = eventDefinition.effect(JSON.parse(JSON.stringify({resources: newState.resources, structures: newState.structures, currentTurn: newState.currentTurn }))); 
      
      if (effectResult.resourceDelta) {
        for (const rKey of Object.keys(effectResult.resourceDelta) as Array<keyof ResourceSet>) {
          const delta = effectResult.resourceDelta[rKey];
          if (delta !== undefined) {
            newState.resources[rKey] = (newState.resources[rKey] || 0) + delta;
            // Ensure non-population resources don't go negative from an event, unless intended by negative delta
            if (rKey !== 'population' && newState.resources[rKey] < 0) {
                 newState.resources[rKey as keyof Omit<ResourceSet, 'population'>] = 0;
            }
          }
        }
      }
      
      if (effectResult.additionalMessage) {
        eventMessages.push(effectResult.additionalMessage);
      }

      // Re-check game over if population dropped to 0 or below due to an event
      if (newState.resources.population <= 0 && !newState.isGameOver) {
          newState.isGameOver = true;
          const gameOverMsg = "A sudden calamity has wiped out your remaining population! The realm is lost.";
           if (!eventMessages.some(msg => msg.includes("perished") || msg.includes("starved") || msg.includes("calamity"))) {
               eventMessages.push(gameOverMsg);
           } else if (!eventMessages.some(msg => msg.includes("calamity"))) {
               eventMessages.push("The realm has fallen due to events beyond your control.");
           }
      }
    }
  }
  
  // If game became over due to an event, set the event message and return
  if (newState.isGameOver) {
    newState.currentEvent = eventMessages.filter(Boolean).join(' | ');
    return newState;
  }

  newState.currentEvent = eventMessages.filter(Boolean).join(' | ');

  return newState;
}
