const WebSocket = require("ws");
const http = require("http");
const config = require("../shared/config");
const wss = new WebSocket.Server({ noServer: true });
const setupWSConnection = require("y-websocket/bin/utils").setupWSConnection;

// Get service configuration
const serviceConfig = config.getServiceConfig("collaboration");

const server = http.createServer((request, response) => {
    response.writeHead(200, { "Content-Type": "text/plain" });
    response.end("Collaboration Service is running");
});

wss.on("connection", (conn, req) => {
    setupWSConnection(conn, req, { gc: true });
});

server.on("upgrade", (request, socket, head) => {
    // Check CORS for WebSocket upgrade
    const origin = request.headers.origin;
    const allowedOrigins = serviceConfig.websocket.cors.origin;

    if (allowedOrigins.includes(origin) || !origin) {
        const handleAuth = ws => {
            wss.emit("connection", ws, request);
        };
        wss.handleUpgrade(request, socket, head, handleAuth);
    } else {
        socket.destroy();
        console.log(`WebSocket CORS rejection for origin: ${origin}`);
    }
});

server.listen(serviceConfig.port, () => {
    console.log(`Collaboration service running on port ${serviceConfig.port}`);
    console.log(`🔗 WebSocket endpoint: ws://localhost:${serviceConfig.port}`);
    console.log(`🌐 CORS origins: ${serviceConfig.websocket.cors.origin.join(", ")}`);
});
