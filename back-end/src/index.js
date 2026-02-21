import "dotenv/config";
import http from "http";
import express from "express";
import { matchesRoute } from "./routes/matches.js";
import { attachWebsocketServer } from "./ws/server.js";
import { securityMiddleware } from "./arcjet.js";
import { commentaryRouter } from "./routes/commentary.js";

const app = express();

const server = http.createServer(app);

const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || "0.0.0.0";

app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "Working" });
});

app.use(securityMiddleware());

app.use("/matches", matchesRoute);
app.use("/matches/:id/commentary", commentaryRouter);

const { broadcastMatchCreated, broadcastCommentary } = attachWebsocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;
app.locals.broadcastCommentary = broadcastCommentary;

server.listen(PORT, HOST, () => {
    const baseURL =
        HOST == "0.0.0.0" ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
    console.log(`Server is running at ${baseURL}`);
    console.log(`Websocket is running at ${baseURL.replace("http", "ws")}/ws`);
});
