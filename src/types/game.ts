import type { LucideIcon } from 'lucide-react';

export interface ResourceSet {
  wood: number;
  stone: number;
  food: number;
  gold: number;
}

export interface BuildingType {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
  cost: Partial<ResourceSet>;
  upkeep: Partial<ResourceSet>;
  production: Partial<ResourceSet>; // What it produces per turn
}

export interface PlacedStructure {
  id: string; // Unique ID for the placed structure
  typeId: string; // Key from BUILDING_TYPES
  // Position could be added later, e.g., position: { x: number; y: number };
}

// --- Quest System Types ---
export interface QuestReward {
  resources?: Partial<ResourceSet>;
  message?: string; // For toast notification
}

export type QuestCriteriaType = 'build' | 'resource_reach' | 'turn_reach';

export interface BaseQuestCriterion {
  description: string; // e.g., "Build 2 Huts" or "Reach 100 Food"
}

export interface BuildQuestCriterion extends BaseQuestCriterion {
  type: 'build';
  buildingId: string; 
  targetCount: number;
}

export interface ResourceReachQuestCriterion extends BaseQuestCriterion {
  type: 'resource_reach';
  resourceType: keyof ResourceSet;
  targetAmount: number;
}

export interface TurnReachQuestCriterion extends BaseQuestCriterion {
  type: 'turn_reach';
  targetTurn: number;
}

export type QuestCriterion = BuildQuestCriterion | ResourceReachQuestCriterion | TurnReachQuestCriterion;

export interface QuestDefinition {
  id: string;
  title: string;
  description: string;
  criteria: QuestCriterion[]; 
  reward: QuestReward;
  isAchievement?: boolean; 
  icon?: LucideIcon; 
}

export interface PlayerQuest {
  questId: string;
  status: 'active' | 'completed';
  // Optional: criteriaProgress?: { completed: boolean }[]; // To track individual criteria
}
// --- End Quest System Types ---


export interface GameState {
  worldDescription: string;
  generatedWorldMap: string | null;
  isGenerating: boolean;
  resources: ResourceSet;
  structures: PlacedStructure[];
  currentTurn: number;
  currentEvent: string | null;
  selectedBuildingForConstruction: string | null; // typeId of building
  playerQuests: PlayerQuest[];
}

