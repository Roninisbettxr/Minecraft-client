const http = require('http');
const WebSocket = require('ws');

// Use Render's assigned port, or default to 8080 for local testing
const PORT = process.env.PORT || 8080;

// 1. Create an HTTP server so Render's health check gets a 200 OK response
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Minecraft WebSocket Server is Running!');
});

// 2. Attach WebSocket server to the HTTP server on the same port
const wss = new WebSocket.Server({ server });

const players = {};

wss.on('connection', (ws) => {
    // Generate a unique ID for each connected player
    const id = Math.random().toString(36).substring(2, 9);
    
    // Set starting player position
    players[id] = { x: 0, y: 10, z: 0 };

    // Send the player their ID and current active players
    ws.send(JSON.stringify({
        type: 'init',
        id: id,
        players: players
    }));

    // Listen for incoming player messages
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            if (data.type === 'move') {
                players[id] = { x: data.x, y: data.y, z: data.z };
                
                // Broadcast player movement to everyone else
                broadcast({
                    type: 'playerMoved',
                    id: id,
                    position: players[id]
                }, ws);
            }
        } catch (err) {
            console.error("Failed to parse message:", err);
        }
    });

    // Handle player disconnects
    ws.on('close', () => {
        delete players[id];
        broadcast({
            type: 'playerDisconnected',
            id: id
        });
    });
});

// Helper function to send messages to all connected clients
function broadcast(data, excludeWs = null) {
    const message = JSON.stringify(data);
    wss.clients.forEach((client) => {
        if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Start listening
server.listen(PORT, () => {
    console.log(`Multiplayer server running on port ${PORT}`);
});
