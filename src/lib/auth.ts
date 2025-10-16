// Simple password hashing using built-in functions
// For production, consider using a proper library

export async function hashPassword(password: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(password);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
	
	// Add a simple "salt" by appending timestamp
	const salt = Date.now().toString();
	return `${salt}:${hashHex}`;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	const [salt, storedHash] = hash.split(':');
	const encoder = new TextEncoder();
	const data = encoder.encode(password);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
	
	return hashHex === storedHash;
}

export function generateUserId(): string {
	return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

export interface AuthResponse {
	success: boolean;
	message?: string;
	user?: {
		id: string;
		email: string;
		seenAlert: boolean;
	};
}
