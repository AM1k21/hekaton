import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	try {
		const response = await fetch('/api/oznaceni');
		const data = await response.json();
		
		return {
			items: data.items || [],
			categories: data.categories || [],
			error: data.error || null
		};
	} catch (error) {
		console.error('Error loading data:', error);
		return {
			items: [],
			categories: [],
			error: 'Nepodařilo se načíst data'
		};
	}
};
