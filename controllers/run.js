class Run {
  static async saveRun(req, res) {
    const { driverId, carId, time, gapTime } = req.body;

    try {
      const newRun = await runModel.saveRun(driverId, carId, time, gapTime);
      res.status(201).json({ success: true, run: newRun });
    } catch (error) {
      console.error('Error saving run:', error);
      res.status(500).json({ success: false, message: 'Failed to save run' });
    }
  }

  static async getRuns(req, res) {
    try {
      const runs = await runModel.getRuns();
      res.status(200).json({ success: true, runs });
    } catch (error) {
      console.error('Error fetching runs:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch runs' });
    }
  }
}

module.exports = Run;
