import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { verifyPassword, type AuthResponse } from '$lib/auth';
import { findUserByEmail } from '$lib/db';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { email, password } = await request.json();

		// Validate input
		if (!email || !password) {
			return json(
				{ success: false, message: 'Email and password are required' },
				{ status: 400 }
			);
		}

		// Find user
		const user = findUserByEmail(email);
		if (!user) {
			return json(
				{ success: false, message: 'Invalid email or password' },
				{ status: 401 }
			);
		}

		// Verify password
		const isPasswordValid = await verifyPassword(password, user.password);
		if (!isPasswordValid) {
			return json(
				{ success: false, message: 'Invalid email or password' },
				{ status: 401 }
			);
		}

		// Login successful
		return json(
			{
				success: true,
				message: 'Login successful',
				user: { id: user.id, email: user.email, seenAlert: user.seenAlert??false }
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error('Login error:', error);
		return json(
			{ success: false, message: 'Internal server error' },
			{ status: 500 }
		);
	}
};