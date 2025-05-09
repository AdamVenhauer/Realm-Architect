import type { BuildingType } from '@/types/game';
import { Home, Carrot, Pickaxe, Trees, Mountain, Coins, Apple, PackageIcon, Sparkles, Hammer, Play, Globe } from 'lucide-react';

export const APP_TITLE = "Realm Architect";
export const APP_ICON = Globe;

export const BUILDING_TYPES: Record<string, BuildingType> = {
  hut: {
    id: 'hut',
    name: 'Hut',
    icon: Home,
    description: 'Basic housing. Consumes food.',
    cost: { wood: 50, stone: 20 },
    upkeep: { food: 1 },
    production: {},
  },
  farm: {
    id: 'farm',
    name: 'Farm',
    icon: Carrot, // Using Carrot as Wheat is not available
    description: 'Produces food for your realm.',
    cost: { wood: 30, stone: 10 },
    upkeep: {},
    production: { food: 5 },
  },
  mine: {
    id: 'mine',
    name: 'Mine',
    icon: Pickaxe,
    description: 'Extracts stone and gold.',
    cost: { wood: 20, stone: 50 },
    upkeep: {},
    production: { gold: 2, stone: 3 },
  },
};

export const RESOURCE_DETAILS = {
  wood: { name: 'Wood', icon: Trees, color: 'text-green-600 dark:text-green-400' },
  stone: { name: 'Stone', icon: Mountain, color: 'text-gray-500 dark:text-gray-400' },
  food: { name: 'Food', icon: Apple, color: 'text-red-500 dark:text-red-400' },
  gold: { name: 'Gold', icon: Coins, color: 'text-yellow-500 dark:text-yellow-400' },
};

export const ACTION_ICONS = {
  GenerateWorld: Sparkles,
  Build: Hammer,
  NextTurn: Play,
  Resources: PackageIcon,
};
