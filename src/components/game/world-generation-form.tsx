"use client";

import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { generateWorld } from '@/ai/flows/generate-world';
import type { GameState } from '@/types/game';
import { ACTION_ICONS } from '@/config/game-config';

const FormSchema = z.object({
  worldDescription: z.string().min(10, "Description must be at least 10 characters."),
});

interface WorldGenerationFormProps {
  setGameState: Dispatch<SetStateAction<GameState>>;
  isGenerating: boolean;
}

export function WorldGenerationForm({ setGameState, isGenerating }: WorldGenerationFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      worldDescription: "A vast continent with towering mountains in the north, a sprawling desert to the east, lush forests in the west, and fertile plains in the south. Various kingdoms and factions vie for control over precious resources.",
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setGameState(prev => ({ ...prev, isGenerating: true, generatedWorldMap: null }));
    try {
      const result = await generateWorld({ worldDescription: data.worldDescription });
      setGameState(prev => ({ ...prev, generatedWorldMap: result.worldMap, isGenerating: false }));
      toast({
        title: "World Generated!",
        description: "Your new realm awaits.",
      });
    } catch (error) {
      console.error("Error generating world:", error);
      setGameState(prev => ({ ...prev, isGenerating: false }));
      toast({
        title: "Error Generating World",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ACTION_ICONS.GenerateWorld className="h-6 w-6 text-accent" />
          Generate World
        </CardTitle>
        <CardDescription>Describe the world you want to create.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="worldDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>World Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., A land of floating islands and crystal forests..."
                      className="resize-none min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <ACTION_ICONS.GenerateWorld className="mr-2 h-5 w-5" />
                  Create My Realm
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
