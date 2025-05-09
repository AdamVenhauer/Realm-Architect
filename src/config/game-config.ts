
import type { BuildingType, QuestDefinition, ResourceSet, GameState, PlacedStructure } from '@/types/game';
import { Home, Carrot, Pickaxe, Trees, Mountain, Coins, Apple, PackageIcon, Hammer, Play, Globe, Axe, Trophy, ListChecks, Target, Users, ShieldAlert, Skull, Warehouse, Castle, Banknote, Zap, Sprout, CandlestickChart, Brain, Gem, Clock, Library, Factory, Building2, Hourglass, Award, ShieldCheck, Briefcase, ZapIcon, WindIcon, SunIcon, ConstructionIcon, SmileIcon, AngryIcon, BookOpenIcon } from 'lucide-react';

export const APP_TITLE = "Realm Architect";
export const APP_ICON = Globe; // General icon, can remain

export const INITIAL_RESOURCES: ResourceSet = {
  wood: 100,
  stone: 100,
  food: 50,
  gold: 20,
  population: 5,
};

export const BASE_POPULATION_CAPACITY = 5;


export function getInitialGameState(): Omit<GameState, 'playerQuests' | 'selectedBuildingForConstruction' > { 
  return {
    resources: { ...INITIAL_RESOURCES },
    structures: [], 
    currentTurn: 1,
    currentEvent: null,
    isGameOver: false,
  };
}


export const BUILDING_TYPES: Record<string, BuildingType> = {
  hut: {
    id: 'hut',
    name: 'Hut',
    icon: Home,
    description: 'Basic housing. Provides 5 population capacity. Essential for population growth.',
    cost: { wood: 50, stone: 20 },
    upkeep: { food: 1 }, 
    production: {},
    populationCapacity: 5,
  },
  farm: {
    id: 'farm',
    name: 'Farm',
    icon: Carrot, 
    description: 'Produces food for your realm. Requires workers (population).',
    cost: { wood: 30, stone: 10 },
    upkeep: { gold: 1 }, 
    production: { food: 5 },
  },
  loggingCamp: {
    id: 'loggingCamp',
    name: 'Logging Camp',
    icon: Axe,
    description: 'Harvests wood from nearby forests. Requires workers.',
    cost: { stone: 30, gold: 5 },
    upkeep: { food: 1 },
    production: { wood: 3 },
  },
  stoneQuarry: {
    id: 'stoneQuarry',
    name: 'Stone Quarry',
    icon: Mountain,
    description: 'Extracts stone from the earth. Requires workers.',
    cost: { wood: 20, stone: 50 },
    upkeep: { food: 1 },
    production: { stone: 3 },
  },
  goldMine: {
    id: 'goldMine',
    name: 'Gold Mine',
    icon: Pickaxe,
    description: 'Extracts gold ore. Requires workers.',
    cost: { wood: 40, stone: 60 },
    upkeep: { food: 2, wood:1 },
    production: { gold: 2 },
  },
  lumberMill: {
    id: 'lumberMill',
    name: 'Lumber Mill',
    icon: Factory,
    description: 'Processes timber into usable wood more efficiently. Requires workers.',
    cost: { stone: 40, gold: 10 },
    upkeep: { food: 1 },
    production: { wood: 4 },
  },
  market: {
    id: 'market',
    name: 'Market',
    icon: Banknote, 
    description: 'Generates gold through trade and commerce.',
    cost: { wood: 70, stone: 30 },
    upkeep: { food: 1 }, 
    production: { gold: 5 },
  },
   library: {
    id: 'library',
    name: 'Library',
    icon: Library,
    description: 'Fosters advanced knowledge, passively boosting resource production (wood, stone, food by +1 per library).',
    cost: { wood: 100, stone: 150, gold: 50 },
    upkeep: { gold: 5 },
    production: {}, // Effect handled globally in advanceTurn
  },
  barracks: {
    id: 'barracks',
    name: 'Barracks',
    icon: ShieldAlert,
    description: 'Trains soldiers to defend your realm. Consumes resources for upkeep. Helps mitigate effects of raids and attacks. (Full defense mechanics are a future feature).',
    cost: { wood: 80, stone: 100, gold: 30 },
    upkeep: { food: 3, gold: 3 },
    production: {}, // Effect handled in specific event logic
  },
  warehouse: {
    id: 'warehouse',
    name: 'Warehouse',
    icon: Warehouse,
    description: 'Improves storage and logistics, reducing losses from certain negative events (e.g., pests, fires).',
    cost: { wood: 120, stone: 80 },
    upkeep: { gold: 2 },
    production: {}, // Effect handled in specific event logic
  },
};

