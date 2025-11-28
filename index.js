import express, { json } from "express";
import { connect } from "mongoose";
import dotenv from "dotenv";
import i18next, { use } from "i18next";
import backend from "i18next-fs-backend";
import { LanguageDetector, handle } from "i18next-http-middleware";
import cors from "cors";
import morgan from "morgan";

import categoryRouter from "./routes/category.route.js";

dotenv.config();
use(backend)
    .use(LanguageDetector)
    .init({
        fallbackLng: "en",
        backend: {
            loadPath: "locales/{{lng}}.json",
        },
    });

const app = express();
const port = process.env.PORT;
const api = process.env.API;

app.use(handle(i18next));
app.use(
    cors({
        origin: ["http://localhost:3000"],
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization", "Accept-Language"],
    })
);
app.use(json());
app.use(morgan("tiny")); //Adds a log line for each request, like GET /api/v1/categories 200 183 - 160.765 ms

app.use(`${api}/categories`, categoryRouter);
app.get(`${api}/health`, (req, res) => {
    res.send(req.t("healthy"));
});

connect(process.env.CONNECTION_STRING)
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((error) => console.log(error));

app.listen(port, () => {
    console.log(`Server running at http://localhost${port}`);
});
