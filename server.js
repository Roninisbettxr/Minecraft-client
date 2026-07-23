const WebSocket = require('ws');

// Use Render's dynamic port, or fall back to port 8080 for local testing
const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

// Store connected players and their positions
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

console.log(`Multiplayer server running on port ${PORT}`);
