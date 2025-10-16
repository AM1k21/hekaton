import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ fetch, url }) => {
    try {
        // Fetch the transformed data from /api/oznaceni
        const oznaceniResponse = await fetch('/api/oznaceni');
        if (!oznaceniResponse.ok) {
            throw new Error(`Failed to fetch data: ${oznaceniResponse.statusText}`);
        }
        const oznaceniData = await oznaceniResponse.json();

        // Find the first item with documents
        const itemToSummarize = oznaceniData.items.find(
            (item: any) => item.dokumenty && item.dokumenty.length > 0
        );

        if (!itemToSummarize) {
            return new Response(
                JSON.stringify({ error: 'No item with documents found to summarize' }),
                { status: 404, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Build the full URL for the summary endpoint
        const summaryUrl = new URL('/api/v1/gemini/summary', url.origin);
        
        // Call the /gemini/summary endpoint
        const summaryResponse = await fetch(summaryUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(itemToSummarize)
        });

        if (!summaryResponse.ok) {
            const errorText = await summaryResponse.text();
            throw new Error(`Summary endpoint error: ${summaryResponse.statusText} - ${errorText}`);
        }

        const summaryData = await summaryResponse.json();

        // Return both the original item and its summary
        return new Response(
            JSON.stringify({
                originalItem: itemToSummarize,
                summaryResult: summaryData
            }),
            { 
                status: 200,
                headers: { 'Content-Type': 'application/json' } 
            }
        );

    } catch (error) {
        console.error('Error in test summary endpoint:', error);
        return new Response(
            JSON.stringify({ 
                error: 'Test summary endpoint error',
                details: error instanceof Error ? error.message : 'Unknown error'
            }),
            { 
                status: 500,
                headers: { 'Content-Type': 'application/json' } 
            }
        );
    }
};
