
import type { GameState, PlayerQuest, QuestCriterion, ResourceSet } from '@/types/game';
import { QUEST_DEFINITIONS } from '@/config/game-config';


// This function is safe to be called from client or server as it has no side effects or server-only deps.
export function initializePlayerQuests(): PlayerQuest[] {
  return Object.keys(QUEST_DEFINITIONS).map(questId => ({
    questId,
    status: 'active',
  }));
}


export function isCriterionMet(criterion: QuestCriterion, gameState: GameState): boolean {
  switch (criterion.type) {
    case 'build':
      const count = gameState.structures.filter(s => s.typeId === criterion.buildingId).length;
      return count >= criterion.targetCount;
    case 'resource_reach':
      // Population is handled by 'population_reach'
      if (criterion.resourceType === 'population') return false; 
      return gameState.resources[criterion.resourceType as keyof Omit<ResourceSet, 'population'>] >= criterion.targetAmount;
    case 'population_reach':
      return gameState.resources.population >= criterion.targetAmount;
    case 'turn_reach':
      return gameState.currentTurn >= criterion.targetTurn;
    case 'structure_count_reach':
      return gameState.structures.length >= criterion.targetAmount;
    default:
      const _exhaustiveCheck: never = criterion; // Ensures all criterion types are handled
      console.warn("Unhandled criterion type:", _exhaustiveCheck);
      return false;
  }
}

