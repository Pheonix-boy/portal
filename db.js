// db.js
const mysql = require('mysql2');

// Create a connection pool (better for multi-user performance)
const pool = mysql.createPool({
    host: 'localhost',       // your MySQL host
    user: 'root',            // MySQL username
    password: 'Student_server',            // your MySQL password
    database: 'myapp',       // the database you created
    waitForConnections: true,
    connectionLimit: 10,     // max concurrent connections
    queueLimit: 0
});

module.exports = pool.promise(); // export promise-based pool