
"use client";

import type { ResourceSet } from '@/types/game';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RESOURCE_DETAILS, ACTION_ICONS } from '@/config/game-config';
import { cn } from '@/lib/utils';

interface ResourceDisplayProps {
  resources: ResourceSet;
}

export function ResourceDisplay({ resources }: ResourceDisplayProps) {
  return (
    <Card className="shadow-md mb-4">
      <CardHeader>
        <CardTitle className="flex items-center text-lg gap-2">
          <ACTION_ICONS.Resources className="h-5 w-5 text-accent" />
          Realm Resources
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-sm">
          {Object.entries(resources).map(([key, value]) => {
            const details = RESOURCE_DETAILS[key as keyof ResourceSet];
            if (!details) return null;
            const Icon = details.icon;
            return (
              <div key={key} className="flex items-center space-x-2 p-2 bg-muted/50 rounded-md shadow">
                <Icon className={cn("h-6 w-6", details.color)} />
                <div>
                  <span className="font-semibold">{details.name}: </span>
                  <span>{value}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

```