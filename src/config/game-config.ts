import type { BuildingType, QuestDefinition, ResourceSet } from '@/types/game';
import { Home, Carrot, Pickaxe, Trees, Mountain, Coins, Apple, PackageIcon, Sparkles, Hammer, Play, Globe, Axe, Trophy, ListChecks, Target, Users, ShieldAlert, Skull } from 'lucide-react';

export const APP_TITLE = "Realm Architect";
export const APP_ICON = Globe;

export const INITIAL_RESOURCES: ResourceSet = {
  wood: 100,
  stone: 100,
  food: 50,
  gold: 20,
  population: 5,
};

export function getInitialGameState(): Omit<GameState, 'worldDescription' | 'generatedWorldMap' | 'isGenerating' | 'playerQuests' | 'selectedBuildingForConstruction' > & { playerQuests: PlayerQuest[] } { // A helper to reset core parts
  return {
    resources: { ...INITIAL_RESOURCES },
    structures: [],
    currentTurn: 1,
    currentEvent: null,
    playerQuests: initializePlayerQuests(), // Will be defined in quest-utils
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
];

export const QUEST_DEFINITIONS: Record<string, QuestDefinition> = {
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
  }
};

// Moved here because GameState type is needed
import type { GameState, PlayerQuest } from '@/types/game'; 
import { initializePlayerQuests } from '@/lib/quest-utils'; // This function must exist in quest-utils

```