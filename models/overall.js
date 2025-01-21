const mongoose = require('mongoose');

const OverallSchema = new mongoose.Schema(
  {
    savedAt: { type: Date, default: Date.now }
  },
  { strict: false } // Allow saving deeply nested, dynamic structures
);

const Overall = mongoose.model('Overall', OverallSchema);

module.exports = Overall;
