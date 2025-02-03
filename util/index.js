const formatLapTime = (milliseconds) => {
  if (!milliseconds || isNaN(milliseconds)) return '00:00.000';

  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const ms = milliseconds % 1000;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(
    ms
  ).padStart(3, '0')}`;
};

const formatGapToFirstPlace = (gapMilliseconds) => {
  if (!gapMilliseconds || isNaN(gapMilliseconds)) return '00.00';

  const seconds = (gapMilliseconds / 1000).toFixed(2);
  return seconds.padStart(5, '0'); // Ensures "02.88" format
};

const convertFormattedTimeToRaw = (formattedTime) => {
  const [minutes, seconds, milliseconds] = formattedTime.split(/[:.]/);
  const totalMilliseconds =
    parseInt(minutes, 10) * 60000 + parseInt(seconds, 10) * 1000 + parseInt(milliseconds, 10);
  return totalMilliseconds.toString().padStart(7, '0'); // Ensure proper formatting
};

module.exports = { formatLapTime, formatGapToFirstPlace, convertFormattedTimeToRaw };
