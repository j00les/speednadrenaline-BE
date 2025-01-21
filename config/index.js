require('dotenv').config();

module.exports = {
  mongodb: {
    server: '88.223.95.166', // Your MongoDB VPS IP
    port: 27017, // MongoDB port
    admin: true, // Enable MongoDB admin access
    auth: [
      {
        database: 'admin', // Auth database
        username: 'nabiel', // Your MongoDB username
        password: 'nabielmongo20' // Your MongoDB password
      }
    ]
  },
  site: {
    baseUrl: '/', // Base URL for Mongo Express
    cookieSecret: 'your-secret', // Random string for cookie encryption
    sessionSecret: 'your-secret' // Random string for session encryption
  },
  options: {
    console: true, // Enable console logs
    documentsPerPage: 10, // Documents per page in collections
    readOnly: false // Enable/disable write operations
  }
};
