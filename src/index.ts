import express from "express";
import { config } from "./config.js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import type { NewUser } from "./db/schema.js";
import type { NextFunction, Request, Response } from "express";
import { createUser, deleteAllUsers } from "./db/queries/users.js";
import {
	createChirp,
	deleteAllChirps,
	getAllChirps,
	getChirpById,
} from "./db/queries/chirps.js";

const migrationClient = postgres(config.dbConfig.dbURL, { max: 1 });
await migrate(drizzle(migrationClient), config.dbConfig.migrationConfig);
const app = express();
const PORT = 8080;

class BadRequestError extends Error {
	async send(res: Response, next: NextFunction) {
		res.status(400).send({ error: this.message });
		next();
	}
}

class UnauthorizedError extends Error {
	async send(res: Response, next: NextFunction) {
		res.status(401).send({ error: this.message });
		next();
	}
}

class ForbiddenError extends Error {
	async send(res: Response, next: NextFunction) {
		res.status(403).send({ error: this.message });
		next();
	}
}

class NotFoundError extends Error {
	async send(res: Response, next: NextFunction) {
		res.status(404).send({ error: this.message });
		next();
	}
}

class InternalServerError extends Error {
	async send(res: Response, next: NextFunction) {
		res.status(500).send({ error: this.message });
		next();
	}
}

type Middleware = (req: Request, res: Response, next: NextFunction) => void;

const middlewwareLogResponses: Middleware = async (req, res, next) => {
	res.on("finish", () => {
		const statusCode = res.statusCode;
		const method = req.method;
		const url = req.url;
		if (statusCode >= 200 && statusCode < 300) {
			console.log(`[OK] ${method} ${url} = Status: ${statusCode}`);
		} else {
			console.log(`[NON-OK] ${method} ${url} = Status: ${statusCode}`);
		}
	});
	next();
};

const middlewareIncrementFileServerHits: Middleware = async (
	req,
	res,
	next,
) => {
	config.apiConfig.fileserverHits++;
	next();
};

const middlewareErrorHandler = async (
	err: Error,
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	if (err instanceof BadRequestError) return err.send(res, next);
	if (err instanceof NotFoundError) return err.send(res, next);
	if (err instanceof UnauthorizedError) return err.send(res, next);
	if (err instanceof ForbiddenError) return err.send(res, next);
	const e = new InternalServerError(err.message);
	return e.send(res, next);
};

const handlerReadiness = async (req: Request, res: Response) => {
	console.log(req);
	res.setHeader("content-type", "text/plain; charset=utf-8");
	return res.status(200).send("OK");
};

const handlerMetrics = async (req: Request, res: Response) => {
	res.setHeader("content-type", "text/html; charset=utf-8");
	return res.status(200).send(`<html>
  <body>
    <h1>Welcome, Chirpy Admin</h1>
    <p>Chirpy has been visited ${config.apiConfig.fileserverHits} times!</p>
  </body>
</html>`);
};

const handlerResetServerHits = async (req: Request, res: Response) => {
	config.apiConfig.fileserverHits = 0;
	return res.status(200).send("OK");
};

app.use(express.json());
app.use(middlewwareLogResponses);
app.use("/app", middlewareIncrementFileServerHits);
app.use("/app", express.static("./src/app"));
app.get("/api/healthz", handlerReadiness);
app.post("/api/users", async (req, res, next) => {
	type Payload = {
		email: string;
	};
	const payload: Payload = req.body;
	if (!payload) throw new BadRequestError("No payload");
	const newUser: NewUser = {
		email: payload.email,
	};
	const result = await createUser(newUser).catch(next);
	return res.status(201).send(result);
});

app.get("/api/chirps", async (_req, res, next) => {
	return res.status(200).send(await getAllChirps().catch(next));
});
app.get("/api/chirps/:chirpId", async (req, res, next) => {
	const { chirpId } = req.params;

	return res.status(200).send(await getChirpById(chirpId).catch(next));
});

app.post("/api/chirps", async (req, res, next) => {
	const profaneWords = ["kerfuffle", "sharbert", "fornax"];
	type responseBody = {
		cleanedBody: string;
	};

	type requestBody = {
		body: string;
		userId: string;
	};
	const { body, userId }: requestBody = req.body;
	try {
		if (!body) {
			return res.send({
				error: "Something went wrong",
			});
		}
		if (body.length <= 140) {
			const cleanedBody: string[] = [];
			const words = body.split(" ");
			words.forEach((word) => {
				if (profaneWords.includes(word.toLowerCase())) {
					cleanedBody.push("****");
				} else {
					cleanedBody.push(word);
				}
			});

			const ret: responseBody = {
				cleanedBody: cleanedBody.join(" "),
			};

			const result = await createChirp({
				body: ret.cleanedBody,
				userId: userId,
			});

			return res.status(201).send(result);
		}
		throw new BadRequestError("Chirp is too long. Max length is 140");
	} catch (error) {
		next(error);
	}
});
app.get("/admin/metrics", handlerMetrics);
app.post("/admin/reset", async (req, res, next) => {
	await deleteAllUsers().catch(next);
	await deleteAllChirps().catch(next);
	return res.status(200).send("OK");
});
app.use(middlewareErrorHandler);
app.listen(PORT, () =>
	console.log(`Server is running at http://localhost:${PORT}`),
);
