'use server';

/**
 * @fileOverview AI-powered content generation for school display announcements.
 *
 * - generateSchoolContent - A function to generate content based on a prompt.
 * - GenerateSchoolContentInput - The input type for the generateSchoolContent function.
 * - GenerateSchoolContentOutput - The return type for the generateSchoolContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSchoolContentInputSchema = z.object({
  prompt: z.string().describe('The prompt to generate content from.'),
});

export type GenerateSchoolContentInput = z.infer<typeof GenerateSchoolContentInputSchema>;

const GenerateSchoolContentOutputSchema = z.object({
  content: z.string().describe('The generated content.'),
});

export type GenerateSchoolContentOutput = z.infer<typeof GenerateSchoolContentOutputSchema>;

export async function generateSchoolContent(
  input: GenerateSchoolContentInput
): Promise<GenerateSchoolContentOutput> {
  return generateSchoolContentFlow(input);
}

const generateSchoolContentPrompt = ai.definePrompt({
  name: 'generateSchoolContentPrompt',
  input: {schema: GenerateSchoolContentInputSchema},
  output: {schema: GenerateSchoolContentOutputSchema},
  prompt: `You are a helpful assistant for generating engaging content for a school display.  Please generate content based on the following prompt: {{{prompt}}}`,
});

const generateSchoolContentFlow = ai.defineFlow(
  {
    name: 'generateSchoolContentFlow',
    inputSchema: GenerateSchoolContentInputSchema,
    outputSchema: GenerateSchoolContentOutputSchema,
  },
  async input => {
    const {output} = await generateSchoolContentPrompt(input);
    return output!;
  }
);
