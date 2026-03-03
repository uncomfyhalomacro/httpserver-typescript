import { loadEnvFile } from "node:process";
loadEnvFile();

import type { MigrationConfig } from "drizzle-orm/migrator";

const migrationConfig: MigrationConfig = {
	migrationsFolder: "./src/db/models",
};

const envOrThrow = (key: string) => {
	const envVar: string | undefined = process.env[key];
	if (!envVar) throw new Error(`Env for key ${key} is missing`);
	return envVar;
};

type DBConfig = {
	dbURL: string;
	migrationConfig: MigrationConfig;
};

type ApiConfig = {
	fileserverHits: number;
	platform: string;
};

type CoreConfig = {
	dbConfig: DBConfig;
	apiConfig: ApiConfig;
};

export const config: CoreConfig = {
	dbConfig: {
		dbURL: envOrThrow("DB_URL"),
		migrationConfig,
	},
	apiConfig: {
		fileserverHits: 0,
		platform: envOrThrow("PLATFORM")
	},
};

export { envOrThrow };

export default ApiConfig;