export const RESOURCE_DETAILS = {
  wood: { name: 'Wood', icon: Trees, color: 'text-green-600 dark:text-green-400' },
  stone: { name: 'Stone', icon: Mountain, color: 'text-gray-500 dark:text-gray-400' },
  food: { name: 'Food', icon: Apple, color: 'text-red-500 dark:text-red-400' },
  gold: { name: 'Gold', icon: Coins, color: 'text-yellow-500 dark:text-yellow-400' },
  population: { name: 'Population', icon: Users, color: 'text-blue-500 dark:text-blue-400' },
};

export const ACTION_ICONS = {
  Build: Hammer,
  NextTurn: Play,
  Resources: PackageIcon,
  Quests: ListChecks,
  Delete: Skull, 
};

export interface GameEvent {
  message: string;
  icon?: LucideIcon;
  effect?: (currentState: Readonly<Pick<GameState, 'resources' | 'structures' | 'currentTurn'>>) => { 
    resourceDelta?: Partial<ResourceSet>; 
    additionalMessage?: string; 
  };
}

// Helper function now internal to this config, if needed by TURN_EVENTS for consistency
const calculateMaxPopCapacityForEvents = (structures: Readonly<PlacedStructure[]>): number => {
  let capacity = BASE_POPULATION_CAPACITY; // Use base capacity
  structures.forEach(structure => {
    const buildingDef = BUILDING_TYPES[structure.typeId];
    if (buildingDef && buildingDef.populationCapacity) {
      capacity += buildingDef.populationCapacity;
    }
  });
  return capacity;
};

