import { db } from "../index.js";
import { chirps, type NewChirp } from "../schema.js";
import { asc, desc, eq } from "drizzle-orm";

export async function createChirp(chirp: NewChirp) {
	const [result] = await db
		.insert(chirps)
		.values(chirp)
		.onConflictDoNothing()
		.returning();
	return result;
}

export async function getAllChirps() {
	const results = await db.select().from(chirps).orderBy(asc(chirps.createdAt));
	return results;
}

export async function getChirpById(id: string) {
	const [result] = await db.select().from(chirps).where(eq(chirps.id, id));
	return result;
}

export async function deleteAllChirps() {
	await db.delete(chirps);
}
