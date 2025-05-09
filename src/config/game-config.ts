
import type { BuildingType, QuestDefinition, ResourceSet } from '@/types/game';
import { Home, Carrot, Pickaxe, Trees, Mountain, Coins, Apple, PackageIcon, Sparkles, Hammer, Play, Globe, Axe, Trophy, ListChecks, Target, Users, ShieldAlert, Skull, Warehouse, Castle, Banknote, Zap } from 'lucide-react';

export const APP_TITLE = "Realm Architect";
export const APP_ICON = Globe;

export const INITIAL_RESOURCES: ResourceSet = {
  wood: 100,
  stone: 100,
  food: 50,
  gold: 20,
  population: 5,
};

// Moved here because GameState type is needed
import type { GameState, PlayerQuest } from '@/types/game'; 
import { initializePlayerQuests } from '@/lib/quest-utils'; // This function must exist in quest-utils


export function getInitialGameState(): Omit<GameState, 'worldDescription' | 'generatedWorldMap' | 'isGenerating' | 'playerQuests' | 'selectedBuildingForConstruction' > { 
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
    description: 'Basic housing. Increases population capacity.',
    cost: { wood: 50, stone: 20 },
    upkeep: { food: 1 }, // Food upkeep per population provided might be better, or huts have general upkeep
    production: {},
    providesPopulation: 5,
  },
  farm: {
    id: 'farm',
    name: 'Farm',
    icon: Carrot, 
    description: 'Produces food for your realm. Requires workers (population).',
    cost: { wood: 30, stone: 10 },
    upkeep: { gold: 1 }, // Farms might cost gold to maintain tools/etc
    production: { food: 5 },
  },
  mine: {
    id: 'mine',
    name: 'Mine',
    icon: Pickaxe,
    description: 'Extracts stone and gold. Requires workers.',
    cost: { wood: 20, stone: 50 },
    upkeep: { food: 1 }, // Workers need food
    production: { gold: 2, stone: 3 },
  },
  lumberMill: {
    id: 'lumberMill',
    name: 'Lumber Mill',
    icon: Axe,
    description: 'Processes timber into usable wood. Requires workers.',
    cost: { stone: 40, gold: 10 },
    upkeep: { food: 1 },
    production: { wood: 4 },
  },
  quarry: {
    id: 'quarry',
    name: 'Quarry',
    icon: Mountain, // Using Mountain as a placeholder, could be more specific
    description: 'Efficiently extracts large amounts of stone.',
    cost: { wood: 50, gold: 20 },
    upkeep: { food: 2, gold: 1 },
    production: { stone: 8 },
  },
  market: {
    id: 'market',
    name: 'Market',
    icon: Banknote, 
    description: 'Generates gold through trade and commerce.',
    cost: { wood: 70, stone: 30 },
    upkeep: { food: 1 }, // Staff need to eat
    production: { gold: 5 },
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
  GenerateWorld: Sparkles,
  Build: Hammer,
  NextTurn: Play,
  Resources: PackageIcon,
  Quests: ListChecks,
  Delete: Skull, // For deleting buildings
};

export const TURN_EVENTS = [
  "A gentle breeze rustles the leaves, a peaceful day.",
  "Traders report a new route opening nearby, promising future opportunities.",
  "A meteor shower was spotted last night! Some say it's a good omen.",
  "Old ruins were discovered by scouts, hinting at ancient secrets.",
  "Bountiful harvest! Food production is up this season.",
  "A rare mineral vein was found, increasing stone and gold prospects.",
  "Improved logging techniques have slightly boosted wood output this turn.",
  "A new family has settled in your realm, increasing the population slightly.",
  "Whispers of unrest due to low gold reserves. Workers are grumbling.",
  "Sickness has spread, a few people are unable to work or have tragically passed.",
  "Tax collectors report slightly lower than expected gold income.",
  "A wandering bard has composed a song about your growing realm!",
  "Local wildlife seems more abundant this season.",
  "A small fire broke out but was quickly extinguished. Minor wood losses.",
  "Neighboring settlements speak of your realm with cautious optimism."
];

