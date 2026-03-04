import { argon2id, hash, verify } from "argon2";
import type { Request } from "express";
import jwt from "jsonwebtoken";
import { Buffer } from "node:buffer";
import { randomBytes } from "node:crypto";
import { config } from "./config.js";

const generateCommonOptions = (salt: NonSharedBuffer) => {
	const parameters = {
		type: argon2id,
		salt,
		parallelism: 4,
		tagLength: 64,
		memory: 65536,
		passes: 3,
	};
	return parameters;
};
export const hashPassword = async (password: string) => {
	const salt = randomBytes(16);
	const pbuf = Buffer.from(password);
	const hashedPassword = await hash(pbuf, generateCommonOptions(salt));
	return hashedPassword;
};

export const verifyPassword = async (digest: string, password: string) => {
	return verify(digest, password);
};

export const makeJWT = (
	userID: string,
	expiresIn: number,
	secret: string,
): string => {
	const iat = Math.floor(Date.now() / 1000);
	const payload = {
		iss: "chirpy",
		sub: userID,
		iat: iat,
		exp: iat + expiresIn,
	};
	return jwt.sign(payload, secret);
};

export const validateJWT = (token: string, secret: string): string => {
	const payload = jwt.verify(token, secret);
	if (typeof payload === "string") {
		console.warn("payload is verified but is a string");
		return payload;
	}
	if (!payload.sub) throw new Error("no sub field found");
	return payload.sub;
};

export const getBearerToken = (req: Request) => {
	const authorizationHeader = req.get("authorization") ?? "";
	const [b, token] = authorizationHeader.split(" ");
	if (b !== "Bearer") throw new Error("not a bearer token");
	if (token.trim() === "") throw new Error("no token found");
	return token;
};
