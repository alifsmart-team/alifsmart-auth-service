// Utility untuk menghindari try-catch block di setiap async route handler
const asyncHandler = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next); // Error akan dilempar ke global error handler
  };
};

export default asyncHandler;