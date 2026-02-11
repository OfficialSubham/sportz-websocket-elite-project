import { WebSocket, WebSocketServer } from "ws";

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

export function attachWebsocketServer(server) {
    const wss = new WebSocketServer({ server, path: "/ws", maxPayload: 1024 * 1024 });

    wss.on("connection", (socket) => {
        socket.isAlive = true;

        socket.on("pong", () => {
            socket.isAlive = true;
        });

        sendJsonMessage(socket, { type: "welcome" });

        socket.on("error", console.error);
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

    return { broadcastMatchCreated };
}
