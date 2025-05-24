import http from 'http';
import app from './app.js'; // Pastikan app.js ada di root dan berisi konfigurasi Express
import config from './src/config/index.js';
import { connectDB, pool } from './src/config/db.js';

const PORT = config.port || 3001;
const server = http.createServer(app);

const startServer = async () => {
  try {
    await connectDB(); // Test koneksi awal dan buat tabel jika belum ada
    console.log('PostgreSQL connected successfully and tables ensured.');

    server.listen(PORT, () => {
      console.log(`Auth Service running on port ${PORT} in ${config.nodeEnv} mode.`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    console.error(error.stack); // Tampilkan stack trace untuk debug
    process.exit(1);
  }
};

// Graceful Shutdown
const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      await pool.end();
      console.log('PostgreSQL pool has ended.');
      process.exit(0);
    } catch (err) {
      console.error('Error during pool shutdown', err);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT')); // Menangani Ctrl+C

// Panggil fungsi untuk memulai server
startServer();