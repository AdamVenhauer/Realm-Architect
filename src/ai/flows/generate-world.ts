'use server';
/**
 * @fileOverview A world generation AI agent.
 *
 * - generateWorld - A function that handles the world generation process.
 * - GenerateWorldInput - The input type for the generateWorld function.
 * - GenerateWorldOutput - The return type for the generateWorld function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWorldInputSchema = z.object({
  worldDescription: z.string().describe('The description of the world to generate.'),
});
export type GenerateWorldInput = z.infer<typeof GenerateWorldInputSchema>;

const GenerateWorldOutputSchema = z.object({
  worldMap: z.string().describe('A description of the generated world map.'),
});
export type GenerateWorldOutput = z.infer<typeof GenerateWorldOutputSchema>;

export async function generateWorld(input: GenerateWorldInput): Promise<GenerateWorldOutput> {
  return generateWorldFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWorldPrompt',
  input: {schema: GenerateWorldInputSchema},
  output: {schema: GenerateWorldOutputSchema},
  prompt: `You are an expert game master specializing in world creation.

You will use the provided description to generate a world map description.

Description: {{{worldDescription}}}`,
});

const generateWorldFlow = ai.defineFlow(
  {
    name: 'generateWorldFlow',
    inputSchema: GenerateWorldInputSchema,
    outputSchema: GenerateWorldOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
