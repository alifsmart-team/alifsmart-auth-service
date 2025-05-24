import httpStatus from 'http-status';
import config from '../config/index.js';
import ApiError from '../utils/apiError.js';

// eslint-disable-next-line no-unused-vars
const globalErrorHandler = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || error.status || httpStatus.INTERNAL_SERVER_ERROR;
    const message = error.message || httpStatus[statusCode];
    error = new ApiError(statusCode, message, false, error.stack);
  }

  const response = {
    status: error.status,
    message: error.message,
    ...(config.nodeEnv === 'development' && { stack: error.stack }),
    ...(error.errors && { errors: error.errors }), // Untuk error validasi dari express-validator misalnya
  };

  if (config.nodeEnv === 'development') {
    console.error('ERROR 💥', error);
  } else {
    // Untuk error operasional yang dikenal di produksi, kita kirim pesan yang aman
    if (!error.isOperational) {
      // Log error yang tidak dikenal
      console.error('PROGRAMMING OR OTHER UNKNOWN ERROR 💥', error);
      // Kirim response generik
      response.message = 'Something went very wrong!';
    }
  }

  res.status(error.statusCode).json(response);
};

export { globalErrorHandler };