export const TURN_EVENTS: GameEvent[] = [
  { message: "A gentle breeze rustles the leaves, a peaceful day in your realm." },
  { message: "Traders pass by, reporting a new route opening nearby, promising future opportunities." },
  { message: "A meteor shower was spotted last night! Some citizens believe it's a good omen." },
  { message: "Scouts have discovered ancient ruins nearby, hinting at forgotten secrets of this land." },
  {
    message: "Bountiful harvest! Favorable weather has led to an unexpected surplus of food.",
    icon: Sprout,
    effect: (currentState) => {
      const foodBonus = Math.max(5, Math.floor((currentState.resources.food || 0) * 0.1) + Math.floor(Math.random() * 10) + 5);
      return { resourceDelta: { food: foodBonus }, additionalMessage: `Gained an extra ${foodBonus} food from the bountiful harvest!` };
    }
  },
  {
    message: "A rare mineral vein was found by diligent miners, increasing stone and gold prospects.",
    icon: Gem,
    effect: () => {
      const stoneBonus = Math.floor(Math.random() * 15) + 5;
      const goldBonus = Math.floor(Math.random() * 8) + 2;
      return { resourceDelta: { stone: stoneBonus, gold: goldBonus }, additionalMessage: `Discovered ${stoneBonus} stone and ${goldBonus} gold!` };
    }
  },
  {
    message: "Improved logging techniques learned from a traveling artisan have slightly boosted wood output.",
    icon: Axe,
    effect: () => {
      const woodBonus = Math.floor(Math.random() * 12) + 5;
      return { resourceDelta: { wood: woodBonus }, additionalMessage: `New techniques yield an extra ${woodBonus} wood.` };
    }
  },
  {
    message: "A new family, drawn by tales of your realm, seeks to settle.",
    icon: Users,
    effect: (currentState) => {
      const maxCapacity = calculateMaxPopCapacityForEvents(currentState.structures); 
      if (currentState.resources.population < maxCapacity) {
        const immigrants = 1;
        const foodNeededForNextTurn = Math.ceil((currentState.resources.population + immigrants) * 0.5);
        if (currentState.resources.food >= foodNeededForNextTurn) {
          return { resourceDelta: { population: immigrants }, additionalMessage: `${immigrants} new citizen(s) have arrived and found shelter!` };
        } else {
          return { additionalMessage: "A new family arrived, but there isn't enough food to support them, so they moved on." };
        }
      }
      return { additionalMessage: "A new family arrived, but there was no housing available, so they moved on." };
    }
  },
  { message: "Whispers of unrest circulate due to low gold reserves. Workers are grumbling about delayed payments." },
  {
    message: "A mild sickness has spread through a part of the settlement. Some citizens are unable to work.",
    icon: Skull, // More fitting for sickness
    effect: (currentState) => {
      if (currentState.resources.population > 5) {
        const popLoss = 1; 
        const foodCost = Math.floor(Math.random() * 10) + 5; 
        return { 
          resourceDelta: { population: -popLoss, food: -foodCost }, 
          additionalMessage: `Sickness causes the loss of ${popLoss} citizen(s) and costs ${foodCost} food for care.` 
        };
      }
      return { additionalMessage: "A mild sickness passes without major incident due to the small population."};
    }
  },
  {
    message: "Tax collectors report slightly lower than expected gold income this turn due to minor evasions.",
    effect: (currentState) => {
      if (currentState.resources.gold > 10) {
        const goldLoss = Math.max(1, Math.floor(currentState.resources.gold * 0.05));
        return { resourceDelta: { gold: -goldLoss }, additionalMessage: `Tax income reduced by ${goldLoss} gold.` };
      }
      return { additionalMessage: "Tax collectors grumble but find little to take."};
    }
  },
  { message: "A wandering bard has arrived, composing a song about your growing realm, lifting spirits!" },
  { message: "Local wildlife seems more abundant this season, making hunting easier for those who forage." },
  {
    message: "A small fire broke out in a storage shed but was quickly extinguished by vigilant citizens. Some wood was lost.",
    icon: ZapIcon, // Using Zap for fire, as Flame is not available. Or keep it generic.
    effect: (currentState) => {
      const numWarehouses = currentState.structures.filter(s => s.typeId === 'warehouse').length;
      let woodLoss = 0;
      if (currentState.resources.wood > 20) {
        woodLoss = Math.floor(Math.random() * 10) + 5;
        const mitigationPerWarehouse = 3; 
        const actualMitigation = numWarehouses * mitigationPerWarehouse;
        woodLoss = Math.max(0, woodLoss - actualMitigation);
        
        let mitigationMessage = "";
        if (numWarehouses > 0 && actualMitigation > 0 && (woodLoss < (Math.floor(Math.random() * 10) + 5))) { 
            mitigationMessage = ` (Losses reduced by Warehouses)`;
        }
        return { resourceDelta: { wood: -woodLoss }, additionalMessage: `Lost ${woodLoss} wood in a small fire.${mitigationMessage}` };
      }
      return { additionalMessage: "A small fire was quickly put out with minimal losses."};
    }
  },
  { message: "Neighboring settlements speak of your realm with cautious optimism and respect for your leadership." },
  {
    message: "A trade caravan arrives, offering goods for gold.",
    effect: (currentState) => {
        const goldGain = Math.floor(Math.random() * 15) + 10;
        const woodCost = Math.floor(currentState.resources.wood * 0.05); 
        if (currentState.resources.wood > woodCost + 10) {
             return { resourceDelta: { gold: goldGain, wood: -woodCost }, additionalMessage: `Traded ${woodCost} wood for ${goldGain} gold with a passing caravan.` };
        }
        return { additionalMessage: "A trade caravan passed by, but you lacked surplus goods to trade."};
    }
  },
  {
    message: "Pests have infested some of the food stores!",
    effect: (currentState) => {
        const numWarehouses = currentState.structures.filter(s => s.typeId === 'warehouse').length;
        let foodLoss = 0;
        if (currentState.resources.food > 20) {
            const initialPotentialLoss = Math.max(5, Math.floor(currentState.resources.food * 0.1));
            foodLoss = initialPotentialLoss;
            const mitigationPerWarehouse = 3; 
            const actualMitigation = numWarehouses * mitigationPerWarehouse;
            foodLoss = Math.max(0, foodLoss - actualMitigation);
            
            let mitigationMessage = "";
            if (numWarehouses > 0 && foodLoss < initialPotentialLoss) { 
                mitigationMessage = ` (Losses reduced by Warehouses)`;
            }
            return { resourceDelta: { food: -foodLoss}, additionalMessage: `Pests destroyed ${foodLoss} food!${mitigationMessage}`};
        }
        return { additionalMessage: "Pests were found, but thankfully food stores were low and losses minimal."};
    }
  },
  {
    message: "A skilled builder offers their services for a small fee, speeding up resource gathering this turn.",
    icon: ConstructionIcon,
    effect: () => {
        const woodBonus = Math.floor(Math.random() * 8) + 3;
        const stoneBonus = Math.floor(Math.random() * 8) + 3;
        const goldCost = 5;
        return { resourceDelta: { wood: woodBonus, stone: stoneBonus, gold: -goldCost}, additionalMessage: `Paid ${goldCost} gold for expert help, gaining ${woodBonus} wood and ${stoneBonus} stone.`};
    }
  },
  {
    message: "Bandits are spotted near your borders! They demand tribute.",
    icon: ShieldAlert,
    effect: (currentState) => {
      const numBarracks = currentState.structures.filter(s => s.typeId === 'barracks').length;
      let goldLoss = Math.max(5, Math.floor(currentState.resources.gold * 0.15));
      let foodLoss = Math.max(3, Math.floor(currentState.resources.food * 0.1));
      let additionalMessage = "";

      if (numBarracks > 0) {
        goldLoss = Math.max(1, Math.floor(goldLoss * (1 - (numBarracks * 0.4)) )); 
        foodLoss = Math.max(0, Math.floor(foodLoss * (1 - (numBarracks * 0.4)) ));
        additionalMessage = ` Your barracks successfully defended against the bandits, significantly reducing losses! Lost ${goldLoss} gold and ${foodLoss} food.`;
      } else {
        additionalMessage = ` Bandits raided your unprotected realm! Lost ${goldLoss} gold and ${foodLoss} food.`;
      }
      goldLoss = Math.min(goldLoss, currentState.resources.gold); 
      foodLoss = Math.min(foodLoss, currentState.resources.food); 


      return { resourceDelta: { gold: -goldLoss, food: -foodLoss }, additionalMessage };
    }
  },
  {
    message: "A pack of hungry wolves is menacing nearby farms!",
    icon: Skull, // Represents danger
    effect: (currentState) => {
      const numBarracks = currentState.structures.filter(s => s.typeId === 'barracks').length;
      let foodLoss = Math.max(2, Math.floor(currentState.resources.food * 0.05) + Math.floor(Math.random() * 5));
      let populationLoss = 0;
      let additionalMessage = "";

      if (numBarracks > 0) {
        foodLoss = Math.max(0, Math.floor(foodLoss * (1 - (numBarracks * 0.5)) )); 
        additionalMessage = ` Your soldiers from the barracks drove off the wolves! Food loss minimized to ${foodLoss}.`;
      } else {
        if (currentState.resources.population > 3 && Math.random() < 0.2) { 
          populationLoss = 1;
        }
        additionalMessage = ` Wolves attacked! Lost ${foodLoss} food. ${populationLoss > 0 ? `${populationLoss} citizen(s) were injured and perished.` : ''}`;
      }
      foodLoss = Math.min(foodLoss, currentState.resources.food);
      populationLoss = Math.min(populationLoss, currentState.resources.population);


      return { resourceDelta: { food: -foodLoss, population: -populationLoss }, additionalMessage };
    }
  },
  {
    message: "Unusually favorable conditions have led to a sudden growth spurt in the nearby forests!",
    icon: Trees,
    effect: () => ({
      resourceDelta: { wood: Math.floor(Math.random() * 15) + 10 },
      additionalMessage: "The forests have yielded an unexpected bounty of wood."
    })
  },
  {
    message: "Miners have struck a surprisingly rich vein of gold ore!",
    icon: Gem,
    effect: () => ({
      resourceDelta: { gold: Math.floor(Math.random() * 10) + 5 },
      additionalMessage: "A fortunate discovery enriches your realm's coffers."
    })
  },
  {
    message: "A prolonged dry spell is affecting the lands, crop yields are lower.",
    icon: SunIcon,
    effect: (currentState) => {
      const numWarehouses = currentState.structures.filter(s => s.typeId === 'warehouse').length;
      let foodLoss = Math.max(3, Math.floor(currentState.resources.food * 0.08));
      const mitigationPerWarehouse = 2;
      const actualMitigation = numWarehouses * mitigationPerWarehouse;
      foodLoss = Math.max(0, foodLoss - actualMitigation);
      let mitigationMessage = "";
      if (numWarehouses > 0 && actualMitigation > 0 && foodLoss < Math.max(3, Math.floor(currentState.resources.food * 0.08))) {
          mitigationMessage = ` (Warehouses helped preserve some supplies)`;
      }
      return { 
        resourceDelta: { food: -foodLoss }, 
        additionalMessage: `The drought has reduced food supplies by ${foodLoss}.${mitigationMessage}` 
      };
    }
  },
  {
    message: "A fierce storm swept through the realm, damaging some structures and supplies.",
    icon: WindIcon,
    effect: (currentState) => {
      const numWarehouses = currentState.structures.filter(s => s.typeId === 'warehouse').length;
      const numBarracks = currentState.structures.filter(s => s.typeId === 'barracks').length; // Barracks might offer minor protection

      let woodLoss = Math.floor(Math.random() * 10) + 5;
      let stoneLoss = Math.floor(Math.random() * 8) + 3;
      
      const warehouseMitigation = numWarehouses * 2; // Each warehouse reduces each loss by 2
      woodLoss = Math.max(0, woodLoss - warehouseMitigation);
      stoneLoss = Math.max(0, stoneLoss - warehouseMitigation);

      const barracksMitigation = numBarracks * 1; // Each barrack reduces each loss by 1
      woodLoss = Math.max(0, woodLoss - barracksMitigation);
      stoneLoss = Math.max(0, stoneLoss - barracksMitigation);
      
      let mitigationMessage = "";
      if ((numWarehouses > 0 || numBarracks > 0) && (woodLoss < (Math.floor(Math.random() * 10) + 5) || stoneLoss < (Math.floor(Math.random() * 8) + 3))) {
          mitigationMessage = " (Well-maintained structures and stores minimized damage)";
      }

      return { 
        resourceDelta: { wood: -woodLoss, stone: -stoneLoss }, 
        additionalMessage: `The storm caused ${woodLoss} wood and ${stoneLoss} stone in damages.${mitigationMessage}` 
      };
    }
  },
  {
    message: "A wave of inspiration has struck your realm's artisans! They work with renewed vigor.",
    icon: ConstructionIcon, // Using brain for inspiration/knowledge
    effect: (currentState) => {
      const numLibraries = currentState.structures.filter(s => s.typeId === 'library').length;
      let woodBonus = Math.floor(Math.random() * 5) + 2;
      let stoneBonus = Math.floor(Math.random() * 5) + 2;
      let additionalMessage = "";

      if (numLibraries > 0) {
        woodBonus += numLibraries; // Each library adds +1 to bonus
        stoneBonus += numLibraries;
        additionalMessage = " (Knowledge from your libraries fueled their creativity!)";
      }
      return { 
        resourceDelta: { wood: woodBonus, stone: stoneBonus }, 
        additionalMessage: `Inspired artisans produced an extra ${woodBonus} wood and ${stoneBonus} stone.${additionalMessage}`
      };
    }
  },
  {
    message: "Citizens are unhappy due to dwindling food supplies. Some are threatening to leave.",
    icon: AngryIcon,
    effect: (currentState) => {
      if (currentState.resources.food < currentState.resources.population * 0.3 && currentState.resources.population > 5) { // If food is less than 30% of pop needs
        const popLoss = Math.max(1, Math.floor(currentState.resources.population * 0.1));
        return {
          resourceDelta: { population: -popLoss },
          additionalMessage: `${popLoss} citizen(s) have left the realm due to severe food shortages!`
        };
      }
      return { additionalMessage: "Grumbling about food is heard, but for now, people remain loyal." };
    }
  },
  {
    message: "A neighboring settlement, impressed by your realm's surplus, offers a very favorable trade!",
    icon: Banknote,
    effect: (currentState) => {
      const goldGain = Math.floor(Math.random() * 20) + 15;
      const resourceCost = Math.floor(Math.random() * 15) + 5;
      const tradeResource = Math.random() < 0.5 ? 'wood' : 'food';

      if (currentState.resources[tradeResource] > resourceCost + 10) {
        return {
          resourceDelta: { gold: goldGain, [tradeResource]: -resourceCost },
          additionalMessage: `Successfully traded ${resourceCost} ${tradeResource} for ${goldGain} gold!`
        };
      }
      return { additionalMessage: "A lucrative trade offer came, but you lacked the surplus goods." };
    }
  },
  {
    message: "Explorers have unearthed an ancient artifact!",
    icon: BookOpenIcon,
    effect: (currentState) => {
      const numLibraries = currentState.structures.filter(s => s.typeId === 'library').length;
      let goldBonus = Math.floor(Math.random() * 10) + 5;
      let resourceBonus = 0;
      const bonusResourceType = ['wood', 'stone'][Math.floor(Math.random() * 2)] as 'wood' | 'stone';
      let additionalMessage = `The artifact was sold for ${goldBonus} gold.`;

      if (numLibraries > 0) {
        resourceBonus = Math.floor(Math.random() * 5) + (numLibraries * 2); // Libraries increase this bonus
        additionalMessage += ` Ancient knowledge from the artifact also yielded ${resourceBonus} ${bonusResourceType}!`
      }
      return { 
        resourceDelta: { gold: goldBonus, [bonusResourceType]: (currentState.resources[bonusResourceType] || 0) + resourceBonus }, 
        additionalMessage 
      };
    }
  },
  {
    message: "A renowned scholar is visiting, offering to share their knowledge for a small donation to your library.",
    icon: Brain,
    effect: (currentState) => {
      const numLibraries = currentState.structures.filter(s => s.typeId === 'library').length;
      if (numLibraries === 0 || currentState.resources.gold < 20) {
        return { additionalMessage: "A renowned scholar visited, but without a library or sufficient funds, their knowledge remained unshared." };
      }
      const foodBonus = Math.floor(Math.random() * 10) + 5;
      const woodBonus = Math.floor(Math.random() * 10) + 5;
      return {
        resourceDelta: { gold: -20, food: foodBonus, wood: woodBonus },
        additionalMessage: `Paid 20 gold. The scholar's insights led to +${foodBonus} food and +${woodBonus} wood this turn!`
      };
    }
  },
  {
    message: "Your realm's sturdy defenses (Barracks) have deterred a potential bandit raid before it even began!",
    icon: ShieldCheck,
    effect: (currentState) => {
      if (currentState.structures.some(s => s.typeId === 'barracks')) {
        return { additionalMessage: "Scouts report that bandits noted your defenses and decided to look for easier targets." };
      }
      // If no barracks, this event shouldn't trigger or should be a different "bandits sighted" event.
      // For simplicity, let's assume this event only happens if barracks exist.
      return { additionalMessage: "Rumors of bandits were unfounded this time." }; 
    }
  }
];


