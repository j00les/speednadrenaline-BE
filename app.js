const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const { convertFormattedTimeToRaw } = require('./util');

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    credentials: true
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // ✅ Ensure form data is parsed
app.use(cors());

// MongoDB connection
mongoose
  .connect('mongodb://172.24.140.82:27017/websocket_data', {})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Mongoose Schemas
const runSchema = new mongoose.Schema({
  name: String,
  carName: String,
  runNumber: Number,
  drivetrain: String,
  time: String
});

const leaderboardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  carName: { type: String, required: true },
  drivetrain: { type: String, required: true },
  time: { type: String, required: true }
});

// Mongoose Models
const Run = mongoose.model('Run', runSchema);
const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);

// Add a new run
app.post('/addRun', async (req, res) => {
  const { name, carName, lapTime, carType, driveTrain, time } = req.body;

  try {
    const lastRun = await Run.findOne({ name, carName }).sort({ runNumber: -1 });
    const runNumber = lastRun ? lastRun.runNumber + 1 : 1;

    const newRun = new Run({ name, carName, runNumber, lapTime, carType, driveTrain, time });
    await newRun.save();

    let leaderboardEntry = await Leaderboard.findOne({ name, carName });

    if (!leaderboardEntry || parseInt(lapTime, 10) < parseInt(leaderboardEntry.lapTime, 10)) {
      leaderboardEntry = new Leaderboard({
        name,
        carName,
        runNumber,
        lapTime,
        carType,
        gapToFirst: 0,
        time
      });
      await leaderboardEntry.save();
    }

    // Fetch updated runs grouped by driver
    const runsGrouped = await Run.aggregate([
      { $match: { name } },
      { $group: { _id: { carName: '$carName' }, runs: { $push: '$$ROOT' } } },
      { $project: { _id: 0, carName: '$_id.carName', runs: 1 } }
    ]);

    io.emit('runAdded', { runsGrouped, leaderboardEntry });

    res.status(201).json({ message: 'Run added successfully', runsGrouped });
  } catch (error) {
    res.status(500).json({ message: 'Error adding run', error });
  }
});

// Delete a run

app.delete('/deleteRun', async (req, res) => {
  const { name, carName, time } = req.query; // ✅ Get from query params

  try {
    if (!name || !carName || !time) {
      return res.status(400).json({ message: 'Missing required query parameters' });
    }

    // ✅ Convert formatted time to raw time if necessary
    const rawTime = convertFormattedTimeToRaw(time);

    // ✅ Delete the run from Runs collection
    const deletedRun = await Run.findOneAndDelete({ name, carName, time: rawTime });

    if (!deletedRun) {
      return res.status(404).json({ message: 'Run not found' });
    }

    // ✅ Find the next best run for this driver-car combination
    const nextBestRun = await Run.findOne({ name, carName }).sort({ time: 1 });

    if (nextBestRun) {
      // ✅ Update leaderboard with the next best time
      await Leaderboard.findOneAndUpdate(
        { name, carName },
        { time: nextBestRun.time },
        { new: true }
      );
    } else {
      // 🚨 No runs left, remove from leaderboard
      await Leaderboard.findOneAndDelete({ name, carName });
    }

    // ✅ Fetch updated leaderboard and send WebSocket event
    const updatedLeaderboard = await Leaderboard.find().sort({ time: 1 });
    const runsGrouped = await Run.aggregate([
      { $group: { _id: { name: '$name', carName: '$carName' }, runs: { $push: '$$ROOT' } } },
      { $project: { _id: 0, name: '$_id.name', carName: '$_id.carName', runs: 1 } },
      { $group: { _id: '$name', cars: { $push: { carName: '$carName', runs: '$runs' } } } }
    ]);

    io.emit('runDeleted', { leaderboardEntry: updatedLeaderboard, runsGrouped });

    res.json({ message: 'Run deleted successfully', updatedLeaderboard, runsGrouped });
  } catch (error) {
    console.error('❌ Error deleting run:', error);
    res.status(500).json({ message: 'Error deleting run', error });
  }
});

