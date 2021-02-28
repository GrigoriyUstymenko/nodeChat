'use strict';

const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');

const index = fs.readFileSync('./index.html', 'utf8');

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end(index);
});

server.listen(8000, () => {
  console.log('Listen port 8000');
});

const ws = new WebSocket.Server({ server });

const rooms = new Map([['Chat', new Set(ws.clients)]]);

const roomClients = (roomName, connection) => {
  if (!rooms.has(roomName)) {
    rooms.set(roomName, new Set([connection]));
  }
  console.log(roomName);
  console.log(rooms);
  console.log(rooms.get(roomName).values());
  return rooms.get(roomName).values();
};

ws.on('connection', (connection, req) => {
  const ip = req.socket.remoteAddress;
  rooms.get('Chat').add(connection);

  console.log(`Connected ${ip}`);

  connection.on('message', message => {
    const data = JSON.parse(message);
    const clients = roomClients(data.roomName, connection);

    console.log(`Received: ${data.value}, room: ${data.roomName}`);


    for (const client of clients) {
      if (client.readyState !== WebSocket.OPEN) continue;
      if (client === connection) continue;
      client.send(data.value);
    }

  });

  connection.on('close', () => {
    rooms.get('Chat').delete(connection);
    console.log(`Disconnected ${ip}`);
  });
});
