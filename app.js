const express = require('express');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;
const cors = require('cors');

const mongoose = require('mongoose');
const { Overall, BestTime } = require('./models');

mongoose.connect('mongodb://nabiel:nabielmongo20@88.223.95.166:27017/speed_n_adrenaline');

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// app.use('/api/drivers', driverRoutes);
// app.use('/api/runs', runRoutes);

app.post('/api-save-overall', async (req, res) => {
  try {
    // Extract the first object from the array (if needed)
    const [runsByDriverStore] = req.body;

    // Add a savedAt timestamp
    const dataToSave = {
      ...runsByDriverStore,
      savedAt: new Date()
    };

    // Save the deeply nested document as a single entry in the database
    const result = await Overall.create(dataToSave);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to save data' });
  }
});

// Insert data into the `best_time` collection
app.post('/api-save-best-time', async (req, res) => {
  try {
    // Flatten the nested array structure
    const flattenedData = req.body.flat();

    // Map the data to exclude `id` and add `savedAt`
    const bestTimesData = {
      drivers: flattenedData.map(({ id, ...rest }) => ({
        ...rest // Include all other fields
      })),
      savedAt: new Date() // Add the current timestamp explicitly
    };

    // Save the single document into the database
    const result = await BestTime.create(bestTimesData);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to save data' });
  }
});

app.get('/api-get-overall', async (req, res) => {
  try {
    const overallData = await Overall.find({});

    const getTransformedData = (rawData) => {
      const from = rawData.find((item) =>
        Object.keys(item).some(
          (key) =>
            !['_id', '__v', 'savedAt', '$__', '$isNew', '_doc'].includes(key) &&
            typeof item[key] === 'object'
        )
      );

      if (!from) {
        return [];
      }

      return Object.entries(from || {})
        .filter(([key]) => !['_id', '__v', 'savedAt', '$__', '$isNew', '_doc'].includes(key))
        .map(([driverName, cars]) => ({
          driverName,
          cars: Object.entries(cars).map(([carName, lapTimes]) => ({
            carName,
            lapTimes
          }))
        }));
    };

    const transformedData = getTransformedData(overallData);

    res.status(200).json({ success: true, data: transformedData });
  } catch (error) {
    console.error('Error fetching and transforming overall data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch overall data' });
  }
});

app.get('/api-get-best-time', async (req, res) => {
  try {
    const bestTimeData = await BestTime.find({});

    console.log(bestTimeData, '--debug');
    res.status(200).json({ success: true, bestTimeData });
  } catch (error) {
    console.error('Error fetching and transforming overall data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch overall data' });
  }
});

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

    broadcast(data);
  });

  ws.on('close', () => {
    clients = clients.filter((client) => client !== ws);
  });
});
