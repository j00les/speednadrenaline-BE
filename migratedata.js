// require('dotenv').config();
// const mongoose = require('mongoose');

// // ✅ Source Database (best_time collection)
// const SOURCE_DB_URI = 'mongodb://nabiel:nabielmongo20@88.223.95.166:27017/speed_n_adrenaline';

// // ✅ Destination Database (leaderboardHistory collection)
// const DEST_DB_URI = 'mongodb://172.24.140.82:27017/websocket_data';

// // ✅ Define Schema for best_time (SOURCE)
// const sourceConnection = mongoose.createConnection(SOURCE_DB_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// });
// const BestTimeSchema = new mongoose.Schema({
//   drivers: [
//     {
//       name: String,
//       carName: String,
//       carType: String, // Will be renamed to drivetrain
//       lapTime: String, // Will be renamed to time
//       gapToFirst: String
//     }
//   ],
//   savedAt: Date // ✅ Preserve original saved timestamp
// });
// const BestTime = sourceConnection.model('best_times', BestTimeSchema, 'best_times'); // Assuming collection is `best_times`

// // ✅ Define Schema for leaderboardHistory (DESTINATION)
// const destConnection = mongoose.createConnection(DEST_DB_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// });
// const LeaderboardHistorySchema = new mongoose.Schema({
//   timestamp: Date, // ✅ Ensure correct timestamp field
//   leaderboard: [
//     {
//       name: String,
//       carName: String,
//       drivetrain: String, // Renamed from carType
//       time: String, // Renamed from lapTime
//       gapToFirst: String
//     }
//   ]
// });
// const LeaderboardHistory = destConnection.model(
//   'leaderboardhistories',
//   LeaderboardHistorySchema,
//   'leaderboardhistories'
// );

// // ✅ Utility Functions for Formatting
// const parseLapTime = (rawTime) => {
//   const rawTimeString = String(rawTime).padStart(7, '0'); // Ensure consistent 7-character string
//   const minutes = parseInt(rawTimeString.slice(0, 2), 10); // First 2 characters for minutes
//   const seconds = parseInt(rawTimeString.slice(2, 4), 10); // Next 2 characters for seconds
//   const milliseconds = parseInt(rawTimeString.slice(4, 7), 10); // Last 3 characters for milliseconds

//   if (seconds >= 60 || milliseconds >= 1000) {
//     throw new Error(`❌ Invalid lap time format: ${rawTime}`);
//   }

//   return minutes * 60000 + seconds * 1000 + milliseconds;
// };

// const formatGapToFirstPlace = (gapMilliseconds) => {
//   if (!gapMilliseconds || isNaN(gapMilliseconds)) return '00.00';

//   const seconds = (gapMilliseconds / 1000).toFixed(2);
//   return seconds.padStart(5, '0'); // Ensures "02.88" format
// };

// const formatLapTime = (totalMilliseconds) => {
//   const timeMs = parseInt(totalMilliseconds, 10); // Ensure it's a number
//   if (isNaN(timeMs) || timeMs < 0) return '00:00.000'; // Handle invalid cases

//   const minutes = Math.floor(timeMs / 60000);
//   const seconds = Math.floor((timeMs % 60000) / 1000);
//   const milliseconds = timeMs % 1000;

//   return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(
//     milliseconds
//   ).padStart(3, '0')}`;
// };

// async function migrateData() {
//   try {
//     console.log('⏳ Fetching data from best_time collection...');

//     // ✅ Fetch all data from best_time collection
//     const bestTimes = await BestTime.find({});

//     if (!bestTimes || bestTimes.length === 0) {
//       console.log('🚨 No data found in best_time collection.');
//       return;
//     }

//     console.log(`✅ Found ${bestTimes.length} records. Preparing for migration...`);

//     // ✅ Transform data: Rename fields (lapTime -> time, carType -> drivetrain), Preserve savedAt
//     const groupedByTimestamp = {};

//     bestTimes.forEach((record) => {
//       const timestamp = record.savedAt ? record.savedAt.toISOString() : new Date().toISOString(); // ✅ Preserve original timestamp

//       console.log('📌 Processing Record:', record);

//       // ✅ Ensure a structure exists for this timestamp
//       if (!groupedByTimestamp[timestamp]) {
//         groupedByTimestamp[timestamp] = {
//           timestamp: new Date(timestamp), // ✅ Store original time
//           leaderboard: []
//         };
//       }

//       // ✅ Check if `drivers` exists before iterating
//       if (Array.isArray(record.drivers) && record.drivers.length > 0) {
//         record.drivers.forEach((entry) => {
//           console.log('🔹 Processing Driver:', entry); // Debugging log

