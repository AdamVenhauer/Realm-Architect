"use client";

import type { PlayerQuest, QuestDefinition } from '@/types/game';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ACTION_ICONS } from '@/config/game-config';
import { CheckSquare, Square, Trophy, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestDisplayProps {
  playerQuests: PlayerQuest[];
  allQuestDefinitions: Record<string, QuestDefinition>;
}

export function QuestDisplay({ playerQuests, allQuestDefinitions }: QuestDisplayProps) {
  const activeQuests = playerQuests.filter(pq => pq.status === 'active' && !allQuestDefinitions[pq.questId]?.isAchievement);
  const completedQuests = playerQuests.filter(pq => pq.status === 'completed' && !allQuestDefinitions[pq.questId]?.isAchievement);
  const activeAchievements = playerQuests.filter(pq => pq.status === 'active' && allQuestDefinitions[pq.questId]?.isAchievement);
  const completedAchievements = playerQuests.filter(pq => pq.status === 'completed' && allQuestDefinitions[pq.questId]?.isAchievement);

  const renderQuestList = (quests: PlayerQuest[], title: string, IconComponent: LucideIcon, isCompletedList: boolean) => {
    if (quests.length === 0 && !isCompletedList) { // Don't show "No active..." if it's for a completed list that might be empty
        return (
            <div className="mb-4">
                <h3 className="text-md font-semibold flex items-center gap-2 mb-2">
                    <IconComponent className="h-5 w-5 text-primary" />
                    {title}
                </h3>
                <p className="text-xs text-muted-foreground">No active {title.toLowerCase()} at the moment.</p>
            </div>
        );
    }
     if (quests.length === 0 && isCompletedList) { 
        return null; // Don't render section if no completed quests/achievements
    }


    return (
      <div className="mb-4">
        <h3 className="text-md font-semibold flex items-center gap-2 mb-2">
          <IconComponent className="h-5 w-5 text-primary" />
          {title} ({quests.length})
        </h3>
        <Accordion type="multiple" className="w-full">
          {quests.map(playerQuest => {
            const questDef = allQuestDefinitions[playerQuest.questId];
            if (!questDef) return null;
            const QuestIcon = questDef.icon || (questDef.isAchievement ? Trophy : Square);
            
            return (
              <AccordionItem value={questDef.id} key={questDef.id}>
                <AccordionTrigger className="text-sm hover:no-underline">
                  <div className="flex items-center gap-2 w-full">
                    {isCompletedList ? <CheckSquare className="h-4 w-4 text-green-500" /> : <QuestIcon className="h-4 w-4 text-accent" />}
                    <span className={cn("font-medium", isCompletedList && "line-through text-muted-foreground")}>{questDef.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-xs space-y-1 pl-2">
                  <p className="text-muted-foreground">{questDef.description}</p>
                  <div>
                    <span className="font-semibold">Criteria:</span>
                    <ul className="list-disc list-inside ml-2">
                      {questDef.criteria.map((crit, idx) => (
                        <li key={idx}>{crit.description}</li>
                      ))}
                    </ul>
                  </div>
                  {!isCompletedList && questDef.reward.resources && (
                     <div>
                        <span className="font-semibold">Reward:</span> 
                        {Object.entries(questDef.reward.resources || {}).map(([res, val]) => (
                            <Badge variant="outline" key={res} className="ml-1">{val} {res.charAt(0).toUpperCase() + res.slice(1,3)}</Badge>
                        ))}
                        {questDef.reward.message && <span className="ml-1 text-muted-foreground italic">"{questDef.reward.message}"</span>}
                    </div>
                  )}
                   {isCompletedList && questDef.reward.message && (
                     <p className="italic text-green-600 dark:text-green-400">Reward: "{questDef.reward.message}"</p>
                   )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    );
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ACTION_ICONS.Quests className="h-6 w-6 text-accent" />
          Objectives
        </CardTitle>
        <CardDescription>Track your realm's progress and achievements.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-3">
          {renderQuestList(activeQuests, "Active Quests", ACTION_ICONS.Quests, false)}
          {renderQuestList(activeAchievements, "Active Achievements", Trophy, false)}
          {renderQuestList(completedQuests, "Completed Quests", CheckSquare, true)}
          {renderQuestList(completedAchievements, "Completed Achievements", Trophy, true)}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
