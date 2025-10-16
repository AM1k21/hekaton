import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCategorizedInfo } from '$lib/db';

export const GET: RequestHandler = async () => {
	try {
		// Načti data z db.json pomocí připravené funkce
		const categorizedData = getCategorizedInfo();

		// Transformace dat do požadovaného formátu
		const items = categorizedData.map((item, index) => ({
			id: index,
			iri: item.data.iri,
			nazev: item.data.název?.cs || 'Bez názvu',
			url: item.data.url,
			vyveseni: item.data.vyvěšení?.datum || null,
			relevantniDo: item.data.relevantní_do?.datum || null,
			okruh: item.data.okruh?.cs || 'Nezařazeno',
			category: item.category,
			guessedLatitude: item.guessedLatitude,
			guessedLongitude: item.guessedLongitude,
			dokumenty: item.data.dokument?.map((doc: any) => ({
				nazev: doc.název?.cs || 'Dokument',
				url: doc.url,
				typ: doc.typ
			})) || []
		}));

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
		console.error('Error loading data from database:', error);
		return json(
			{ 
				error: 'Nepodařilo se načíst data z databáze',
				items: [],
				categories: []
			},
			{ status: 500 }
		);
	}
};
