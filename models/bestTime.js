const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  carName: { type: String, required: true },
  lapTime: { type: String, required: true },
  gapToFirst: { type: String, required: true }
});

const BestTimeSchema = new mongoose.Schema(
  {
    drivers: [DriverSchema], // Array of driver objects
    savedAt: { type: Date, default: Date.now } // Timestamp
  },

  { collection: 'best_times' } // Explicitly set the collection name
);

const BestTime = mongoose.model('BestTime', BestTimeSchema);

module.exports = BestTime;
