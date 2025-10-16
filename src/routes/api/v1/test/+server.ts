import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ fetch, url }) => {
    try {
        // Fetch the data from the external URL
        const uredniDeskaResponse = await fetch('https://www.khk.cz/uredni-deska/opendata.jsonld');
        if (!uredniDeskaResponse.ok) {
            throw new Error(`Failed to fetch data: ${uredniDeskaResponse.statusText}`);
        }
        const uredniDeska = await uredniDeskaResponse.json();

        // Test user parameters
        const testUserParams = {
            zajmy: ['školství', 'doprava'],
            lokace: 'Hradec Králové'
        };

        // Build the full URL for the rate endpoint
        const rateUrl = new URL('/api/v1/gemini/rate', url.origin);
        
        // Call the /gemini/rate endpoint
        const rateResponse = await fetch(rateUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                uredniDeska: uredniDeska,
                userParams: testUserParams,
                minScore: 0.5
            })
        });

        if (!rateResponse.ok) {
            const errorText = await rateResponse.text();
            throw new Error(`Rate endpoint error: ${rateResponse.statusText} - ${errorText}`);
        }

        const rateData = await rateResponse.json();

        return new Response(
            JSON.stringify(rateData),
            { 
                status: 200,
                headers: { 'Content-Type': 'application/json' } 
            }
        );

    } catch (error) {
        console.error('Error in test endpoint:', error);
        return new Response(
            JSON.stringify({ 
                error: 'Test endpoint error',
                details: error instanceof Error ? error.message : 'Unknown error'
            }),
            { 
                status: 500,
                headers: { 'Content-Type': 'application/json' } 
            }
        );
    }
};