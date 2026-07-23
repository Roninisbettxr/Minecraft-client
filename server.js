wss.on('connection', (ws) => {
  let bot = null;

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    // When the web page sends a 'join' command with the chosen username
    if (data.type === 'join') {
      bot = mineflayer.createBot({
        host: 'RSGSserver.aternos.me',
        port: 37773,
        username: data.username || 'User', // Uses the name sent from HTML, or defaults to 'User'
        auth: 'offline',
        version: '1.20.1'
      });

      bot.on('login', () => {
        console.log(`${bot.username} connected to Aternos!`);
      });

      bot.on('chat', (username, msg) => {
        if (username === bot.username) return;
        ws.send(JSON.stringify({ type: 'chat', username, message: msg }));
      });
    }
  });
});
