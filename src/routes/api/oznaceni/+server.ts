import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ItemCategory } from '$lib/types';

// Mapování okruhů na kategorie
const categoryMapping: Record<string, ItemCategory> = {
	'Ekonomika a trh práce': ItemCategory.EKONOMIKA,
	'Investice kraje': ItemCategory.INVESTICE,
	'IZS a bezpečnost': ItemCategory.BEZPECNOST,
	'Kraj a dotace': ItemCategory.DOTACE,
	'Kultura a cestovní ruch': ItemCategory.KULTURA,
	'Lidé a sociální služby': ItemCategory.SOCIALNI,
	'Školství a výzkum': ItemCategory.SKOLSTVI,
	'Veřejná doprava a silnice': ItemCategory.DOPRAVA,
	'Zdravotnictví a zdraví': ItemCategory.ZDRAVOTNICTVI,
	'Životní prostředí': ItemCategory.ZIVOTNI_PROSTREDI
};

export const GET: RequestHandler = async () => {
	try {
		const response = await fetch('https://www.khk.cz/uredni-deska/opendata.jsonld');
		
		if (!response.ok) {
			throw new Error('Failed to fetch data from KHK API');
		}

		const rawData = await response.json();

		// Transformace dat
		const items = rawData.informace.map((item: any, index: number) => {
			const okruh = item.okruh?.cs || 'Nezařazeno';
			const category = categoryMapping[okruh] || ItemCategory.NEZARAZENO;

			return {
				id: index,
				iri: item.iri,
				nazev: item.název?.cs || 'Bez názvu',
				url: item.url,
				vyveseni: item.vyvěšení?.datum || null,
				relevantniDo: item.relevantní_do?.datum || null,
				okruh: okruh,
				category: category,
				dokumenty: item.dokument?.map((doc: any) => ({
					nazev: doc.název?.cs || 'Dokument',
					url: doc.url,
					typ: doc.typ
				})) || []
			};
		});

		// Získej unikátní kategorie pro filtry
		const categories = Array.from(new Set(items.map((item: any) => item.category)))
			.sort()
			.map(cat => ({
				value: cat,
				label: cat
			}));

		return json({ 
			items,
			categories,
			timestamp: new Date().toISOString()
		});

	} catch (error) {
		console.error('Error fetching official board data:', error);
		return json(
			{ 
				error: 'Nepodařilo se načíst data z úřední desky',
				items: [],
				categories: []
			},
			{ status: 500 }
		);
	}
};
