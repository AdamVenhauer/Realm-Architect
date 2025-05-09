'use server';

import type { GameState, ResourceSet, PlacedStructure } from '@/types/game';
import { BUILDING_TYPES, TURN_EVENTS } from '@/config/game-config';

const calculateMaxPopulationCapacity = (structures: Readonly<PlacedStructure[]>): number => {
  let capacity = 0;
  structures.forEach(structure => {
    const buildingDef = BUILDING_TYPES[structure.typeId];
    if (buildingDef && buildingDef.populationCapacity) {
      capacity += buildingDef.populationCapacity;
    }
  });
  // If no huts are built, initial population might rely on a base capacity or are "homeless".
  // For this model, capacity is strictly from Huts. If initial pop is 5 and no huts, they are overcrowded.
  return capacity;
};

export async function advanceTurn(currentGameState: GameState): Promise<GameState> {
  if (currentGameState.isGameOver) {
    return currentGameState;
  }

  const newState: GameState = JSON.parse(JSON.stringify(currentGameState)); // Deep copy
  newState.currentTurn += 1;
  
  let newResources: ResourceSet = { ...newState.resources };
  let newPopulation = newState.resources.population;
  
  const eventMessages: string[] = [];

  // 0. Calculate Max Population Capacity
  const maxPopulationCapacity = calculateMaxPopulationCapacity(newState.structures);

  // 0.1. Immigration: New citizens arrive if there's space and enough food
  if (newPopulation < maxPopulationCapacity) {
    const immigrants = 1; // For simplicity, 1 immigrant per turn if conditions met
    const foodNeededForExistingAndNew = Math.ceil((newPopulation + immigrants) * 0.5); // 0.5 food per person

    if (newResources.food >= foodNeededForExistingAndNew) {
      newPopulation += immigrants;
      eventMessages.push(`${immigrants} new citizen(s) arrived, attracted by available housing and food!`);
    } else if (newResources.food < newPopulation * 0.5) { // Not even enough for current pop
        eventMessages.push(`Potential settlers saw your realm but were deterred by severe food shortages.`);
    } else {
        eventMessages.push(`Potential new settlers arrived, but there wasn't quite enough food to support them immediately.`);
    }
  }


  // Check for work stoppage BEFORE production calculation
  const workStoppage = newResources.gold <= 0;

  // 1. Calculate Upkeep and Production from structures
  let totalUpkeep: Partial<Omit<ResourceSet, 'population'>> = {}; 
  let totalProduction: Partial<Omit<ResourceSet, 'population'>> = { wood: 0, stone: 0, food: 0, gold: 0 };

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

  // Apply Library bonus
  const numberOfLibraries = newState.structures.filter(s => s.typeId === 'library').length;
  if (numberOfLibraries > 0 && !workStoppage) {
    const libraryBonus = numberOfLibraries * 1; 
    totalProduction.wood = (totalProduction.wood || 0) + libraryBonus;
    totalProduction.stone = (totalProduction.stone || 0) + libraryBonus;
    totalProduction.food = (totalProduction.food || 0) + libraryBonus;
    if (libraryBonus > 0) {
        eventMessages.push(`Libraries contribute +${libraryBonus} to wood, stone, and food production.`);
    }
  }

  // Apply collected upkeep
  for (const [resource, amount] of Object.entries(totalUpkeep)) {
    newResources[resource as keyof Omit<ResourceSet, 'population'>] = Math.max(0, (newResources[resource as keyof Omit<ResourceSet, 'population'>] || 0) - amount);
  }

  // Apply collected production
  for (const [resource, amount] of Object.entries(totalProduction)) {
    newResources[resource as keyof Omit<ResourceSet, 'population'>] = (newResources[resource as keyof Omit<ResourceSet, 'population'>] || 0) + amount;
  }
  
  // 2. Food Consumption by Population (Reduced consumption rate)
  const foodConsumedThisTurn = Math.ceil(newPopulation * 0.5); // Each person effectively consumes 0.5 food
  newResources.food -= foodConsumedThisTurn;

  // 3. Starvation & Population Change
  if (newResources.food < 0) {
    const foodDeficit = Math.abs(newResources.food);
    // People lost is more sensitive now due to lower consumption; 1 person per 1 food deficit (effectively 2 units of original consumption deficit)
    const peopleLost = newPopulation > 0 ? Math.max(1, Math.ceil(foodDeficit / 1)) : 0; 
    const actualPeopleLost = Math.min(newPopulation, peopleLost); 
    
    if (actualPeopleLost > 0) {
        newPopulation = Math.max(0, newPopulation - actualPeopleLost);
        eventMessages.push(`${actualPeopleLost} citizen(s) perished from starvation!`);
    }
    newResources.food = 0; 
  } else if (newResources.food === 0 && newPopulation > 0 && foodConsumedThisTurn > 0) { // food became 0 AFTER consumption
    const peopleLost = Math.min(newPopulation, 1); 
    if (peopleLost > 0) {
        newPopulation = Math.max(0, newPopulation - peopleLost);
        eventMessages.push(`${peopleLost} citizen starved due to critical food shortage!`);
    }
  }

  // 3.5 Overpopulation check (if current population exceeds max capacity)
  if (newPopulation > maxPopulationCapacity) {
    const SPREADSHEET_ONLINE_EDITOR_MAX_ROWS = newPopulation - maxPopulationCapacity;
    if (SPREADSHEET_ONLINE_EDITOR_MAX_ROWS > 0) {
      newPopulation = maxPopulationCapacity;
      eventMessages.push(`${SPREADSHEET_ONLINE_EDITOR_MAX_ROWS} citizen(s) became homeless due to overcrowding and left the realm.`);
    }
  }

  newState.resources = { ...newResources, population: newPopulation };

  // 4. Game Over Check (due to population from starvation or overcrowding)
  if (newState.resources.population <= 0 && !newState.isGameOver) { 
    newState.isGameOver = true;
    const gameOverReason = eventMessages.some(msg => msg.includes("starvation") || msg.includes("starved")) 
        ? "Your realm has fallen due to starvation." 
        : eventMessages.some(msg => msg.includes("homeless")) 
            ? "Your realm has fallen due to severe overcrowding and lack of housing."
            : "The last of your people have perished. Your realm has fallen into ruin.";
    
    if (!eventMessages.some(msg => msg.includes("perished") || msg.includes("starved") || msg.includes("homeless") )) {
        eventMessages.push("The last of your people have vanished. Your realm has fallen into ruin.");
    } else {
         eventMessages.push(gameOverReason);
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
    // Ensure a new distinct message is added, or append if it makes sense
    if (!eventMessages.includes(eventDefinition.message)) {
        eventMessages.push(eventDefinition.message);
    }


    if (eventDefinition.effect) {
      const effectResult = eventDefinition.effect(JSON.parse(JSON.stringify({resources: newState.resources, structures: newState.structures, currentTurn: newState.currentTurn }))); 
      
      if (effectResult.resourceDelta) {
        for (const rKey of Object.keys(effectResult.resourceDelta) as Array<keyof ResourceSet>) {
          const delta = effectResult.resourceDelta[rKey];
          if (delta !== undefined) {
            if (rKey === 'population') {
              // Population changes from events also need to respect housing capacity
              const potentialNewPopulation = (newState.resources.population || 0) + delta;
              if (delta > 0) { // Population increase from event
                newState.resources.population = Math.min(potentialNewPopulation, maxPopulationCapacity);
                if (potentialNewPopulation > maxPopulationCapacity && maxPopulationCapacity > 0) {
                   eventMessages.push(`An event tried to increase population, but housing was limited. Only ${maxPopulationCapacity - (newState.resources.population - delta)} could settle.`);
                } else if (potentialNewPopulation > maxPopulationCapacity && maxPopulationCapacity === 0) {
                    eventMessages.push(`An event tried to increase population, but there is no housing.`);
                }
              } else { // Population decrease
                newState.resources.population = Math.max(0, potentialNewPopulation);
              }
            } else {
              newState.resources[rKey as keyof Omit<ResourceSet, 'population'>] = (newState.resources[rKey as keyof Omit<ResourceSet, 'population'>] || 0) + delta;
              if (newState.resources[rKey as keyof Omit<ResourceSet, 'population'>] < 0) {
                   newState.resources[rKey as keyof Omit<ResourceSet, 'population'>] = 0;
              }
            }
          }
        }
      }
      
      if (effectResult.additionalMessage && !eventMessages.includes(effectResult.additionalMessage)) {
        eventMessages.push(effectResult.additionalMessage);
      }

      // Re-check game over if population dropped to 0 or below due to an event
      if (newState.resources.population <= 0 && !newState.isGameOver) {
          newState.isGameOver = true;
          const calamityMsg = "A sudden calamity has wiped out your remaining population! The realm is lost.";
          if (!eventMessages.some(msg => msg.includes("calamity"))) {
              eventMessages.push(calamityMsg);
          } else {
              eventMessages.push("The realm has fallen due to events beyond your control.");
          }
      }
    }
  }

  // 7. Recurring Gift Event (every 10 turns)
  if (!newState.isGameOver && newState.currentTurn % 10 === 0) {
    const giftableResources: (keyof Omit<ResourceSet, 'population'>)[] = ['wood', 'stone', 'food', 'gold'];
    const randomResource = giftableResources[Math.floor(Math.random() * giftableResources.length)];
    const randomAmount = Math.floor(Math.random() * 10) + 1; // 1 to 10

    newState.resources[randomResource] = (newState.resources[randomResource] || 0) + randomAmount;
    eventMessages.push(`A loyal subject has gifted you ${randomAmount} ${randomResource}! Your benevolence is recognized.`);
  }
  
  if (newState.isGameOver) {
    newState.currentEvent = eventMessages.filter(Boolean).join(' | ');
    return newState;
  }

  newState.currentEvent = eventMessages.filter(Boolean).join(' | ');

  return newState;
}