export const QUEST_DEFINITIONS: Record<string, QuestDefinition> = {
  // --- Early Game Quests ---
  firstShelter: {
    id: 'firstShelter',
    title: 'First Shelter',
    description: 'Provide basic housing for your people.',
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
  woodStockpile: {
    id: 'woodStockpile',
    title: 'Wood Stockpiler',
    description: 'Gather a significant amount of wood for future constructions.',
    icon: Trees,
    criteria: [
      { type: 'resource_reach', resourceType: 'wood', targetAmount: 150, description: "Accumulate 150 Wood." }
    ],
    reward: { resources: { gold: 5 }, message: "Your wood reserves are growing impressively!" },
  },
  stoneFoundation: {
    id: 'stoneFoundation',
    title: 'Stone Foundation',
    description: 'Gather a good amount of stone for sturdier buildings.',
    icon: Mountain,
    criteria: [
      { type: 'resource_reach', resourceType: 'stone', targetAmount: 150, description: "Accumulate 150 Stone." }
    ],
    reward: { resources: { wood: 10 }, message: "You have a solid foundation for your realm!" },
  },
  farmInitiative: {
    id: 'farmInitiative',
    title: 'Farming Initiative',
    description: 'Secure a steady food supply by building a farm.',
    icon: Carrot,
    criteria: [
      { type: 'build', buildingId: 'farm', targetCount: 1, description: "Construct 1 Farm." }
    ],
    reward: { resources: { food: 15 }, message: "The fields will soon yield their bounty." },
  },
  miningOpener: {
    id: 'miningOpener',
    title: 'Mining Opener',
    description: 'Establish a mine to extract valuable resources.',
    icon: Pickaxe,
    criteria: [
      { type: 'build', buildingId: 'mine', targetCount: 1, description: "Construct 1 Mine." }
    ],
    reward: { resources: { stone: 20, gold: 5 }, message: "The earth yields its treasures!" },
  },
  lumberjackLeader: {
    id: 'lumberjackLeader',
    title: 'Lumberjack Leader',
    description: 'Build a Lumber Mill to improve wood production.',
    icon: Axe,
    criteria: [
      { type: 'build', buildingId: 'lumberMill', targetCount: 1, description: "Construct 1 Lumber Mill." }
    ],
    reward: { resources: { wood: 25 }, message: "Efficient wood processing begins!" },
  },

  // --- Mid Game Quests & Achievements ---
  sustainableFood: {
    id: 'sustainableFood',
    title: 'Sustainable Food Source',
    description: 'Ensure your realm has a steady food income by building two farms.',
    icon: Apple,
    criteria: [
      { type: 'build', buildingId: 'farm', targetCount: 2, description: "Construct 2 Farms." }
    ],
    reward: { resources: { food: 30, gold: 10 }, message: "Your people will not go hungry!" },
  },
  quarryMaster: {
    id: 'quarryMaster',
    title: 'Quarry Master',
    description: 'Establish a Quarry for large-scale stone extraction.',
    icon: Mountain, // Placeholder, could be more specific like a crane or minecart
    criteria: [
      { type: 'build', buildingId: 'quarry', targetCount: 1, description: "Construct 1 Quarry." }
    ],
    reward: { resources: { stone: 50 }, message: "Massive stone blocks are now available!" },
  },
  marketEconomy: {
    id: 'marketEconomy',
    title: 'Market Economy',
    description: 'Build a Market to boost your gold income.',
    icon: Banknote,
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
    icon: Users,
    isAchievement: true,
    criteria: [
      { type: 'population_reach', targetAmount: 25, description: "Reach a population of 25." }
    ],
    reward: { resources: { gold: 50 }, message: "Your realm is becoming a lively settlement!" },
  },
  fiveTurnsStrong: {
    id: 'fiveTurnsStrong',
    title: 'Five Turns Strong',
    description: 'Demonstrate your realm\'s resilience by surviving for 5 turns.',
    icon: Target,
    isAchievement: true,
    criteria: [
      { type: 'turn_reach', targetTurn: 5, description: "Reach Turn 5." }
    ],
    reward: { message: "Your leadership has guided the realm through its early days!" },
  },
  tenTurnVeteran: {
    id: 'tenTurnVeteran',
    title: 'Ten Turn Veteran',
    description: 'Survive for 10 turns, proving your strategic prowess.',
    icon: ShieldAlert, // More like a shield icon
    isAchievement: true,
    criteria: [
      { type: 'turn_reach', targetTurn: 10, description: "Reach Turn 10." }
    ],
    reward: { resources: { gold: 20 }, message: "A seasoned ruler!" },
  },
  goldenHoard: {
    id: 'goldenHoard',
    title: 'Golden Hoard',
    description: 'Amass a treasure of 100 gold.',
    icon: Coins,
    isAchievement: true,
    criteria: [
      { type: 'resource_reach', resourceType: 'gold', targetAmount: 100, description: "Accumulate 100 Gold." }
    ],
    reward: { message: "Your coffers are overflowing!" },
  },

  // --- Late Game / Advanced Achievements ---
  industrialPowerhouse: {
    id: 'industrialPowerhouse',
    title: 'Industrial Powerhouse',
    description: 'Have at least two of each production building (Farm, Mine, Lumber Mill, Quarry).',
    icon: Zap, // Represents power/industry
    isAchievement: true,
    criteria: [
      { type: 'build', buildingId: 'farm', targetCount: 2, description: "Build 2 Farms." },
      { type: 'build', buildingId: 'mine', targetCount: 2, description: "Build 2 Mines." },
      { type: 'build', buildingId: 'lumberMill', targetCount: 2, description: "Build 2 Lumber Mills." },
      { type: 'build', buildingId: 'quarry', targetCount: 2, description: "Build 2 Quarries." },
    ],
    reward: { resources: { gold: 100 }, message: "Your realm's production capacity is unmatched!" },
  },
  metropolisBuilder: {
    id: 'metropolisBuilder',
    title: 'Metropolis Builder',
    description: 'Reach a population of 50 citizens.',
    icon: Castle, 
    isAchievement: true,
    criteria: [
      { type: 'population_reach', targetAmount: 50, description: "Reach 50 citizens." }
    ],
    reward: { resources: { food: 50, gold: 50 }, message: "A true metropolis under your rule!" },
  },
   masterArchitect: {
    id: 'masterArchitect',
    title: 'Master Architect',
    description: 'Construct a total of 10 buildings of any type.',
    icon: Hammer,
    isAchievement: true,
    criteria: [
      // This requires a new criterion type or logic to count total structures.
      // For now, let's represent it with a placeholder. A custom criterion would be better.
      // Assuming we add a 'total_structures_reach' criterion type.
      // { type: 'total_structures_reach', targetCount: 10, description: "Have 10 buildings constructed."}
      // For simplicity without adding new criterion type for now:
      { type: 'build', buildingId: 'hut', targetCount: 3, description: "Build 3 Huts (part of 10 total)." }, // Example placeholder
      { type: 'build', buildingId: 'farm', targetCount: 3, description: "Build 3 Farms (part of 10 total)." }, // Example placeholder
      { type: 'build', buildingId: 'mine', targetCount: 2, description: "Build 2 Mines (part of 10 total)." }, // Example placeholder
      { type: 'build', buildingId: 'lumberMill', targetCount: 2, description: "Build 2 Lumber Mills (part of 10 total)." }, // Example placeholder
    ],
    reward: { message: "Your architectural vision shapes the land!" },
  },
};
