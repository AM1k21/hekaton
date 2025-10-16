import type { RequestHandler } from './$types';
import { GoogleGenAI } from "@google/genai";
import { GEMINI_API_KEY } from '$env/static/private';
import { ItemCategory, type UredniDeskaData, type CategorizedInformace } from '../../../../../lib/types';

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

async function geocodeLocation(cityName: string): Promise<{ lat: number; lon: number } | null> {
    try {
        const params = new URLSearchParams({
            q: `${cityName}, Královéhradecký kraj, Czech Republic`,
            format: 'json',
            limit: '1',
            countrycodes: 'cz'
        });
        
        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
            headers: {
                'User-Agent': 'UredniDeska-PWA/1.0'
            }
        });
        
        if (!response.ok) {
            return null;
        }
        
        const data = await response.json();
        if (data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon)
            };
        }
        
        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}

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

        const allCategorized: Array<{ iri: string; category: ItemCategory; cityName: string; guessedLatitude: number; guessedLongitude: number }> = [];
        const availableCategories = Object.values(ItemCategory).join(', ');

        for (const chunk of chunks) {
            const prompt = `Jsi AI asistent, který kategorizuje položky z úřední desky, extrahuje název města a odhaduje jejich geografickou polohu.

Přiřaď každé položce jednu z následujících kategorií:
${availableCategories}

Pokud se nehodí žádná, použij "${ItemCategory.NEZARAZENO}".

Pro každou položku:
1. Extrahuj název města/obce, pokud je uvedeno (pokud není, použij prázdný řetězec "")
2. Uhádni geografickou polohu (latitude a longitude) v Královéhradeckém kraji
   - Základní souřadnice Královéhradeckého kraje: latitude 50.2, longitude 15.8
   - Pokud položka neobsahuje specifickou lokalitu, použij tyto základní souřadnice
   - Pokud položka zmiňuje konkrétní město/obec v kraji, použij jeho aproximativní souřadnice

Položky:
${chunk.map(item => `IRI: ${item.iri}\nNázev: ${item.název?.cs || 'Bez názvu'}\nOkruh: ${item.okruh?.cs || 'Nezařazeno'}`).join('\n\n')}

Vrať POUZE validní JSON pole objektů ve formátu:
[{"iri":"...","category":"Název Kategorie","cityName":"Hradec Králové","guessedLatitude":50.2,"guessedLongitude":15.8}]`;
            
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

            let chunkCategories: Array<{ iri: string; category: ItemCategory; cityName: string; guessedLatitude: number; guessedLongitude: number }>;
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
                    cityName: '',
                    guessedLatitude: 50.2,
                    guessedLongitude: 15.8
                }));
            }

            allCategorized.push(...chunkCategories);
        }

        // Geocode cities using Nominatim
        for (const item of allCategorized) {
            if (item.cityName && item.cityName.trim() !== '') {
                const geocoded = await geocodeLocation(item.cityName);
                if (geocoded) {
                    item.guessedLatitude = geocoded.lat;
                    item.guessedLongitude = geocoded.lon;
                }
            }
            // Add small delay to respect Nominatim usage policy (max 1 req/sec)
            await new Promise(resolve => setTimeout(resolve, 1000));
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
