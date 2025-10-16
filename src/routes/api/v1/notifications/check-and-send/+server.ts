import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/db';
import { sendEmail, createNotificationEmailHtml } from '$lib/nodemailer';

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
	const R = 6371; // Earth's radius in kilometers
	const dLat = (lat2 - lat1) * Math.PI / 180;
	const dLon = (lon2 - lon1) * Math.PI / 180;
	const a = 
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
		Math.sin(dLon / 2) * Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

/**
 * Check for new items and send email notifications to users who opted in
 * This endpoint should be called by a cron job or scheduled task
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		// Optional: Add authentication/authorization here to prevent abuse
		const { items } = await request.json();

		if (!items || !Array.isArray(items)) {
			return json({ success: false, message: 'Invalid request data' }, { status: 400 });
		}

		// Get all users from database
		const db = getDb();
		const usersToNotify = db.users.filter(user => 
			user.emailNotifications === true && 
			user.notificationPreferences && 
			user.notificationPreferences.length > 0
		);

		if (usersToNotify.length === 0) {
			return json({ 
				success: true, 
				message: 'No users to notify',
				userCount: 0,
				emailsSent: 0
			});
		}

		// Get today's date in YYYY-MM-DD format
		const today = new Date().toISOString().split('T')[0];

		// Filter messages from today
		const todaysMessages = items.filter((msg: any) => {
			return msg.vyveseni === today;
		});

		if (todaysMessages.length === 0) {
			return json({ 
				success: true, 
				message: 'No new messages today',
				userCount: usersToNotify.length,
				emailsSent: 0,
				newItems: 0
			});
		}

		let emailsSent = 0;
		const notificationResults = [];

		// Process each user
		for (const user of usersToNotify) {
			try {
				let matchedMessages: any[] = [];

				// Check each user's notification preferences
				for (const pref of user.notificationPreferences || []) {
					// Parse user's location coordinates
					const coordsMatch = pref.lokace.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
					if (!coordsMatch) {
						console.warn(`Invalid coordinates for user ${user.email}: ${pref.lokace}`);
						continue;
					}

					const userLat = parseFloat(coordsMatch[1]);
					const userLon = parseFloat(coordsMatch[2]);

					// Filter by category and location
					const preferencesMatches = todaysMessages.filter((msg: any) => {
						// Check if message category matches any of user's interests
						const categoryMatch = pref.zajmy.includes(msg.category);
						if (!categoryMatch) return false;

						// Check if message has location data
						if (!msg.guessedLatitude || !msg.guessedLongitude) {
							return false;
						}

						// Calculate distance
						const distance = calculateDistance(
							userLat,
							userLon,
							msg.guessedLatitude,
							msg.guessedLongitude
						);

						// Check if within radius
						return distance <= pref.radius;
					});

					matchedMessages = [...matchedMessages, ...preferencesMatches];
				}

				// Remove duplicates
				const uniqueMessages = matchedMessages.filter((msg, index, self) =>
					index === self.findIndex((m) => m.iri === msg.iri)
				);

				// Send email if there are matching messages
				if (uniqueMessages.length > 0) {
					const subject = `Nová oznámení na úřední desce KHK`;
					const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:5173';
					const html = createNotificationEmailHtml(uniqueMessages.map(msg => ({
						nazev: msg.nazev,
						category: msg.category,
						vyveseni: msg.vyveseni,
						url: `${baseUrl}/detail/${msg.id}`,
						location: msg.adresa || ''
					})));
					const text = `Na úřední desce se objevilo ${uniqueMessages.length} nových oznámení odpovídajících vašim preferencím.`;

					const result = await sendEmail({
						recipients: user.email,
						subject,
						text,
						html,
					});

					if (result.success) {
						emailsSent++;
						notificationResults.push({
							email: user.email,
							messagesCount: uniqueMessages.length,
							success: true
						});
					} else {
						notificationResults.push({
							email: user.email,
							messagesCount: uniqueMessages.length,
							success: false,
							error: result.error
						});
					}
				}

			} catch (userError) {
				console.error(`Error processing notifications for user ${user.email}:`, userError);
				notificationResults.push({
					email: user.email,
					success: false,
					error: userError
				});
			}
		}

		return json({ 
			success: true, 
			message: 'Notification check completed',
			userCount: usersToNotify.length,
			emailsSent,
			newItems: todaysMessages.length,
			results: notificationResults
		});

	} catch (error) {
		console.error('Error in check-and-send notifications:', error);
		return json({ 
			success: false, 
			message: 'Internal server error',
			error: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
};
