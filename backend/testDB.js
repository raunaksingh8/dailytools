require('dotenv').config();

const pool = require('./config/db');

async function testConnection() {
    try {
        const result = await pool.query('SELECT NOW()');

        console.log('✅ Database connected successfully');
        console.log('Database time:', result.rows[0]);

    } catch (error) {
        console.error('❌ Database connection failed');
        console.error(error.message);
    } finally {
        await pool.end();
    }
}

testConnection();