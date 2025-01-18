const pool = require('../config');

const getRuns = async () => {
  const result = await pool.query('SELECT get_nested_runs();');
  console.log(result, '--debug models');
  return result.rows[0].get_nested_runs;
};

const getGroupedRuns = async () => {
  const result = await pool.query('SELECT get_nested_runs();');
  // console.log(result, '--debug models');
  // return result.rows[0].get_nested_runs;
};

module.exports = {
  getRuns
};
