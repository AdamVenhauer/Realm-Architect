
import type { BuildingType, QuestDefinition, ResourceSet } from '@/types/game';
import { Home, Carrot, Pickaxe, Trees, Mountain, Coins, Apple, PackageIcon, Hammer, Play, Globe, Axe, Trophy, ListChecks, Target, Users, ShieldAlert, Skull, Warehouse, Castle, Banknote, Zap, Sprout, CandlestickChart, Brain, Gem, Clock, Library, Factory, Building2, Hourglass, Award, ShieldCheck, Briefcase } from 'lucide-react';

export const APP_TITLE = "Realm Architect";
export const APP_ICON = Globe; // General icon, can remain

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
    description: 'Basic housing. Increases population capacity.',
    cost: { wood: 50, stone: 20 },
    upkeep: { food: 1 }, 
    production: {},
    providesPopulation: 5,
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
  stoneQuarry: { // Renamed from mine to be more specific for stone, or keep mine for mixed resources
    id: 'stoneQuarry',
    name: 'Stone Quarry',
    icon: Mountain, // More fitting for stone
    description: 'Extracts stone from the earth. Requires workers.',
    cost: { wood: 20, stone: 50 }, // Cost adjusted
    upkeep: { food: 1 }, // Workers need food
    production: { stone: 3 }, // Focused on stone
  },
  goldMine: { // Added a specific gold mine
    id: 'goldMine',
    name: 'Gold Mine',
    icon: Pickaxe, // Pickaxe more for mining ore
    description: 'Extracts gold ore. Requires workers.',
    cost: { wood: 40, stone: 60 },
    upkeep: { food: 2, wood:1 }, // Mines might need wood for supports
    production: { gold: 2 },
  },
  lumberMill: {
    id: 'lumberMill',
    name: 'Lumber Mill',
    icon: Factory, // Using Factory as a more generic processing icon
    description: 'Processes timber into usable wood more efficiently. Requires workers.',
    cost: { stone: 40, gold: 10 },
    upkeep: { food: 1 },
    production: { wood: 4 }, // Assuming this is in addition to logging camp or replaces its output for some wood
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
    description: 'Unlocks advanced knowledge and passive bonuses. (Future feature)',
    cost: { wood: 100, stone: 150, gold: 50 },
    upkeep: { gold: 5 },
    production: {}, // Could produce "research points" in a more complex system
  },
  barracks: {
    id: 'barracks',
    name: 'Barracks',
    icon: ShieldAlert, // Using ShieldAlert for a defensive/military connotation
    description: 'Trains soldiers to defend your realm. (Future feature)',
    cost: { wood: 80, stone: 100, gold: 30 },
    upkeep: { food: 3, gold: 3 },
    production: {}, // Could "produce" soldiers or increase defense rating
  },
  warehouse: {
    id: 'warehouse',
    name: 'Warehouse',
    icon: Warehouse,
    description: 'Increases storage capacity for all resources. (Future passive bonus)',
    cost: { wood: 120, stone: 80 },
    upkeep: { gold: 2 },
    production: {}, // Passive: increases max resource caps
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
    icon: Building2, // Changed from Buildings
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
    icon: Building2, // Changed from Buildings
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
        // Note: True "consecutive turns" logic would require more complex state tracking in game-actions.
        // This is a simplified representation.
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
        // Note: True "net positive production" logic requires more complex state tracking.
    ],
    reward: { message: "Your realm is a model of self-sufficiency!" }
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
  guardianOfTheRealm: {
    id: 'guardianOfTheRealm',
    title: 'Guardian of the Realm',
    description: 'Establish Barracks to train defenders for your realm.',
    icon: ShieldAlert, // Kept as is
    isAchievement: true,
    criteria: [
      { type: 'build', buildingId: 'barracks', targetCount: 1, description: "Build 1 Barracks." }
    ],
    reward: { message: "Your realm's defenses are strengthened!" },
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
  }
};

