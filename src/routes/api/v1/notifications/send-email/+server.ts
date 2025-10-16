import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendEmail, createNotificationEmailHtml } from '$lib/nodemailer';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { email, messages } = await request.json();

		if (!email || !messages || !Array.isArray(messages)) {
			return json({ success: false, message: 'Invalid request data' }, { status: 400 });
		}

		if (messages.length === 0) {
			return json({ success: true, message: 'No messages to send' });
		}

		const subject = `Nová oznámení na úřední desce KHK`;
		const html = createNotificationEmailHtml(messages);
		const text = `Na úřední desce se objevilo ${messages.length} nových oznámení odpovídajících vašim preferencím.`;

		const result = await sendEmail({
			recipients: email,
			subject,
			text,
			html,
		});

		if (result.success) {
			return json({ success: true, message: 'Email sent successfully' });
		} else {
			return json({ success: false, message: 'Failed to send email', error: result.error }, { status: 500 });
		}
	} catch (error) {
		console.error('Error in send-notifications endpoint:', error);
		return json({ success: false, message: 'Internal server error' }, { status: 500 });
	}
};
