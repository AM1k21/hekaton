import type { RequestHandler } from './$types';
import { setCategorizedInfo } from '$lib/db';
export const GET: RequestHandler = async ({ fetch, url }) => {
    try {
        // Fetch the data from the external URL
        const uredniDeskaResponse = await fetch('https://www.khk.cz/uredni-deska/opendata.jsonld');
        if (!uredniDeskaResponse.ok) {
            throw new Error(`Failed to fetch data: ${uredniDeskaResponse.statusText}`);
        }
        const uredniDeska = await uredniDeskaResponse.json();

        // Build the full URL for the category endpoint
        const categoryUrl = new URL('/api/v1/gemini/category', url.origin);
        
        // Call the /gemini/category endpoint
        const categoryResponse = await fetch(categoryUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                uredniDeska: uredniDeska,
            })
        });

        if (!categoryResponse.ok) {
            const errorText = await categoryResponse.text();
            throw new Error(`Category endpoint error: ${categoryResponse.statusText} - ${errorText}`);
        }

        const categoryData = await categoryResponse.json();
        setCategorizedInfo(categoryData.results);

        return new Response(
            JSON.stringify(categoryData),
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