import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, fetch }) => {
	try {
		const response = await fetch('/api/oznaceni');
		const data = await response.json();
		
		if (data.error) {
			return {
				item: null,
				error: data.error
			};
		}

		const itemId = parseInt(params.id);
		const item = data.items.find((i: any) => i.id === itemId);

		if (!item) {
			return {
				item: null,
				error: 'Oznámení nebylo nalezeno'
			};
		}

		return {
			item,
			itemId: params.id,
			error: null
		};
	} catch (error) {
		console.error('Error loading detail:', error);
		return {
			item: null,
			error: 'Nepodařilo se načíst detail oznámení'
		};
	}
};
