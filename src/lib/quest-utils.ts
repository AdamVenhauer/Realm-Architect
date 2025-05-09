// No 'use server' at the top of this file
import type { GameState, PlayerQuest, QuestCriterion, ResourceSet } from '@/types/game';
import { QUEST_DEFINITIONS } from '@/config/game-config';

export function initializePlayerQuests(): PlayerQuest[] {
  return Object.keys(QUEST_DEFINITIONS).map(questId => ({
    questId,
    status: 'active',
  }));
}

// This helper function can be used by server actions or client-side logic if needed.
// It's pure and doesn't rely on server-only features.
export function isCriterionMet(criterion: QuestCriterion, gameState: GameState): boolean {
  switch (criterion.type) {
    case 'build':
      const count = gameState.structures.filter(s => s.typeId === criterion.buildingId).length;
      return count >= criterion.targetCount;
    case 'resource_reach':
      return gameState.resources[criterion.resourceType] >= criterion.targetAmount;
    case 'turn_reach':
      return gameState.currentTurn >= criterion.targetTurn;
    default:
      // This makes sure all cases are handled, helps with type checking
      const _exhaustiveCheck: never = criterion;
      return false;
  }
}
