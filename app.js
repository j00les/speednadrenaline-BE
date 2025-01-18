const express = require('express');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;
const cors = require('cors');

const { driverRoutes, runRoutes } = require('./routes');
const { saveRun } = require('./models/run');

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/api/drivers', driverRoutes);
app.use('/api/runs', runRoutes);

const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

const wss = new WebSocket.Server({ server });

let clients = [];

function broadcast(data) {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

wss.on('connection', (ws) => {
  console.log('New client connected');
  clients.push(ws);

  ws.on('message', (message) => {
    const data = JSON.parse(message.toString('utf8'));
    console.log('Received data:', data);

    // const { carName, lapTime, driverName, carType, gapTime } = data;

    // saveRun(data);

    broadcast(data);
  });

  ws.on('close', () => {
    clients = clients.filter((client) => client !== ws);
  });
});
