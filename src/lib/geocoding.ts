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
		const response = await fetch(
			`${NOMINATIM_BASE_URL}/search?q=${encodeURIComponent(placeName)}&format=json&limit=1`,
			{
				headers: {
					'User-Agent': 'HeatonApp/1.0' // Required by Nominatim
				}
			}
		);

		if (!response.ok) {
			console.error('Geocoding failed:', response.statusText);
			return null;
		}

		const data: GeocodingResult[] = await response.json();

		if (data.length === 0) {
			console.error('No results found for:', placeName);
			return null;
		}

		const result = data[0];
		return `${parseFloat(result.lat).toFixed(6)}, ${parseFloat(result.lon).toFixed(6)}`;
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

		const response = await fetch(
			`${NOMINATIM_BASE_URL}/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`,
			{
				headers: {
					'User-Agent': 'HeatonApp/1.0'
				}
			}
		);

		if (!response.ok) {
			console.error('Reverse geocoding failed:', response.statusText);
			return coordinates;
		}

		const data: ReverseGeocodingResult = await response.json();

		// Try to get the most relevant place name
		const address = data.address;
		const placeName = 
			address.city || 
			address.town || 
			address.village || 
			address.municipality || 
			address.county ||
			address.state;

		return placeName || data.display_name || coordinates;
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
