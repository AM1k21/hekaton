import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { type, placeName, coordinates } = await request.json();

		if (type === 'forward' && placeName) {
			// Forward geocoding: place name -> coordinates
			const response = await fetch(
				`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(placeName)}&format=json&limit=1`,
				{
					headers: {
						'User-Agent': 'UredniDeskaPWA/1.0'
					}
				}
			);

			if (!response.ok) {
				return json({ error: 'Geocoding failed' }, { status: 500 });
			}

			const data = await response.json();

			if (data.length === 0) {
				return json({ error: 'Location not found' }, { status: 404 });
			}

			return json({
				coordinates: `${parseFloat(data[0].lat).toFixed(6)}, ${parseFloat(data[0].lon).toFixed(6)}`,
				displayName: data[0].display_name
			});

		} else if (type === 'reverse' && coordinates) {
			// Reverse geocoding: coordinates -> place name
			const [lat, lon] = coordinates.split(',').map((c: string) => c.trim());

			const response = await fetch(
				`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=12&addressdetails=1`,
				{
					headers: {
						'User-Agent': 'UredniDeskaPWA/1.0'
					}
				}
			);

			if (!response.ok) {
				return json({ error: 'Reverse geocoding failed' }, { status: 500 });
			}

			const data = await response.json();

			console.log('Reverse geocoding response:', JSON.stringify(data.address, null, 2));

			// Extract city/town name with better priority
			// Prioritize specific locations over administrative regions
			const placeName = 
				data.address?.city || 
				data.address?.town || 
				data.address?.village || 
				data.address?.municipality ||
				data.address?.suburb ||
				data.address?.county ||
				data.display_name.split(',')[0].trim();

			return json({
				placeName,
				displayName: data.display_name
			});

		} else {
			return json({ error: 'Invalid request' }, { status: 400 });
		}

	} catch (error) {
		console.error('Geocoding error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
