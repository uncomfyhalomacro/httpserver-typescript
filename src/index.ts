import express from "express";
import type ApiConfig from "./config.js";

const apiConfig: ApiConfig = {
	fileserverHits: 0,
};

const app = express();
const PORT = 8080;

class BadRequestError extends Error {
	async send(res: Response, next: NextFunction) {
		res.status(400).send({ error: this.message });
		await next();
	}
}

class UnauthorizedError extends Error {
	async send(res: Response, next: NextFunction) {
		res.status(401).send({ error: this.message });
		await next();
	}
}

class ForbiddenError extends Error {
	async send(res: Response, next: NextFunction) {
		res.status(403).send({ error: this.message });
		await next();
	}
}

class NotFoundError extends Error {
	async send(res: Response, next: NextFunction) {
		res.status(404).send({ error: this.message });
		await next();
	}
}

class InternalServerError extends Error {
	async send(res: Response, next: NextFunction) {
		res.status(500).send({ error: this.message });
		await next();
	}
}

import type { NextFunction, Request, Response } from "express";

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
	await next();
};

const middlewareIncrementFileServerHits: Middleware = async (
	req,
	res,
	next,
) => {
	apiConfig.fileserverHits++;
	await next();
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
    <p>Chirpy has been visited ${apiConfig.fileserverHits} times!</p>
  </body>
</html>`);
};

const handlerResetServerHits = async (req: Request, res: Response) => {
	apiConfig.fileserverHits = 0;
	return res.status(200).send("OK");
};

app.use(express.json());
app.use(middlewwareLogResponses);
app.use("/app", middlewareIncrementFileServerHits);
app.use("/app", express.static("./src/app"));
app.get("/api/healthz", handlerReadiness);
app.post("/api/validate_chirp", async (req, res, next) => {
	const profaneWords = ["kerfuffle", "sharbert", "fornax"];
	type responseBody = {
		cleanedBody: string;
	};
	const { body }: { body: string | undefined } = req.body;
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

			return res.status(200).send(ret);
		}
		throw new BadRequestError("Chirp is too long. Max length is 140");
	} catch (error) {
		next(error);
	}
});
app.get("/admin/metrics", handlerMetrics);
app.post("/admin/reset", handlerResetServerHits);
app.use(middlewareErrorHandler);
app.listen(PORT, () =>
	console.log(`Server is running at http://localhost:${PORT}`),
);
