import { Buffer } from "node:buffer";
import { randomBytes } from "node:crypto";
import { argon2id, hash, verify } from "argon2";

const generateCommonOptions = () => {
	const parameters = {
		type: argon2id,
		salt: randomBytes(16),
		parallelism: 4,
		tagLength: 64,
		memory: 65536,
		passes: 3,
	};
	return parameters;
};
export const hashPassword = async (password: string) => {
	const pbuf = Buffer.from(password);
	const hashedPassword = await hash(pbuf, generateCommonOptions());
	return hashedPassword;
};

export const verifyPassword = async (digest: string, password: string) => {
	return verify(digest, password);
};
