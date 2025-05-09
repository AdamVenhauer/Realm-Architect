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

export const INITIAL_RESOURCES: ResourceSet = {
  wood: 100,
  stone: 100,
  food: 50,
  gold: 20,
};

export const TURN_EVENTS = [
  "A gentle breeze rustles the leaves, a peaceful day.",
  "Traders report a new route opening nearby, promising future opportunities.",
  "A meteor shower was spotted last night! Some say it's a good omen.",
  "Old ruins were discovered by scouts, hinting at ancient secrets.",
  "Bountiful harvest! Food production is up this season.",
  "A rare mineral vein was found, increasing stone and gold prospects.",
];
