
'use server';

import type { GameState, ResourceSet, PlacedStructure } from '@/types/game';
import { BUILDING_TYPES, TURN_EVENTS, BASE_POPULATION_CAPACITY } from '@/config/game-config';

const calculateMaxPopulationCapacity = (structures: Readonly<PlacedStructure[]>): number => {
  let capacity = BASE_POPULATION_CAPACITY; // Start with base capacity
  structures.forEach(structure => {
    const buildingDef = BUILDING_TYPES[structure.typeId];
    if (buildingDef && buildingDef.populationCapacity) {
      capacity += buildingDef.populationCapacity;
    }
  });
  return capacity;
};

export async function advanceTurn(currentGameState: GameState): Promise<GameState> {
  if (currentGameState.isGameOver) {
    return currentGameState;
  }

  const newState: GameState = JSON.parse(JSON.stringify(currentGameState)); // Deep copy
  newState.currentTurn += 1;
  
  let newResources: ResourceSet = { ...newState.resources };
  let currentTurnPopulation = newState.resources.population; // Use this to track population changes within this turn's logic
  
  const eventMessages: string[] = [];

  // 0. Calculate Max Population Capacity
  const maxPopulationCapacity = calculateMaxPopulationCapacity(newState.structures);

  // 0.1. Immigration: New citizens arrive if there's space and enough food
  if (currentTurnPopulation < maxPopulationCapacity) {
    const immigrants = 1; 
    const foodNeededForExistingAndNew = Math.ceil((currentTurnPopulation + immigrants) * 0.5); 

    if (newResources.food >= foodNeededForExistingAndNew) {
      currentTurnPopulation += immigrants;
      eventMessages.push(`${immigrants} new citizen(s) arrived, attracted by available housing and food!`);
    } else if (newResources.food < currentTurnPopulation * 0.5) { 
        eventMessages.push(`Potential settlers saw your realm but were deterred by severe food shortages.`);
    } else {
        eventMessages.push(`Potential new settlers arrived, but there wasn't quite enough food to support them immediately.`);
    }
  }


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
  const foodConsumedThisTurn = Math.ceil(currentTurnPopulation * 0.5); 
  newResources.food -= foodConsumedThisTurn;

  // 3. Starvation & Population Change
  if (newResources.food < 0) {
    const foodDeficit = Math.abs(newResources.food);
    const peopleLost = currentTurnPopulation > 0 ? Math.max(1, Math.ceil(foodDeficit / 1)) : 0; 
    const actualPeopleLost = Math.min(currentTurnPopulation, peopleLost); 
    
    if (actualPeopleLost > 0) {
        currentTurnPopulation = Math.max(0, currentTurnPopulation - actualPeopleLost);
        eventMessages.push(`${actualPeopleLost} citizen(s) perished from starvation!`);
    }
    newResources.food = 0; 
  } else if (newResources.food === 0 && currentTurnPopulation > 0 && foodConsumedThisTurn > 0) { 
    const peopleLost = Math.min(currentTurnPopulation, 1); 
    if (peopleLost > 0) {
        currentTurnPopulation = Math.max(0, currentTurnPopulation - peopleLost);
        eventMessages.push(`${peopleLost} citizen starved due to critical food shortage!`);
    }
  }

  // 3.5 Overpopulation check (if current population exceeds max capacity)
  if (currentTurnPopulation > maxPopulationCapacity) {
    const SPREADSHEET_ONLINE_EDITOR_MAX_ROWS = currentTurnPopulation - maxPopulationCapacity;
    if (SPREADSHEET_ONLINE_EDITOR_MAX_ROWS > 0) {
      currentTurnPopulation = maxPopulationCapacity;
      eventMessages.push(`${SPREADSHEET_ONLINE_EDITOR_MAX_ROWS} citizen(s) became homeless due to overcrowding and left the realm.`);
    }
  }

  // Apply population changes from phase 0-3.5 to newState for interim checks and subsequent event logic
  newState.resources = { ...newResources, population: currentTurnPopulation };


  // 4. Game Over Check (due to population from starvation or overcrowding from initial phases)
  if (newState.resources.population <= 0 && !newState.isGameOver) { 
    newState.isGameOver = true;
    const gameOverReason = eventMessages.some(msg => msg.includes("starvation") || msg.includes("starved")) 
        ? "Your realm has fallen due to starvation." 
        : eventMessages.some(msg => msg.includes("homeless")) 
            ? "Your realm has fallen due to severe overcrowding and lack of housing."
            : "The last of your people have perished. Your realm has fallen into ruin.";
    
    if (!eventMessages.some(msg => msg.includes("perished") || msg.includes("starved") || msg.includes("homeless") )) {
        eventMessages.push("The last of your people have vanished. Your realm has fallen into ruin.");
    } else if (!eventMessages.some(msg => msg.toLowerCase().includes("fallen") || msg.toLowerCase().includes("lost"))) {
         eventMessages.push(gameOverReason);
    }
    newState.currentEvent = eventMessages.join(' | ');
    return newState; 
  }
  
  // 5. General Work Stoppage message
  if (workStoppage && !eventMessages.some(msg => msg.includes("lack of gold"))) { 
    eventMessages.push("The realm's coffers are empty! Workers are unpaid, and overall production is affected.");
  }

  // EVENT PHASE
  // Specific 1/50 Probability Bandit Ambush Event
  if (!newState.isGameOver && Math.random() < 0.02) { // 1/50 chance = 0.02
    let populationLossByAmbush = Math.floor(Math.random() * 3) + 1; // Kills 1 to 3 people
    populationLossByAmbush = Math.min(populationLossByAmbush, newState.resources.population); // Cannot lose more than current population

    if (populationLossByAmbush > 0) {
      newState.resources.population -= populationLossByAmbush;
      // currentTurnPopulation = newState.resources.population; // Update tracker if used later, but direct modification is fine here.
      const ambushMessage = `A sudden bandit ambush! They killed ${populationLossByAmbush} citizen(s).`;
      eventMessages.push(ambushMessage);
      
      if (newState.resources.population <= 0 && !newState.isGameOver) {
        newState.isGameOver = true;
        eventMessages.push("The bandit ambush wiped out your remaining people. The realm is lost.");
      }
    }
  }

  // 6. General Random Event (from TURN_EVENTS array)
  if (!newState.isGameOver && TURN_EVENTS.length > 0) {
    const eventDefinition = TURN_EVENTS[Math.floor(Math.random() * TURN_EVENTS.length)];
    if (!eventMessages.includes(eventDefinition.message)) { // Avoid duplicate generic messages
        eventMessages.push(eventDefinition.message);
    }

    if (eventDefinition.effect) {
      // Pass the most current state to the effect function
      const effectResult = eventDefinition.effect(JSON.parse(JSON.stringify({resources: newState.resources, structures: newState.structures, currentTurn: newState.currentTurn }))); 
      
      if (effectResult.resourceDelta) {
        for (const rKey of Object.keys(effectResult.resourceDelta) as Array<keyof ResourceSet>) {
          const delta = effectResult.resourceDelta[rKey];
          if (delta !== undefined) {
            if (rKey === 'population') {
              const potentialNewPopulation = newState.resources.population + delta;
              if (delta > 0) { 
                const currentMaxCap = calculateMaxPopulationCapacity(newState.structures); // Recalculate with current state for event context
                newState.resources.population = Math.min(potentialNewPopulation, currentMaxCap);
                if (potentialNewPopulation > currentMaxCap && currentMaxCap > newState.resources.population - delta) { // Checks if cap limited actual gain
                   eventMessages.push(`An event tried to increase population, but housing was limited. Only ${currentMaxCap - (newState.resources.population - delta)} could settle.`);
                } else if (potentialNewPopulation > currentMaxCap && currentMaxCap === BASE_POPULATION_CAPACITY && newState.structures.filter(s => s.typeId === 'hut').length === 0 ) { 
                    eventMessages.push(`An event tried to increase population, but there is no housing beyond the initial settlement.`);
                } else if (potentialNewPopulation > currentMaxCap && currentMaxCap === 0) { 
                    eventMessages.push(`An event tried to increase population, but there is absolutely no housing.`);
                }
              } else { 
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

      if (newState.resources.population <= 0 && !newState.isGameOver) {
          newState.isGameOver = true;
          const calamityMsg = "A sudden calamity has wiped out your remaining population! The realm is lost.";
          if (!eventMessages.some(msg => msg.includes("calamity"))) {
              eventMessages.push(calamityMsg);
          } else if (!eventMessages.some(m => m.toLowerCase().includes("lost.") || m.toLowerCase().includes("fallen."))) {
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
  
  // Final game over check if any event during the EVENT PHASE led to it.
  if (newState.resources.population <= 0 && !newState.isGameOver) {
    newState.isGameOver = true;
    if (!eventMessages.some(msg => msg.toLowerCase().includes("lost.") || msg.toLowerCase().includes("fallen.") || msg.toLowerCase().includes("perished."))) {
        eventMessages.push("Events have conspired against you, and your last citizen has vanished. The realm is lost.");
    }
  }

  newState.currentEvent = eventMessages.filter(Boolean).join(' | ');
  return newState;
}

