'use server';

import type { GameState, PlayerQuest, QuestCriterion, ResourceSet } from '@/types/game';
import { QUEST_DEFINITIONS } from '@/config/game-config';
import { isCriterionMet } from '@/lib/quest-utils'; // Import the helper

export interface CompletedQuestInfo {
  title: string;
  message?: string;
  isAchievement?: boolean;
}

export async function checkAndCompleteQuests(
  gameState: GameState
): Promise<{ updatedGameState: GameState; completedQuestsInfo: CompletedQuestInfo[] }> {
  let newGameState = { ...gameState };
  const completedQuestsInfo: CompletedQuestInfo[] = [];

  let questsCompletedInThisIteration: boolean;
  do {
    questsCompletedInThisIteration = false;
    newGameState.playerQuests = newGameState.playerQuests.map(playerQuest => {
      if (playerQuest.status === 'completed') {
        return playerQuest;
      }

      const questDef = QUEST_DEFINITIONS[playerQuest.questId];
      if (!questDef) {
        console.warn(`Quest definition not found for ID: ${playerQuest.questId}`);
        return playerQuest;
      }

      let allCriteriaMet = true;
      for (const criterion of questDef.criteria) {
        if (!isCriterionMet(criterion, newGameState)) {
          allCriteriaMet = false;
          break;
        }
      }

      if (allCriteriaMet) {
        questsCompletedInThisIteration = true;
        // Apply reward
        const updatedResourcesAfterReward = { ...newGameState.resources };
        if (questDef.reward.resources) {
          for (const [resource, amount] of Object.entries(questDef.reward.resources)) {
            updatedResourcesAfterReward[resource as keyof ResourceSet] = 
              (updatedResourcesAfterReward[resource as keyof ResourceSet] || 0) + amount;
          }
        }
        newGameState.resources = updatedResourcesAfterReward;

        completedQuestsInfo.push({
          title: `${questDef.isAchievement ? 'Achievement Unlocked' : 'Quest Completed'}: ${questDef.title}`,
          message: questDef.reward.message || (questDef.isAchievement ? 'A milestone reached!' : 'You earned a reward!'),
          isAchievement: questDef.isAchievement,
        });
        
        return { ...playerQuest, status: 'completed' };
      }

      return playerQuest;
    });
  } while (questsCompletedInThisIteration); // Re-check if a quest completion could trigger another

  return { updatedGameState: newGameState, completedQuestsInfo };
}
