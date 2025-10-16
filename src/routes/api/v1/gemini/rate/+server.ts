import type { RequestHandler } from '../../$types';
import { GoogleGenAI } from "@google/genai";
import { GEMINI_API_KEY } from '$env/static/private';
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });;
import { type UredniDeskaData, type UserParams, type ScoredInformace } from '../../../../../lib/types';
export const POST: RequestHandler = async ({ request }) => {
    try {
        const body = await request.json();
        const uredniDeska: UredniDeskaData = body.uredniDeska;
        const userParams: UserParams = body.userParams;
        const minScore = body.minScore ?? 0.0;

        if (!uredniDeska?.informace || !userParams) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: uredniDeska, userParams' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // **CRITICAL FIX: Process in chunks to avoid truncation**
        const CHUNK_SIZE = 20; // Process 20 items at a time
        const chunks = [];
        for (let i = 0; i < uredniDeska.informace.length; i += CHUNK_SIZE) {
            chunks.push(uredniDeska.informace.slice(i, i + CHUNK_SIZE));
        }

        const allScores: Array<{ iri: string; relevanceScore: number }> = [];

        for (const chunk of chunks) {
            const prompt = `Jsi AI asistent pro hodnocení relevance úředních sdělení.

Uživatel: zájmy=${userParams.zajmy.join(', ')}, lokace=${userParams.lokace}

Ohodnoť každou položku skóre 0.0-1.0:
- 1.0 = velmi relevantní (přesná shoda zájmů a lokace)
- 0.5 = středně relevantní
- 0.0 = nerelevantní
Nedrž se pouze těchto hodnot - použij mnoho precisních hodnot, klidně i spoustu desetinných míst, jenom aby to bylo co nejpřesnější. Nesmí mít více věcí stejnou relevanci. Pokud bude skóre nižší než ${minScore}, tato věc se uživatli neukáže.

Položky:
${chunk.map(item => `IRI: ${item.iri}\nNázev: ${item.název}\nOkruh: ${item.okruh}`).join('\n\n')}

Vrať POUZE validní JSON pole bez dalšího textu:
[{"iri":"...","relevanceScore":0.5}]`;

            const geminiResponse = await ai.models.generateContent({
                model: "gemini-2.5-flash-lite",
                contents: prompt,
                config: {
                    maxOutputTokens: 8192, // Set explicit limit
                    temperature: 0.1 // Lower temperature for consistent scoring
                }
            });

            const responseText = (geminiResponse.text ?? "").toString().trim();
            
            if (!responseText) {
                console.warn('Empty response for chunk, skipping');
                continue;
            }

            // **IMPROVED JSON EXTRACTION**
            let chunkScores: Array<{ iri: string; relevanceScore: number }>;
            try {
                // Try to extract JSON from response
                const jsonMatch = responseText.match(/\[[\s\S]*?\]/);
                if (!jsonMatch) {
                    throw new Error('No JSON array found in response');
                }
                
                let jsonStr = jsonMatch[0];
                
                // **FIX: Handle truncated JSON by closing it**
                const openBraces = (jsonStr.match(/{/g) || []).length;
                const closeBraces = (jsonStr.match(/}/g) || []).length;
                if (openBraces > closeBraces) {
                    jsonStr += '}'.repeat(openBraces - closeBraces);
                }
                if (!jsonStr.endsWith(']')) {
                    jsonStr += ']';
                }
                
                chunkScores = JSON.parse(jsonStr);
            } catch (parseError) {
                console.error('JSON parse error:', parseError, '\nResponse:', responseText);
                // Fallback: assign default score to all items in chunk
                chunkScores = chunk.map(item => ({ 
                    iri: item.iri, 
                    relevanceScore: 0.0 
                }));
            }

            allScores.push(...chunkScores);
        }

        // Combine scores with original data
        const scoredResults: ScoredInformace[] = uredniDeska.informace
            .map(item => {
                const scoreData = allScores.find(s => s.iri === item.iri);
                return {
                    data: item,
                    relevanceScore: scoreData?.relevanceScore ?? 0
                };
            })
            .filter(item => item.relevanceScore >= minScore)
            .sort((a, b) => b.relevanceScore - a.relevanceScore);

        return new Response(
            JSON.stringify({
                status: 'ok',
                results: scoredResults,
                totalItems: scoredResults.length,
                processedChunks: chunks.length
            }),
            { headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error processing request:', error);
        return new Response(
            JSON.stringify({ 
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};