import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { CategorizedInformace } from './types';

const DB_PATH = join(process.cwd(), 'src/lib/db.json');

interface User {
	id: string;
	email: string;
	password: string;
	createdAt: string;
	notifications?: boolean;
	emailNotifications?: boolean;
	notificationPreferences?: Array<{
		zajmy: string[];
		lokace: string;
		radius: number;
	}>;
}

interface Database {
	users: User[];
	categorizedInfo: CategorizedInformace[];
}

// Initialize database if it doesn't exist
function ensureDb() {
	if (!existsSync(DB_PATH)) {
		const initialDb: Database = { users: [], categorizedInfo: [] };
		writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2));
	}
}

export function getDb(): Database {
	ensureDb();
	const data = readFileSync(DB_PATH, 'utf-8');
	return JSON.parse(data);
}

export function saveDb(db: Database) {
	writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function findUserByEmail(email: string): User | undefined {
	const db = getDb();
	return db.users.find((u) => u.email === email);
}

export function addUser(user: User) {
	const db = getDb();
	db.users.push(user);
	saveDb(db);
}

export function setCategorizedInfo(categorizedInfo: CategorizedInformace[]){
	const db = getDb();
	db.categorizedInfo = categorizedInfo;
	saveDb(db);
}
export function getCategorizedInfo(): CategorizedInformace[] {
	const db = getDb();
	return db.categorizedInfo || [];
}