//           try {
//             const parsedTimeMs = parseLapTime(entry.lapTime); // ✅ Convert lapTime to milliseconds
//             const formattedTime = formatLapTime(parsedTimeMs); // ✅ Convert back to formatted string
//             const formattedGap = formatGapToFirstPlace(parseInt(entry.gapToFirst, 10) || 0); // ✅ Format gap correctly

//             groupedByTimestamp[timestamp].leaderboard.push({
//               name: entry.name,
//               carName: entry.carName,
//               drivetrain: entry.carType || 'Unknown', // ✅ Rename correctly
//               time: formattedTime, // ✅ Correctly formatted time
//               gapToFirst: formattedGap // ✅ Correctly formatted gap
//             });
//           } catch (error) {
//             console.error(`❌ Error processing driver ${entry.name}:`, error);
//           }
//         });
//       }
//     });

//     // ✅ Insert transformed data into leaderboardHistory collection
//     const bulkInsert = Object.values(groupedByTimestamp);

//     await LeaderboardHistory.insertMany(bulkInsert);

//     console.log('🎉 Migration complete! Data inserted into leaderboardHistory collection.');
//   } catch (error) {
//     console.error('❌ Migration failed:', error);
//   } finally {
//     sourceConnection.close();
//     destConnection.close();
//   }
// }

// // ✅ Run migration function
// migrateData();

const mongoose = require('mongoose');

// ✅ Source & Destination DB URIs
const SOURCE_DB_URI = 'mongodb://nabiel:nabielmongo20@88.223.95.166:27017/speed_n_adrenaline';
const DEST_DB_URI = 'mongodb://172.24.140.82:27017/websocket_data';

// ✅ Define Source Schema (Overalls)
const overallSchema = new mongoose.Schema({}, { strict: false });
const Overall = mongoose.model('Overall', overallSchema, 'overalls');

// ✅ Define Destination Schema (RunHistories)
const runHistoriesSchema = new mongoose.Schema({
  runsByDriver: [
    {
      name: String,
      cars: [
        {
          carName: String,
          drivetrain: String,
          runs: [
            {
              runNumber: Number,
              time: String,
              _id: mongoose.Schema.Types.ObjectId
            }
          ],
          _id: mongoose.Schema.Types.ObjectId
        }
      ],
      _id: mongoose.Schema.Types.ObjectId
    }
  ],
  timestamp: Date, // ✅ Preserve `savedAt` date here
  __v: Number
});

const RunHistory = mongoose.model('RunHistory', runHistoriesSchema, 'runhistories');

async function migrateData() {
  try {
    // ✅ Connect to Source Database
    const sourceConnection = await mongoose
      .createConnection(SOURCE_DB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      })
      .asPromise();

    // ✅ Connect to Destination Database
    const destConnection = await mongoose
      .createConnection(DEST_DB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      })
      .asPromise();

    console.log('✅ Connected to both databases.');

    const OverallModel = sourceConnection.model('Overall', overallSchema, 'overalls');
    const RunHistoryModel = destConnection.model('RunHistory', runHistoriesSchema, 'runhistories');

    console.log('📡 Fetching data from overalls collection...');
    const overallDocs = await OverallModel.find({});

    let migratedData = overallDocs.map((doc) => {
      let runsByDriver = [];
      let savedAt = doc.savedAt ? new Date(doc.savedAt) : new Date(); // ✅ Keep `savedAt`

      for (const driver in doc._doc) {
        if (['_id', 'savedAt', '__v'].includes(driver)) continue; // Skip metadata fields

        let cars = [];
        for (const car in doc[driver]) {
          let runs = doc[driver][car].map((run) => ({
            runNumber: run.runNumber,
            time: run.lapTime,
            _id: new mongoose.Types.ObjectId()
          }));

          cars.push({
            carName: car,
            drivetrain: doc[driver][car][0].carType,
            runs: runs,
            _id: new mongoose.Types.ObjectId()
          });
        }

        runsByDriver.push({
          name: driver,
          cars: cars,
          _id: new mongoose.Types.ObjectId()
        });
      }

      return {
        runsByDriver: runsByDriver,
        timestamp: savedAt, // ✅ Keep original `savedAt`
        _id: new mongoose.Types.ObjectId(),
        __v: 0
      };
    });

    console.log('📤 Inserting data into runhistories collection...');
    await RunHistoryModel.insertMany(migratedData);

    console.log('✅ Data migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateData();
