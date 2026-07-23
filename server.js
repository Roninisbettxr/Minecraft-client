const WebSocket = require('ws');

// Create a WebSocket server listening on port 8080
const wss = new WebSocket.Server({ port: 8080 });

const players = {};

wss.on('connection', (ws) => {
    // Generate a unique ID for each connected player
    const id = Math.random().toString(36).substring(2, 9);
    
    // Set starting player position
    players[id] = { x: 0, y: 10, z: 0 };

    // Send the current player ID and existing players list to the new connection
    ws.send(JSON.stringify({
        type: 'init',
        id: id,
        players: players
    }));

    // Listen for movement/actions from the client
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            if (data.type === 'move') {
                players[id] = { x: data.x, y: data.y, z: data.z };
                
                // Send player's new position to all other connected clients
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

    // Handle player disconnect
    ws.on('close', () => {
        delete players[id];
        broadcast({
            type: 'playerDisconnected',
            id: id
        });
    });
});

function broadcast(data, excludeWs = null) {
    const message = JSON.stringify(data);
    wss.clients.forEach((client) => {
        if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

console.log('Multiplayer WebSocket server running on ws://localhost:8080');