
'use server';

import type { GameState, PlayerQuest, QuestCriterion, ResourceSet } from '@/types/game';
import { QUEST_DEFINITIONS } from '@/config/game-config';
import { isCriterionMet } from '@/lib/quest-utils'; 

export interface CompletedQuestInfo {
  title: string;
  message?: string;
  isAchievement?: boolean;
}

export async function checkAndCompleteQuests(
  gameState: GameState
): Promise<{ updatedGameState: GameState; completedQuestsInfo: CompletedQuestInfo[] }> {
  let newGameState = JSON.parse(JSON.stringify(gameState)); // Deep copy
  const completedQuestsInfo: CompletedQuestInfo[] = [];

  // Prevent running if game is over
  if (newGameState.isGameOver) {
    return { updatedGameState: newGameState, completedQuestsInfo };
  }

  let questsCompletedInThisIteration: boolean;
  do {
    questsCompletedInThisIteration = false;
    const currentlyActiveQuests = newGameState.playerQuests.filter(pq => pq.status === 'active');
    
    for (const playerQuest of currentlyActiveQuests) {
      const questDef = QUEST_DEFINITIONS[playerQuest.questId];
      if (!questDef) {
        console.warn(`Quest definition not found for ID: ${playerQuest.questId}`);
        continue;
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
        
        // Find the quest in the main newGameState.playerQuests array to update its status
        const questToUpdate = newGameState.playerQuests.find(pq => pq.questId === playerQuest.questId);
        if (questToUpdate) {
          questToUpdate.status = 'completed';
        }

        // Apply reward
        const updatedResourcesAfterReward = { ...newGameState.resources };
        if (questDef.reward.resources) {
          for (const [resource, amount] of Object.entries(questDef.reward.resources)) {
            // Ensure we are not trying to add 'population' directly via quest rewards this way
            if (resource !== 'population') {
                 updatedResourcesAfterReward[resource as keyof Omit<ResourceSet, 'population'>] = 
                (updatedResourcesAfterReward[resource as keyof Omit<ResourceSet, 'population'>] || 0) + amount;
            }
          }
        }
        newGameState.resources = updatedResourcesAfterReward;

        completedQuestsInfo.push({
          title: `${questDef.isAchievement ? 'Achievement Unlocked' : 'Quest Completed'}: ${questDef.title}`,
          message: questDef.reward.message || (questDef.isAchievement ? 'A milestone reached!' : 'You earned a reward!'),
          isAchievement: questDef.isAchievement,
        });
      }
    }
  } while (questsCompletedInThisIteration); 

  return { updatedGameState: newGameState, completedQuestsInfo };
}
