import type { LucideIcon } from 'lucide-react';

export interface ResourceSet {
  wood: number;
  stone: number;
  food: number;
  gold: number;
  population: number;
}

export interface BuildingType {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
  cost: Partial<Omit<ResourceSet, 'population'>>; // Cost should not include population
  upkeep: Partial<Omit<ResourceSet, 'population'>>;
  production: Partial<Omit<ResourceSet, 'population'>>; // What it produces per turn
  providesPopulation?: number; // How much population this building adds/supports
}

export interface PlacedStructure {
  id: string; // Unique ID for the placed structure
  typeId: string; // Key from BUILDING_TYPES
  // Position could be added later, e.g., position: { x: number; y: number };
}

// --- Quest System Types ---
export interface QuestReward {
  resources?: Partial<Omit<ResourceSet, 'population'>>;
  message?: string; // For toast notification
}

export type QuestCriteriaType = 'build' | 'resource_reach' | 'turn_reach' | 'population_reach' | 'structure_count_reach';

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
  resourceType: keyof Omit<ResourceSet, 'population'>; // Population handled by PopulationReachQuestCriterion
  targetAmount: number;
}

export interface PopulationReachQuestCriterion extends BaseQuestCriterion {
  type: 'population_reach';
  targetAmount: number;
}

export interface TurnReachQuestCriterion extends BaseQuestCriterion {
  type: 'turn_reach';
  targetTurn: number;
}

export interface StructureCountReachQuestCriterion extends BaseQuestCriterion {
  type: 'structure_count_reach';
  targetAmount: number;
}

export type QuestCriterion = 
  | BuildQuestCriterion 
  | ResourceReachQuestCriterion 
  | TurnReachQuestCriterion 
  | PopulationReachQuestCriterion
  | StructureCountReachQuestCriterion;

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
  resources: ResourceSet;
  structures: PlacedStructure[];
  currentTurn: number;
  currentEvent: string | null; // Can be a single string, or join multiple event messages
  selectedBuildingForConstruction: string | null; // typeId of building
  playerQuests: PlayerQuest[];
  isGameOver: boolean;
  // population is now part of resources: resources.population
}

