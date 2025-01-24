// db.js
require('dotenv').config();
const sql = require('mssql'); // SQL Server library

// SQL Server connection configuration
const sqlConfig = {
    user: process.env.DB_USER,          // Your SQL Server username
    password: process.env.DB_PASSWORD,  // Your SQL Server password
    database: process.env.DB_NAME,      // Your database name
    server: process.env.DB_SERVER,      // Your server name or IP
    port: 1433, // Explicitly set port if needed

    options: {
        encrypt: false,  // Use encrypt for production
        trustServerCertificate: true    // Set to false in production if using a valid SSL cert
    }
};

// Initialize connection pool
let pool;
async function connectToDatabase() {
    try {
        pool = await sql.connect(sqlConfig);
        console.log("Connected to SQL Server");
    } catch (err) {
        console.error('Error connecting to SQL Server:', err.message);
        process.exit(1);  // Exit the application if connection fails
    }
}

// Expose the connection and the query method
function getPool() {
    return pool;
}

module.exports = { connectToDatabase, getPool };