app.get('/runs', async (req, res) => {
  try {
    const runsGrouped = await Run.aggregate([
      {
        $group: {
          _id: { name: '$name', carName: '$carName', drivetrain: '$drivetrain' },
          runs: { $push: '$$ROOT' }
        }
      },
      {
        $project: {
          _id: 0,
          name: '$_id.name',
          carName: '$_id.carName',
          drivetrain: '$_id.drivetrain',
          runs: {
            $map: {
              input: '$runs',
              as: 'run',
              in: {
                runNumber: '$$run.runNumber',
                lapTime: '$$run.lapTime',
                time: '$$run.time'
              }
            }
          }
        }
      },
      {
        $group: {
          _id: '$name',
          cars: {
            $push: {
              carName: '$carName',
              drivetrain: '$drivetrain',
              runs: '$runs'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          cars: 1
        }
      }
    ]);

    res.json(runsGrouped);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving runs', error });
  }
});

// GET Leaderboard - Fetch current leaderboard data
app.get('/leaderboard', async (req, res) => {
  try {
    // ✅ Fetch leaderboard sorted by best lap time (ascending)
    const leaderboard = await Leaderboard.find().sort({ time: 1 });

    if (leaderboard.length === 0) {
      return res.json([]); // No records
    }

    // ✅ Get the best (fastest) time
    const bestTime = parseInt(leaderboard[0].time, 10);

    // ✅ Calculate `gapToFirst` dynamically for each driver
    const leaderboardWithGaps = leaderboard.map((entry) => ({
      name: entry.name,
      carName: entry.carName,
      drivetrain: entry.drivetrain,
      time: entry.time,
      gapToFirst: Math.max(0, parseInt(entry.time, 10) - bestTime)
    }));

    res.json(leaderboardWithGaps);
  } catch (error) {
    console.error('❌ Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Error fetching leaderboard', error });
  }
});

io.on('connection', (socket) => {
  console.log('🔌 New user connected');

  socket.on('addRun', async (newRun) => {
    try {
      console.log('📡 Received data:', newRun); // ✅ Log the received data

      // ✅ Normalize field names (handle `lapTime` vs `time` differences)
      const lapTime = newRun.lapTime || newRun.time; // Ensure the correct field is used
      const drivetrain = newRun.drivetrain || 'Unknown'; // Default if missing

      // ✅ Validate required fields
      if (!newRun.name || !newRun.carName || !lapTime || !drivetrain) {
        console.error('❌ Missing required fields:', {
          name: newRun.name,
          carName: newRun.carName,
          lapTime,
          drivetrain
        });
        return;
      }

      // ✅ Get last run number for the driver-car combination
      const lastRun = await Run.findOne({ name: newRun.name, carName: newRun.carName }).sort({
        runNumber: -1
      });
      const runNumber = lastRun ? lastRun.runNumber + 1 : 1;

      // ✅ Save the new run in the Runs collection
      const run = new Run({ ...newRun, runNumber });
      await run.save();

      // ✅ Check if this driver-car combination exists in the leaderboard
      let existingEntry = await Leaderboard.findOne({ name: newRun.name, carName: newRun.carName });

      if (!existingEntry || parseInt(lapTime, 10) < parseInt(existingEntry.time, 10)) {
        console.log(
          `✅ Updating leaderboard for ${newRun.name} - ${newRun.carName} with time: ${lapTime}`
        );

        // ✅ Ensure correct data structure for leaderboard
        await Leaderboard.findOneAndUpdate(
          { name: newRun.name, carName: newRun.carName },
          {
            name: newRun.name,
            carName: newRun.carName,
            drivetrain,
            time: lapTime // ✅ Use corrected lap time field
          },
          { upsert: true, new: true }
        );
      } else {
        console.log(
          `⏱ No update - ${newRun.name} - ${newRun.carName} already has a better time: ${existingEntry.time}`
        );
      }

      // ✅ Fetch updated leaderboard sorted by best time
      const updatedLeaderboard = await Leaderboard.find().sort({ time: 1 });

      // ✅ Calculate `gapToFirst`
      if (updatedLeaderboard.length > 0) {
        const firstPlaceTime = parseInt(updatedLeaderboard[0].time, 10); // Get best lap time

        updatedLeaderboard.forEach((entry) => {
          entry.gapToFirst = Math.max(0, parseInt(entry.time, 10) - firstPlaceTime); // Calculate gap
        });
      }

      // ✅ Emit updated leaderboard with `gapToFirst`
      io.emit('runAdded', { leaderboardEntry: updatedLeaderboard });
    } catch (error) {
      console.error('❌ Error adding run:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected');
  });
});

// Start server
const PORT = 3002;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
