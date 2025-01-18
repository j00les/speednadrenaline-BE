const pool = require('../config');

const saveRun = async (data) => {
  const { driverName, carName, carType, lapTime, gapTime } = data;

  try {
    const driverResult = await pool.query(
      `INSERT INTO Drivers (name)
       VALUES ($1)
       ON CONFLICT (name) DO NOTHING
       RETURNING id`,
      [driverName]
    );

    const driverId =
      driverResult.rows[0]?.id ||
      (await pool.query('SELECT id FROM Drivers WHERE name = $1', [driverName])).rows[0].id;

    const carResult = await pool.query(
      `INSERT INTO Cars (name, drive_train)
       VALUES ($1, $2)
       ON CONFLICT (name) DO NOTHING
       RETURNING id`,
      [carName, carType]
    );

    const carId =
      carResult.rows[0]?.id ||
      (await pool.query('SELECT id FROM Cars WHERE name = $1', [carName])).rows[0].id;

    const query = `
      INSERT INTO Runs (driver_id, car_id, time, gap_time)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    const values = [driverId, carId, parseFloat(lapTime), parseFloat(gapTime)];
    const result = await pool.query(query, values);

    return result.rows[0];
  } catch (error) {
    console.error('Error saving run:', error);
    throw error;
  }
};

// Get all runs with driver and car details
const getRuns = async () => {
  const query = `
    SELECT 
        r.id AS run_id,
        d.name AS driver_name,
        c.name AS car_name,
        r.time,
        r.gap_time
    FROM 
        Runs r
    JOIN Drivers d ON r.driver_id = d.id
    JOIN Cars c ON r.car_id = c.id
    ORDER BY r.time ASC;
  `;
  const result = await pool.query(query);
  return result.rows;
};

module.exports = {
  saveRun,
  getRuns
};
