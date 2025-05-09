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

export interface GameState {
  worldDescription: string;
  generatedWorldMap: string | null;
  isGenerating: boolean;
  resources: ResourceSet;
  structures: PlacedStructure[];
  currentTurn: number;
  currentEvent: string | null;
  selectedBuildingForConstruction: string | null; // typeId of building
}
