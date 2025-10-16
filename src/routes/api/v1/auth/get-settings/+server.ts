import type { RequestHandler } from './$types';
import { findUserByEmail } from '$lib/db';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { email } = await request.json();

		if (!email) {
			return new Response(
				JSON.stringify({ message: 'Email je povinný' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		const user = findUserByEmail(email);

		if (!user) {
			return new Response(
				JSON.stringify({ message: 'Uživatel nenalezen' }),
				{ status: 404, headers: { 'Content-Type': 'application/json' } }
			);
		}

		return new Response(
			JSON.stringify({ 
				notifications: user.notifications ?? false,
				emailNotifications: user.emailNotifications ?? false,
				notificationPreferences: user.notificationPreferences ?? []
			}),
			{ status: 200, headers: { 'Content-Type': 'application/json' } }
		);
	} catch (error) {
		console.error('Error getting settings:', error);
		return new Response(
			JSON.stringify({ message: 'Chyba při načítání nastavení' }),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
};
