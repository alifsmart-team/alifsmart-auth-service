class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '', errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational; // Error operasional vs error programming
    this.errors = errors; // Untuk detail error validasi misalnya

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;