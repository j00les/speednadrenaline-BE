const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  carName: { type: String, required: true },
  carType: { type: String, required: true },
  lapTime: { type: String, required: true },
  gapToFirst: { type: String, required: true }
});

const BestTimeSchema = new mongoose.Schema(
  {
    drivers: [DriverSchema],
    savedAt: { type: Date, default: Date.now }
  },

  { collection: 'best_times' }
);

const BestTime = mongoose.model('BestTime', BestTimeSchema);

module.exports = BestTime;
