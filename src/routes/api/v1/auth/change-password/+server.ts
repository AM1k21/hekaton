import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { verifyPassword, hashPassword, type AuthResponse } from '$lib/auth';
import { findUserByEmail, getDb, saveDb } from '$lib/db';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { email, currentPassword, newPassword } = await request.json();

		// Validate input
		if (!email || !currentPassword || !newPassword) {
			return json<AuthResponse>(
				{ success: false, message: 'Všechna pole jsou povinná' },
				{ status: 400 }
			);
		}

		// Find user
		const user = findUserByEmail(email);
		if (!user) {
			return json<AuthResponse>(
				{ success: false, message: 'Uživatel nenalezen' },
				{ status: 404 }
			);
		}

		// Verify current password
		const isPasswordValid = await verifyPassword(currentPassword, user.password);
		if (!isPasswordValid) {
			return json<AuthResponse>(
				{ success: false, message: 'Staré heslo je nesprávné' },
				{ status: 401 }
			);
		}

		// Hash new password
		const hashedPassword = await hashPassword(newPassword);

		// Update password in database
		const db = getDb();
		const userIndex = db.users.findIndex((u) => u.email === email);
		if (userIndex !== -1) {
			db.users[userIndex].password = hashedPassword;
			saveDb(db);
		}

		return json<AuthResponse>(
			{
				success: true,
				message: 'Heslo úspěšně změněno'
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error('Password change error:', error);
		return json<AuthResponse>(
			{ success: false, message: 'Interní chyba serveru' },
			{ status: 500 }
		);
	}
};
