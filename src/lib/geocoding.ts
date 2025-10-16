// Geocoding utilities using OpenStreetMap Nominatim API (free, no API key needed)

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

interface GeocodingResult {
	lat: string;
	lon: string;
	display_name: string;
}

interface ReverseGeocodingResult {
	address: {
		city?: string;
		town?: string;
		village?: string;
		municipality?: string;
		county?: string;
		state?: string;
		country?: string;
	};
	display_name: string;
}

/**
 * Convert place name to coordinates
 * @param placeName - Name of the place (e.g., "Trutnov", "Prague")
 * @returns Coordinates in format "lat, lon" or null if not found
 */
export async function geocodePlace(placeName: string): Promise<string | null> {
	try {
		const response = await fetch('/api/geocode', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				type: 'forward',
				placeName
			})
		});

		if (!response.ok) {
			console.error('Geocoding failed:', response.status);
			return null;
		}

		const data = await response.json();

		if (data.error) {
			console.error('Geocoding error:', data.error);
			return null;
		}

		return data.coordinates;
	} catch (error) {
		console.error('Error geocoding place:', error);
		return null;
	}
}

/**
 * Convert coordinates to place name
 * @param coordinates - Coordinates in format "lat, lon"
 * @returns Place name or the coordinates if reverse geocoding fails
 */
export async function reverseGeocode(coordinates: string): Promise<string> {
	try {
		// Check if it's already coordinates
		const parts = coordinates.split(',').map(s => s.trim());
		if (parts.length !== 2) {
			return coordinates;
		}

		const lat = parseFloat(parts[0]);
		const lon = parseFloat(parts[1]);

		if (isNaN(lat) || isNaN(lon)) {
			return coordinates;
		}

		const response = await fetch('/api/geocode', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				type: 'reverse',
				coordinates
			})
		});

		if (!response.ok) {
			console.error('Reverse geocoding failed:', response.status);
			return coordinates;
		}

		const data = await response.json();

		if (data.error) {
			console.error('Reverse geocoding error:', data.error);
			return coordinates;
		}

		return data.placeName || coordinates;
	} catch (error) {
		console.error('Error reverse geocoding:', error);
		return coordinates;
	}
}

/**
 * Check if a string is in coordinate format
 * @param str - String to check
 * @returns true if it looks like coordinates
 */
export function isCoordinateFormat(str: string): boolean {
	const parts = str.split(',').map(s => s.trim());
	if (parts.length !== 2) return false;
	
	const lat = parseFloat(parts[0]);
	const lon = parseFloat(parts[1]);
	
	return !isNaN(lat) && !isNaN(lon) && 
		   lat >= -90 && lat <= 90 && 
		   lon >= -180 && lon <= 180;
}
