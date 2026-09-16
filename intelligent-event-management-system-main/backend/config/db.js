const mysql = require('mysql2/promise')

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'event_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}

let pool = null

async function getConnection() {
  if (pool) return pool

  try {
    pool = mysql.createPool(dbConfig)
    await pool.query('SELECT 1')
    console.log('MySQL connection ready')
    return pool
  } catch (error) {
    console.warn('MySQL unavailable, running fallback in-memory mode:', error.message)
    return null
  }
}

module.exports = { getConnection, dbConfig }
