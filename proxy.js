const mc = require('node-minecraft-protocol');
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Browser connected to local proxy');

  // Create a client connection to Hypixel
  const client = mc.createClient({
    host: 'mc.hypixel.net',
    port: 25565,
    username: 'your_email@example.com', // Requires valid Microsoft login
    auth: 'microsoft'
  });

  // Forward packets from Hypixel to the Browser
  client.on('packet', (data, metadata) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ metadata, data }));
    }
  });

  // Forward input from Browser to Hypixel
  ws.on('message', (message) => {
    const { name, params } = JSON.parse(message);
    client.write(name, params);
  });
});