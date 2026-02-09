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
        sendJsonMessage(socket, { type: "welcome" });

        socket.on("error", console.error);
    });

    function broadcastMatchCreated(match) {
        broadcastMessage(wss, { type: "match_created", data: match });
    }

    return { broadcastMatchCreated };
}
