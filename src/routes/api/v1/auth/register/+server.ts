import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { hashPassword, generateUserId, type AuthResponse } from '$lib/auth';
import { findUserByEmail, addUser } from '$lib/db';

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

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return json(
				{ success: false, message: 'Invalid email format' },
				{ status: 400 }
			);
		}

		// Validate password length
		if (password.length < 6) {
			return json(
				{ success: false, message: 'Password must be at least 6 characters' },
				{ status: 400 }
			);
		}

		// Check if user already exists
		if (findUserByEmail(email)) {
			return json(
				{ success: false, message: 'User already exists' },
				{ status: 409 }
			);
		}

		// Hash password and create user
		const hashedPassword = await hashPassword(password);
		const userId = generateUserId();
		const newUser = {
			id: userId,
			email,
			password: hashedPassword,
			createdAt: new Date().toISOString(),
			notifications: false,
			emailNotifications: false,
			notificationPreferences: [],
			seenAlert: false
		};

		addUser(newUser);

		return json(
			{
				success: true,
				message: 'User registered successfully',
				user: { id: userId, email, seenAlert: false }
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('Registration error:', error);
		return json(
			{ success: false, message: 'Internal server error' },
			{ status: 500 }
		);
	}
};
