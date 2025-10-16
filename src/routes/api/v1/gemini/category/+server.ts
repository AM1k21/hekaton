import type { RequestHandler } from './$types';
import { GoogleGenAI } from "@google/genai";
import { GEMINI_API_KEY } from '$env/static/private';
import { ItemCategory, type UredniDeskaData, type CategorizedInformace } from '../../../../../lib/types';

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export const POST: RequestHandler = async ({ request }) => {
    try {
        const body = await request.json();
        const uredniDeska: UredniDeskaData = body.uredniDeska;

        if (!uredniDeska?.informace) {
            return new Response(
                JSON.stringify({ error: 'Missing required field: uredniDeska' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const CHUNK_SIZE = 20;
        const chunks = [];
        for (let i = 0; i < uredniDeska.informace.length; i += CHUNK_SIZE) {
            chunks.push(uredniDeska.informace.slice(i, i + CHUNK_SIZE));
        }

        const allCategorized: Array<{ iri: string; category: ItemCategory; guessedLatitude: number; guessedLongitude: number }> = [];
        const availableCategories = Object.values(ItemCategory).join(', ');

        for (const chunk of chunks) {
            const prompt = `Jsi AI asistent, který kategorizuje položky z úřední desky a odhaduje jejich geografickou polohu.

Přiřaď každé položce jednu z následujících kategorií:
${availableCategories}

Pokud se nehodí žádná, použij "${ItemCategory.NEZARAZENO}".

Pro každou položku také uhádni geografickou polohu (latitude a longitude) v Královéhradeckém kraji.
Základní souřadnice Královéhradeckého kraje: latitude 50.2, longitude 15.8
Pokud položka neobsahuje specifickou lokalitu, použij tyto základní souřadnice.
Pokud položka zmiňuje konkrétní město/obec v kraji, použij jeho aproximativní souřadnice.

Položky:
${chunk.map(item => `IRI: ${item.iri}\nNázev: ${item.název?.cs || 'Bez názvu'}\nOkruh: ${item.okruh?.cs || 'Nezařazeno'}`).join('\n\n')}

Vrať POUZE validní JSON pole objektů ve formátu:
[{"iri":"...","category":"Název Kategorie","guessedLatitude":50.2,"guessedLongitude":15.8}]`;

            const geminiResponse = await ai.models.generateContent({
                model: "gemini-2.5-flash-lite",
                contents: prompt,
                config: {
                    maxOutputTokens: 8192,
                    temperature: 0.1
                }
            });

            const responseText = (geminiResponse.text ?? "").toString().trim();
            
            if (!responseText) {
                console.warn('Empty response for chunk, skipping');
                continue;
            }

            let chunkCategories: Array<{ iri: string; category: ItemCategory; guessedLatitude: number; guessedLongitude: number }>;
            try {
                const jsonMatch = responseText.match(/\[[\s\S]*?\]/);
                if (!jsonMatch) {
                    throw new Error('No JSON array found in response');
                }
                
                let jsonStr = jsonMatch[0];
                
                const openBraces = (jsonStr.match(/{/g) || []).length;
                const closeBraces = (jsonStr.match(/}/g) || []).length;
                if (openBraces > closeBraces) {
                    jsonStr += '}'.repeat(openBraces - closeBraces);
                }
                if (!jsonStr.endsWith(']')) {
                    jsonStr += ']';
                }
                
                chunkCategories = JSON.parse(jsonStr);
            } catch (parseError) {
                console.error('JSON parse error:', parseError, '\nResponse:', responseText);
                chunkCategories = chunk.map(item => ({ 
                    iri: item.iri, 
                    category: ItemCategory.NEZARAZENO,
                    guessedLatitude: 50.2,
                    guessedLongitude: 15.8
                }));
            }

            allCategorized.push(...chunkCategories);
        }

        const categorizedResults: CategorizedInformace[] = uredniDeska.informace
            .map(item => {
                const categoryData = allCategorized.find(c => c.iri === item.iri);
                return {
                    data: item,
                    category: categoryData?.category ?? ItemCategory.NEZARAZENO,
                    guessedLatitude: categoryData?.guessedLatitude ?? 50.2,
                    guessedLongitude: categoryData?.guessedLongitude ?? 15.8
                };
            });

        return new Response(
            JSON.stringify({
                status: 'ok',
                results: categorizedResults,
                totalItems: categorizedResults.length,
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
