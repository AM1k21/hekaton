import type { RequestHandler } from './$types';
import { getDb, saveDb } from '$lib/db';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { 
			email, 
			notifications, 
			emailNotifications, 
			notificationPreferences,
			seenAlert
		} = await request.json();

		if (!email) {
			return new Response(
				JSON.stringify({ message: 'Email je povinný' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		const db = getDb();
		const userIndex = db.users.findIndex((u) => u.email === email);

		if (userIndex === -1) {
			return new Response(
				JSON.stringify({ message: 'Uživatel nenalezen' }),
				{ status: 404, headers: { 'Content-Type': 'application/json' } }
			);
		}

		if(notifications !== undefined){
			db.users[userIndex].notifications = notifications;
		}
		if(emailNotifications !== undefined){
			db.users[userIndex].emailNotifications = emailNotifications;
		}
		if(notificationPreferences !== undefined){
			db.users[userIndex].notificationPreferences = notificationPreferences;
		}
		if(seenAlert !== undefined){
			db.users[userIndex].seenAlert = seenAlert;
		}
		saveDb(db);

		return new Response(
			JSON.stringify({ 
				message: 'Nastavení úspěšně uloženo',
				user: {
					id: db.users[userIndex].id,
					email: db.users[userIndex].email,
					notifications: db.users[userIndex].notifications,
					emailNotifications: db.users[userIndex].emailNotifications,
					notificationPreferences: db.users[userIndex].notificationPreferences
				}
			}),
			{ status: 200, headers: { 'Content-Type': 'application/json' } }
		);
	} catch (error) {
		console.error('Error updating settings:', error);
		return new Response(
			JSON.stringify({ message: 'Chyba při ukládání nastavení' }),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
};
