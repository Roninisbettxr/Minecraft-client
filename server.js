const WebSocket = require('ws');
const mc = require('node-minecraft-protocol');

const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

console.log(`WebSocket-to-Minecraft proxy running on port ${PORT}`);

wss.on('connection', (ws) => {
  console.log('HTML Client connected to proxy!');

  // Connect the proxy to your Aternos server
  const client = mc.createClient({
    host: 'RSGSserver.aternos.me',
    port: 37773,
    username: 'WebPlayer',
    version: '1.8.9' // Match your Aternos version
  });

  // Forward packets from Aternos back to your Web Browser
  client.on('packet', (data, packetMeta) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ meta: packetMeta, data: data }));
    }
  });

  // Handle messages sent from HTML client
  ws.on('message', (message) => {
    try {
      const packet = JSON.parse(message);
      if (packet.name && packet.params) {
        client.write(packet.name, packet.params);
      }
    } catch (e) {
      console.error('Invalid packet format from browser client:', e);
    }
  });

  ws.on('close', () => client.end());
  client.on('end', () => ws.close());
  client.on('error', (err) => console.error('Aternos connection error:', err));
});
