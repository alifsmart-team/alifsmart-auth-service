// alifsmart-auth-service/app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './src/config/index.js';         // Pastikan file ini ada dan benar
import rootRouter from './src/routes/index.js';     // Pastikan file ini ada dan benar
import { globalErrorHandler } from './src/middlewares/errorMiddleware.js'; // Pastikan file ini ada dan benar
import ApiError from './src/utils/apiError.js';     // Pastikan file ini ada dan benar
import httpStatus from 'http-status';

const app = express();

// Middlewares
app.use(helmet()); // Set security HTTP headers
app.use(cors()); // Enable CORS
app.options('*', cors()); // Enable pre-flight requests for all routes

app.use(express.json({ limit: '10kb' })); // Body parser, reading data from body into req.body
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // Parse URL-encoded bodies

if (config.nodeEnv === 'development') {
  app.use(morgan('dev')); // HTTP request logger middleware
}

// API Routes
// Pastikan rootRouter mengekspor router Express dengan benar
app.use('/api/v1/auth', rootRouter);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Auth service is healthy' });
});


// Handle 404 Not Found for any unhandled routes
app.all('*', (req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, `Can't find ${req.originalUrl} on this server!`));
});

// Global error handling middleware
// Pastikan globalErrorHandler adalah fungsi middleware yang valid
app.use(globalErrorHandler);

export default app; // Ini yang paling penting untuk server.js