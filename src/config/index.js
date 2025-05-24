import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Since __dirname is not available in ES modules, we define it this way.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') }); // Muat .env dari root

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3001,
  db: {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
  // defaultAdmin: {
  //   email: process.env.DEFAULT_ADMIN_EMAIL,
  //   password: process.env.DEFAULT_ADMIN_PASSWORD,
  // }
};

export default config;