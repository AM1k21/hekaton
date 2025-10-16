/**
 * Daily Notification Script
 * 
 * This script fetches the latest items from the API and triggers email notifications
 * for users who have opted in.
 * 
 * Usage:
 * - Run manually: tsx scripts/send-daily-notifications.ts
 * - Schedule with cron (Linux/Mac):
 *   Add to crontab: 0 8 * * * cd /path/to/project && tsx scripts/send-daily-notifications.ts
 * - Schedule with Windows Task Scheduler:
 *   Create a task that runs: powershell.exe -Command "cd C:\path\to\project; tsx scripts/send-daily-notifications.ts"
 */

const API_BASE_URL = process.env.PUBLIC_BASE_URL || 'http://localhost:5173';

async function sendDailyNotifications() {
	console.log('🔔 Starting daily notification check...');
	console.log(`📅 Date: ${new Date().toISOString()}`);

	try {
		// Step 1: Fetch all items from the oznaceni API
		console.log('📥 Fetching items from /api/oznaceni...');
		const itemsResponse = await fetch(`${API_BASE_URL}/api/oznaceni`);
		
		if (!itemsResponse.ok) {
			throw new Error(`Failed to fetch items: ${itemsResponse.statusText}`);
		}

		const itemsData = await itemsResponse.json();
		const items = itemsData.items;

		console.log(`✅ Fetched ${items.length} total items`);

		// Step 2: Send items to the notification check endpoint
		console.log('📧 Checking for users to notify...');
		const notificationResponse = await fetch(`${API_BASE_URL}/api/v1/notifications/check-and-send`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ items })
		});

		if (!notificationResponse.ok) {
			throw new Error(`Failed to send notifications: ${notificationResponse.statusText}`);
		}

		const notificationResult = await notificationResponse.json();

		// Step 3: Log results
		console.log('\n📊 Results:');
		console.log(`   • Users with notifications enabled: ${notificationResult.userCount}`);
		console.log(`   • New items today: ${notificationResult.newItems}`);
		console.log(`   • Emails sent: ${notificationResult.emailsSent}`);

		if (notificationResult.results && notificationResult.results.length > 0) {
			console.log('\n📝 Detailed results:');
			notificationResult.results.forEach((result: any, index: number) => {
				const status = result.success ? '✅' : '❌';
				console.log(`   ${status} ${result.email}: ${result.messagesCount || 0} messages`);
			});
		}

		console.log('\n✅ Daily notification check completed successfully!');
		process.exit(0);

	} catch (error) {
		console.error('\n❌ Error sending daily notifications:', error);
		process.exit(1);
	}
}

// Run the script
sendDailyNotifications();
