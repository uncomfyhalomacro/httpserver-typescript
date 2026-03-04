import { describe, it, expect, beforeAll } from "vitest";
import { makeJWT, validateJWT, verifyPassword, hashPassword } from "./auth";
import { setTimeout } from "node:timers/promises";
import { JsonWebTokenError } from "jsonwebtoken";

describe("Password Hashing", () => {
	const password1 = "correctPassword123!";
	const password2 = "wrong!";
	let hash1: string;
	let hash2: string;

	beforeAll(async () => {
		hash1 = await hashPassword(password1);
		await setTimeout(1000);
		hash2 = await hashPassword(password2);
	});

	it("should return true for the correct password", async () => {
		const result = await verifyPassword(hash1, password1);
		expect(result).toBe(true);
	});

	it("should return false for the second same password", async () => {
		const result = await verifyPassword(hash1, password2);
		expect(result).toBe(false);
	});
});

describe("JWT creation and validation", () => {
	const p1 = {
		userID: "1234",
		expiresIn: 86400,
		secret: "fake",
	};
	const p2 = {
		userID: "1234",
		expiresIn: 86400,
		secret: "fake",
	};
	const p3 = {
		userID: "1234",
		expiresIn: 86400,
		secret: "fail",
	}

	const j1 = makeJWT(p1.userID, p1.expiresIn, p1.secret);
	const j2 = makeJWT(p2.userID, p2.expiresIn, p2.secret);
	const j3 = makeJWT(p3.userID, p3.expiresIn, p3.secret);

	it("should be equal jwt strings", () => {
		const v1 = validateJWT(j1, "fake");
		const v2 = validateJWT(j2, "fake");
		expect(v1).toBe(v2);
	});

	it("should throw if secrets are wrong", () => {
		const v1 = validateJWT(j1, "fake");
		const v3 = validateJWT(j3, "fail");
		expect(() => validateJWT(j3, "fake")).toThrow(JsonWebTokenError)
		expect(v1).toBe(v3)
	});
});
