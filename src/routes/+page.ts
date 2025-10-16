import type { PageLoad } from './$types';
interface User {
		id: string;
		email: string;
		seenAlert: boolean;
	}
export const load: PageLoad = async ({ fetch }) => {
	try {
		const response = await fetch('/api/oznaceni');
		const data = await response.json();
		let user: User | null = null;	
		if (typeof window !== 'undefined') {
			const storedUser = localStorage.getItem('user');
			if (storedUser) {
				user = JSON.parse(storedUser);
			}
		}
		return {
			items: data.items || [],
			seenAlert:user?.seenAlert ?? true,
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
