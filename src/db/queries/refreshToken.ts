import { db } from "../index.js";
import { type NewRefreshToken, refreshTokens } from "../schema.js";
import { eq } from "drizzle-orm";

export async function createRefreshToken(refreshTokenParams: NewRefreshToken) {
	const [result] = await db
		.insert(refreshTokens)
		.values(refreshTokenParams)
		.onConflictDoNothing()
		.returning();
	return result;
}

export async function getRefreshTokenByUserId(userId: string) {
	const [result] = await db
		.select()
		.from(refreshTokens)
		.where(eq(refreshTokens.userId, userId));
	return result;
}

export async function updateRefreshTokenByToken(token: string) {
	const [result] = await db
		.update(refreshTokens)
		.set({
    			token: token,
			expiresAt: new Date(Math.floor(Date.now() / 1000) + 60 * 60 * 60),
			updatedAt: new Date(Math.floor(Date.now())),
		})
		.where(eq(refreshTokens.token, token))
		.returning();
	return result;
}

export async function revokeRefreshTokenByToken(token: string) {
	const [result] = await db
		.update(refreshTokens)
		.set({
			revokedAt: new Date(Math.floor(Date.now())),
			updatedAt: new Date(Math.floor(Date.now())),
		})
		.where(eq(refreshTokens.token, token))
		.returning();
	return result;
}

export async function getRefreshTokenByToken(token: string) {
	const [result] = await db
		.select()
		.from(refreshTokens)
		.where(eq(refreshTokens.token, token));
	return result;
}
export async function deleteAllRefTokens() {
	await db.delete(refreshTokens);
}
