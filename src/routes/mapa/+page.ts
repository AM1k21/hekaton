import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	try {
		const response = await fetch('/api/oznaceni');
		const data = await response.json();
		
		if (data.error) {
			return {
				items: [],
				error: data.error
			};
		}

		return {
			items: data.items || [],
			error: null
		};
	} catch (error) {
		console.error('Error loading map data:', error);
		return {
			items: [],
			error: 'Nepodařilo se načíst data pro mapu'
		};
	}
};
