import express from "express";
import type ApiConfig from "./config.js";

const apiConfig: ApiConfig = {
	fileserverHits: 0,
};

const app = express();
const PORT = 8080;

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

const middlewareIncrementFileServerHits: Middleware = async (req, res, next) => {
	apiConfig.fileserverHits++;
	await next();
};

const handlerReadiness = async (req: Request, res: Response) => {
	console.log(req);
	res.setHeader("content-type", "text/plain; charset=utf-8");
	return res.status(200).send("OK");
};

const handlerMetrics = async (req: Request, res: Response) => {
	return res.status(200).send(`Hits: ${apiConfig.fileserverHits}`);
};

const handlerResetServerHits = async (req: Request, res: Response) => {
	apiConfig.fileserverHits = 0;
	return res.status(200).send("OK");
};

app.use(middlewwareLogResponses);
app.use("/app", middlewareIncrementFileServerHits);
app.use("/app", express.static("./src/app"));
app.get("/api/healthz", handlerReadiness);
app.get("/api/metrics", handlerMetrics);
app.get("/api/reset", handlerResetServerHits);

app.listen(PORT, () =>
	console.log(`Server is running at http://localhost:${PORT}`),
);
