import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		const response = await fetch('https://www.khk.cz/uredni-deska/opendata.jsonld');
		
		if (!response.ok) {
			throw new Error('Failed to fetch data');
		}

		const data = await response.json();
		
		// Transformace dat do jednodušší struktury
		const informace = data.informace.map((item: any, index: number) => ({
			id: index, // Index jako ID pro routing
			iri: item.iri || '',
			nazev: item.název?.cs || 'Bez názvu',
			url: item.url || '',
			vyveseni: item.vyvěšení?.datum || null,
			relevantniDo: item.relevantní_do?.datum || item.relevantní_do?.nespecifikovaný ? null : null,
			okruh: item.okruh?.cs || 'Ostatní',
			dokumenty: item.dokument || []
		}));

		return json({
			success: true,
			data: informace
		});
	} catch (error) {
		console.error('Error fetching data:', error);
		return json(
			{
				success: false,
				error: 'Nepodařilo se načíst data z úřední desky'
			},
			{ status: 500 }
		);
	}
};
