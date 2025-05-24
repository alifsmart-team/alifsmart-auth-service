// src/config/db.js
import pkg from 'pg';
const { Pool } = pkg; // Mengimpor Pool dari pg
import config from './index.js';

const pool = new Pool({ // Mendefinisikan konstanta 'pool'
  user: config.db.user,
  host: config.db.host,
  database: config.db.name,
  password: config.db.password,
  port: config.db.port,
  ssl: config.nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('PostgreSQL client connected for initial check.');
    // ... (kode pembuatan tabel) ...
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id UUID PRIMARY KEY,
        username VARCHAR(50) UNIQUE,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'teacher', 'student', 'parent')),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        log_id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
        action_type VARCHAR(100) NOT NULL,
        ip_address VARCHAR(50),
        details JSONB,
        timestamp TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE OR REPLACE FUNCTION trigger_set_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_users') THEN
          CREATE TRIGGER set_timestamp_users
          BEFORE UPDATE ON users
          FOR EACH ROW
          EXECUTE FUNCTION trigger_set_timestamp();
        END IF;
      END
      $$;
    `);
    console.log('Tables ensured/checked successfully.');
    client.release();
  } catch (error) {
    console.error('Error connecting to PostgreSQL or ensuring tables:', error.stack);
    throw error;
  }
};

// Pastikan Anda mengekspor 'pool' dan 'connectDB' seperti ini:
export { pool, connectDB }; // <-- BAGIAN PENTING UNTUK EKSPOR