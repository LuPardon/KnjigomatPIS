const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
dotenv.config();

// Kreiranje konekcije na bazu podataka
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = db;
// Koristi se konfiguracija iz .env datoteke da se poveže na MySQL bazu.
