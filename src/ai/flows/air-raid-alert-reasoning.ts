// Use server directive.
'use server';

/**
 * @fileOverview Determines if an air raid alert from the alerts.in.ua API warrants displaying a warning.
 *
 * - `analyzeAirRaidAlert` - Analyzes the alert and returns a boolean indicating if the alert is relevant to Poltava.
 * - `AirRaidAlertInput` - The input type for the analyzeAirRaidAlert function.
 * - `AirRaidAlertOutput` - The return type for the analyzeAirRaidAlert function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AirRaidAlertInputSchema = z.object({
  city: z.string().describe('The city associated with the alert.'),
  alertStatus: z.boolean().describe('The current status of the air raid alert (true = active, false = inactive).'),
  alertMessage: z.string().optional().describe('The alert message from the API.'),
});
export type AirRaidAlertInput = z.infer<typeof AirRaidAlertInputSchema>;

const AirRaidAlertOutputSchema = z.object({
  shouldAlert: z.boolean().describe('Whether the alert is relevant and should be displayed.'),
  reason: z.string().describe('The reasoning behind the decision to alert or not.'),
});
export type AirRaidAlertOutput = z.infer<typeof AirRaidAlertOutputSchema>;

export async function analyzeAirRaidAlert(input: AirRaidAlertInput): Promise<AirRaidAlertOutput> {
  return airRaidAlertReasoningFlow(input);
}

const prompt = ai.definePrompt({
  name: 'airRaidAlertPrompt',
  input: {schema: AirRaidAlertInputSchema},
  output: {schema: AirRaidAlertOutputSchema},
  prompt: `You are an AI assistant that determines if an air raid alert from the alerts.in.ua API warrants displaying a warning in a school in Ukraine.

You will receive the city the alert is for, the alert status (true if active, false if inactive), and the alert message.

Your task is to determine if the alert is relevant to Poltava. Only display a warning if the alert is for Poltava.

Return a JSON object with the following format:
{
  "shouldAlert": true or false, // true if the alert is relevant to Poltava, false otherwise
  "reason": "The reason for the decision. Be concise."
}

Here is the alert information:
City: {{{city}}}
Alert Status: {{{alertStatus}}}
Alert Message: {{{alertMessage}}}

Consider the following:
- Only alerts for Poltava are relevant.
- If the alert status is false, it means the alert is over, so shouldAlert should be false.
- Ignore alerts for regions, only city-specific alerts are relevant.
`,
});

const airRaidAlertReasoningFlow = ai.defineFlow(
  {
    name: 'airRaidAlertReasoningFlow',
    inputSchema: AirRaidAlertInputSchema,
    outputSchema: AirRaidAlertOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
