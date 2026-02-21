import { WebSocket, WebSocketServer } from "ws";
import { wsArcjet } from "../arcjet.js";

const matchSubscribers = new Map();

function subscribe(matchId, socket) {
    if (!matchSubscribers.has(matchId)) {
        matchSubscribers.set(matchId, new Set());
    }

    matchSubscribers.get(matchId).add(socket);
    socket.subscriptions.add(matchId);
}

function unsubscribe(matchId, socket) {
    const subscribers = matchSubscribers.get(matchId);

    if (!subscribers) return;

    subscribers.delete(socket);
    socket.subscriptions.delete(matchId);
    if (subscribers.size == 0) {
        matchSubscribers.delete(matchId);
    }
}

function cleanupSubscriptions(socket) {
    for (const matchId of socket.subscriptions) {
        unsubscribe(matchId, socket);
    }
}

export function sendJsonMessage(socket, payload) {
    if (socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify(payload));
}

export function broadcastMessage(wss, payload) {
    for (const client of wss.clients) {
        if (client.readyState == WebSocket.OPEN) {
            client.send(JSON.stringify(payload));
        }
    }
}

function broadcastCommentaryToSubscribers(matchId, payload) {
    const subscribers = matchSubscribers.get(matchId);

    if (!subscribers || subscribers.size == 0) return;
    const message = JSON.stringify(payload);
    for (const client of subscribers) {
        if (client.readyState == WebSocket.OPEN) {
            client.send(message);
        }
    }
}

function handleMessage(socket, data) {
    let message;
    try {
        message = JSON.parse(data.toString());
    } catch (error) {
        sendJsonMessage(socket, { type: "error", message: "Invalid Json" });
        return;
    }

    if (message?.type == "subscribe" && Number.isInteger(message.matchId)) {
        subscribe(message.matchId, socket);
        sendJsonMessage(socket, { type: "subscribed", matchId: message.matchId });
        return;
    }

    if (message?.type == "unsubscribe" && Number.isInteger(message.matchId)) {
        unsubscribe(message.matchId, socket);
        socket.subscriptions.delete(message.matchId);
        sendJsonMessage(socket, { type: "unsubscribed", matchId: message.matchId });
        return;
    }
}

export function attachWebsocketServer(server) {
    const wss = new WebSocketServer({
        noServer: true,
        maxPayload: 1024 * 1024,
    });

    server.on("upgrade", async (req, socket, head) => {
        const { pathname } = new URL(req.url, `http://${req.headers.host}`);
        if (pathname !== "/ws") return;
        if (wsArcjet) {
            try {
                const descision = await wsArcjet.protect(req);
                if (descision.isDenied()) {
                    if (descision.reason.isRateLimit()) {
                        socket.write("HTTP/1/1 429 Too Many Request\r\n\r\n");
                    } else {
                        socket.write("HTTP/1/1 403 Forbidden\r\n\r\n");
                    }
                    socket.destroy();
                    return;
                }
            } catch (e) {
                console.error("WS connection error", e);
                socket.write("HTTP/1/1 500 Internal Server Error\r\n\r\n");
                socket.destroy();
                return;
            }
        }

        wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit("connection", ws, req);
        });
    });

    wss.on("connection", async (socket, req) => {
        socket.isAlive = true;
        socket.subscriptions = new Set();

        socket.on("pong", () => {
            socket.isAlive = true;
        });

        sendJsonMessage(socket, { type: "welcome" });

        socket.on("message", (data) => {
            handleMessage(socket, data);
        });

        socket.on("close", () => {
            cleanupSubscriptions(socket);
        });

        socket.on("error", (e) => {
            console.error(e);
            socket.terminate();
        });
    });

    const interval = setInterval(() => {
        for (const client of wss.clients) {
            if (client.isAlive == false) {
                client.terminate();
                continue;
            }
            client.isAlive = false;
            client.ping();
        }
    }, 30000);

    wss.on("close", () => clearInterval(interval));

    function broadcastMatchCreated(match) {
        broadcastMessage(wss, { type: "match_created", data: match });
    }

    function broadcastCommentary(matchId, comment) {
        broadcastCommentaryToSubscribers(matchId, { type: "commentary", data: comment });
    }

    return { broadcastMatchCreated, broadcastCommentary };
}
