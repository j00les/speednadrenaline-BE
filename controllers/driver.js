const { driverModel } = require('../models');

class Driver {
  static async getRuns(req, res) {
    try {
      const nestedRuns = await driverModel.getRuns();

      res.status(200).json(nestedRuns);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching data');
    }
  }
}

module.exports = Driver;