export const QUEST_DEFINITIONS: Record<string, QuestDefinition> = {
  // --- Early Game Quests ---
  firstShelter: {
    id: 'firstShelter',
    title: 'First Shelter',
    description: 'Provide basic housing for your people by building a Hut.',
    icon: Home,
    criteria: [
      { type: 'build', buildingId: 'hut', targetCount: 1, description: "Construct 1 Hut." }
    ],
    reward: { resources: { wood: 20, stone: 10 }, message: "Your first citizens have a place to call home!" },
  },
  growingPopulation: {
    id: 'growingPopulation',
    title: 'Growing Populace',
    description: 'Reach a population of 10.',
    icon: Users,
    criteria: [
      { type: 'population_reach', targetAmount: 10, description: "Have 10 citizens." }
    ],
    reward: { resources: { food: 20 }, message: "Your realm is attracting more people!" },
  },
   firstWood: {
    id: 'firstWood',
    title: 'Gather Wood',
    description: 'Establish a Logging Camp to start your wood supply.',
    icon: Axe,
    criteria: [
      { type: 'build', buildingId: 'loggingCamp', targetCount: 1, description: "Construct 1 Logging Camp." }
    ],
    reward: { resources: { wood: 30 }, message: "The forests begin to yield their bounty." },
  },
  firstStone: {
    id: 'firstStone',
    title: 'Gather Stone',
    description: 'Build a Stone Quarry to gather essential building materials.',
    icon: Mountain,
    criteria: [
      { type: 'build', buildingId: 'stoneQuarry', targetCount: 1, description: "Construct 1 Stone Quarry." }
    ],
    reward: { resources: { stone: 30 }, message: "Stone is now being extracted." },
  },
  farmInitiative: {
    id: 'farmInitiative',
    title: 'Farming Initiative',
    description: 'Secure a steady food supply by building a farm.',
    icon: Carrot,
    criteria: [
      { type: 'build', buildingId: 'farm', targetCount: 1, description: "Construct 1 Farm." }
    ],
    reward: { resources: { food: 15 }, message: "The fields will soon feed your people." },
  },
  prospectForGold: {
    id: 'prospectForGold',
    title: 'Prospect for Gold',
    description: 'Build a Gold Mine to start enriching your realm.',
    icon: Pickaxe,
    criteria: [
      { type: 'build', buildingId: 'goldMine', targetCount: 1, description: "Construct 1 Gold Mine." }
    ],
    reward: { resources: { gold: 10, stone: 10 }, message: "The glint of gold promises prosperity!" },
  },

  // --- Mid Game Quests & Achievements ---
  sustainableFood: {
    id: 'sustainableFood',
    title: 'Sustainable Food Source',
    description: 'Ensure your realm has a steady food income by building two farms.',
    icon: Sprout,
    criteria: [
      { type: 'build', buildingId: 'farm', targetCount: 2, description: "Construct 2 Farms." }
    ],
    reward: { resources: { food: 30, gold: 10 }, message: "Your people will not go hungry!" },
  },
  woodSurplus: {
    id: 'woodSurplus',
    title: 'Wood Surplus',
    description: 'Upgrade your wood production with a Lumber Mill.',
    icon: Factory,
    criteria: [
      { type: 'build', buildingId: 'lumberMill', targetCount: 1, description: "Construct 1 Lumber Mill." }
    ],
    reward: { resources: { wood: 50 }, message: "Efficient wood processing has begun!" },
  },
  marketEconomy: {
    id: 'marketEconomy',
    title: 'Market Economy',
    description: 'Build a Market to boost your gold income.',
    icon: CandlestickChart,
    criteria: [
      { type: 'build', buildingId: 'market', targetCount: 1, description: "Construct 1 Market." }
    ],
    reward: { resources: { gold: 30 }, message: "Commerce flourishes in your realm!" },
  },
  resourceAbundance: {
    id: 'resourceAbundance',
    title: 'Resource Abundance',
    description: 'Achieve a comfortable level of all basic resources.',
    icon: PackageIcon,
    isAchievement: true,
    criteria: [
      { type: 'resource_reach', resourceType: 'wood', targetAmount: 200, description: "Have 200 Wood." },
      { type: 'resource_reach', resourceType: 'stone', targetAmount: 200, description: "Have 200 Stone." },
      { type: 'resource_reach', resourceType: 'food', targetAmount: 100, description: "Have 100 Food." },
    ],
    reward: { resources: { gold: 25 }, message: "Your realm is prospering with abundant resources!" },
  },
  bustlingTown: {
    id: 'bustlingTown',
    title: 'Bustling Town',
    description: 'Grow your population to 25 hardworking citizens.',
    icon: Building2, 
    isAchievement: true,
    criteria: [
      { type: 'population_reach', targetAmount: 25, description: "Reach a population of 25." }
    ],
    reward: { resources: { gold: 50, food: 20 }, message: "Your realm is becoming a lively settlement!" },
  },
  decadeOfRule: {
    id: 'decadeOfRule',
    title: 'Decade of Rule',
    description: 'Successfully manage your realm for 10 turns.',
    icon: Clock,
    isAchievement: true,
    criteria: [
      { type: 'turn_reach', targetTurn: 10, description: "Reach Turn 10." }
    ],
    reward: { resources: { gold: 20 }, message: "A seasoned ruler, guiding your realm through its first decade!" },
  },
  treasuryGrowth: {
    id: 'treasuryGrowth',
    title: 'Treasury Growth',
    description: 'Amass a treasure of 100 gold.',
    icon: Gem,
    isAchievement: true,
    criteria: [
      { type: 'resource_reach', resourceType: 'gold', targetAmount: 100, description: "Accumulate 100 Gold." }
    ],
    reward: { message: "Your coffers are overflowing!" },
  },
  knowledgeSeeker: {
    id: 'knowledgeSeeker',
    title: 'Knowledge Seeker',
    description: 'Construct a Library to foster learning and innovation.',
    icon: Library,
    criteria: [
      { type: 'build', buildingId: 'library', targetCount: 1, description: "Build 1 Library." }
    ],
    reward: { resources: { gold: 40 }, message: "The pursuit of knowledge elevates your realm." },
  },
  preparedForTrouble: {
    id: 'preparedForTrouble',
    title: 'Prepared for Trouble',
    description: 'Build a Warehouse to safeguard your resources.',
    icon: Warehouse,
    criteria: [
      { type: 'build', buildingId: 'warehouse', targetCount: 1, description: "Construct 1 Warehouse."}
    ],
    reward: { resources: { wood: 20, stone: 20}, message: "Your resources are now better protected against misfortune."}
  },
  guardianOfTheRealm: {
    id: 'guardianOfTheRealm',
    title: 'Guardian of the Realm',
    description: 'Establish Barracks to train defenders for your realm.',
    icon: ShieldAlert, 
    isAchievement: true, // This feels more like an achievement than a simple quest
    criteria: [
      { type: 'build', buildingId: 'barracks', targetCount: 1, description: "Build 1 Barracks." }
    ],
    reward: { message: "Your realm's defenses are strengthened!" },
  },
  
  // --- Late Game / Advanced Achievements ---
  industrialPowerhouse: {
    id: 'industrialPowerhouse',
    title: 'Industrial Powerhouse',
    description: 'Have at least two of each primary production building (Farm, Logging Camp, Stone Quarry, Gold Mine).',
    icon: Zap, 
    isAchievement: true,
    criteria: [
      { type: 'build', buildingId: 'farm', targetCount: 2, description: "Build 2 Farms." },
      { type: 'build', buildingId: 'loggingCamp', targetCount: 2, description: "Build 2 Logging Camps." },
      { type: 'build', buildingId: 'stoneQuarry', targetCount: 2, description: "Build 2 Stone Quarries." },
      { type: 'build', buildingId: 'goldMine', targetCount: 2, description: "Build 2 Gold Mines." },
    ],
    reward: { resources: { gold: 100 }, message: "Your realm's production capacity is unmatched!" },
  },
  metropolisBuilder: {
    id: 'metropolisBuilder',
    title: 'Metropolis Builder',
    description: 'Reach a population of 50 citizens, forming a true metropolis.',
    icon: Building2, 
    isAchievement: true,
    criteria: [
      { type: 'population_reach', targetAmount: 50, description: "Reach 50 citizens." }
    ],
    reward: { resources: { food: 50, gold: 50 }, message: "A true metropolis under your rule!" },
  },
   masterArchitect: {
    id: 'masterArchitect',
    title: 'Master Architect',
    description: 'Construct a total of 10 buildings of any type, shaping the landscape.',
    icon: Award,
    isAchievement: true,
    criteria: [
      { type: 'structure_count_reach', targetAmount: 10, description: "Construct 10 total buildings."}
    ],
    reward: { message: "Your architectural vision shapes the land!" },
  },
  economicStability: {
    id: 'economicStability',
    title: 'Economic Stability',
    description: 'Maintain a positive gold balance for 5 consecutive turns while population is at least 15.',
    icon: ShieldCheck, 
    isAchievement: true, 
    criteria: [
        { type: 'resource_reach', resourceType: 'gold', targetAmount: 150, description: "Have 150 Gold." }, 
        { type: 'population_reach', targetAmount: 15, description: "Have at least 15 Population." },
        { type: 'turn_reach', targetTurn: 15, description: "Reach Turn 15 while meeting other conditions." } 
    ],
    reward: { resources: { gold: 75 }, message: "Your realm enjoys prolonged economic stability!" }
  },
  selfSufficientRealm: {
    id: 'selfSufficientRealm',
    title: 'Self-Sufficient Realm',
    description: 'Produce more food, wood, and stone than your realm consumes in upkeep for 3 turns.',
    icon: Briefcase, 
    isAchievement: true,
    criteria: [ 
        { type: 'build', buildingId: 'farm', targetCount: 3, description: "Build 3 Farms." },
        { type: 'build', buildingId: 'lumberMill', targetCount: 2, description: "Build 2 Lumber Mills (or 4 Logging Camps)." },
        { type: 'build', buildingId: 'stoneQuarry', targetCount: 2, description: "Build 2 Stone Quarries." },
        { type: 'turn_reach', targetTurn: 20, description: "Reach turn 20 with high production." }
    ],
    reward: { message: "Your realm is a model of self-sufficiency!" }
  },
  masterTrader: {
    id: 'masterTrader',
    title: 'Master Trader',
    description: 'Build 2 Markets and accumulate 200 Gold.',
    icon: Banknote,
    isAchievement: true,
    criteria: [
      { type: 'build', buildingId: 'market', targetCount: 2, description: "Construct 2 Markets." },
      { type: 'resource_reach', resourceType: 'gold', targetAmount: 200, description: "Accumulate 200 Gold." }
    ],
    reward: { resources: { wood: 50, stone: 50 }, message: "Your trade network is legendary!" }
  },
  longLiveTheRealm: {
    id: 'longLiveTheRealm',
    title: 'Long Live the Realm!',
    description: 'Successfully guide your realm for 25 turns.',
    icon: Hourglass,
    isAchievement: true,
    criteria: [
      { type: 'turn_reach', targetTurn: 25, description: "Reach Turn 25." }
    ],
    reward: { resources: { gold: 100 }, message: "Your reign has stood the test of time!" }
  },
  resourceHoarder: {
    id: 'resourceHoarder',
    title: 'Resource Hoarder',
    description: 'Accumulate 500 of Wood, Stone, and Food.',
    icon: Warehouse, 
    isAchievement: true,
    criteria: [
      { type: 'resource_reach', resourceType: 'wood', targetAmount: 500, description: "Accumulate 500 Wood." },
      { type: 'resource_reach', resourceType: 'stone', targetAmount: 500, description: "Accumulate 500 Stone." },
      { type: 'resource_reach', resourceType: 'food', targetAmount: 500, description: "Accumulate 500 Food." },
    ],
    reward: { message: "Your storehouses are overflowing beyond measure!"}
  },
  twoLibraries: {
    id: 'twoLibraries',
    title: 'Center of Learning',
    description: 'Construct two Libraries to become a beacon of knowledge.',
    icon: Library,
    isAchievement: true,
    criteria: [
      { type: 'build', buildingId: 'library', targetCount: 2, description: "Build 2 Libraries."}
    ],
    reward: { resources: { gold: 75 }, message: "Your realm is renowned for its pursuit of knowledge!"}
  },
  wellDefended: {
    id: 'wellDefended',
    title: 'Well Defended',
    description: 'Construct two Barracks, ensuring your realm is secure.',
    icon: ShieldCheck,
    isAchievement: true,
    criteria: [
      { type: 'build', buildingId: 'barracks', targetCount: 2, description: "Build 2 Barracks."}
    ],
    reward: { resources: { gold: 50, stone: 50 }, message: "Your realm stands well-guarded against any threat!"}
  },
  logisticsMaster: {
    id: 'logisticsMaster',
    title: 'Logistics Master',
    description: 'Build two Warehouses, optimizing your resource management.',
    icon: Warehouse,
    isAchievement: true,
    criteria: [
      { type: 'build', buildingId: 'warehouse', targetCount: 2, description: "Build 2 Warehouses."}
    ],
    reward: { resources: { wood: 50, food: 50 }, message: "Your realm's logistics are second to none!"}
  }
};


    
