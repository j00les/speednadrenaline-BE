const convertFormattedTimeToRaw = (formattedTime) => {
  const [minutes, seconds, milliseconds] = formattedTime.split(/[:.]/);
  const totalMilliseconds =
    parseInt(minutes, 10) * 60000 + parseInt(seconds, 10) * 1000 + parseInt(milliseconds, 10);
  return totalMilliseconds.toString().padStart(7, '0'); // Ensure proper formatting
};

const parseLapTime = (rawTime) => {
  const rawTimeString = String(rawTime).padStart(7, '0'); // Ensure consistent 7-character string
  const minutes = parseInt(rawTimeString.slice(0, 2), 10); // First 2 characters for minutes
  const seconds = parseInt(rawTimeString.slice(2, 4), 10); // Next 2 characters for seconds
  const milliseconds = parseInt(rawTimeString.slice(4, 7), 10); // Last 3 characters for milliseconds

  if (seconds >= 60 || milliseconds >= 1000) {
    throw new Error(`Invalid lap time: ${rawTime}`);
  }

  const result = minutes * 60000 + seconds * 1000 + milliseconds;

  return result;
};

// ✅ Corrected Function for Formatting Gaps (no unnecessary padding)
const formatGapToFirstPlace = (gapMilliseconds) => {
  if (!gapMilliseconds || isNaN(gapMilliseconds)) return '00.00';

  const seconds = (gapMilliseconds / 1000).toFixed(2);
  return seconds.padStart(5, '0'); // Ensures "02.88" format
};

const formatLapTime = (totalMilliseconds) => {
  const timeMs = parseInt(totalMilliseconds, 10); // Ensure it's a number
  if (isNaN(timeMs) || timeMs < 0) return '00:00.000'; // Handle invalid cases

  const minutes = Math.floor(timeMs / 60000);
  const seconds = Math.floor((timeMs % 60000) / 1000);
  const milliseconds = timeMs % 1000;

  // Ensure milliseconds are **always** three digits (e.g., "003", "120", "999")
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(
    milliseconds
  ).padStart(3, '0')}`;
};

module.exports = { formatLapTime, formatGapToFirstPlace, convertFormattedTimeToRaw, parseLapTime };
