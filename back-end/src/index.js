import "dotenv/config";
import http from "http";
import express from "express";
import { matchesRoute } from "./routes/matches.js";
import { attachWebsocketServer } from "./ws/server.js";

const app = express();

const server = http.createServer(app);

const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || "0.0.0.0";

app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "Working" });
});

app.use("/matches", matchesRoute);

const { broadcastMatchCreated } = attachWebsocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;

server.listen(PORT, HOST, () => {
    const baseURL =
        HOST == "0.0.0.0" ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
    console.log(`Server is running at ${baseURL}`);
    console.log(`Websocket is running at ${baseURL.replace("http", "ws")}/ws`);
});
