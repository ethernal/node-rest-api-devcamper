const ErrorResponse = require("../utils/errorResponse");

const errorHandler = (err, req, res, next) => {
  let error = { ...err };

  // Log for dev
  console.error(`Error name: ${err.name}`.red.inverse);
  console.error(`Error: ${err.message}`.red.inverse);
  console.error(error);

  // Mongoose bad ObjectId
  if (err.name === `CastError`) {
    const message = `Resource '${error.path}' not found with '${error.kind}' of '${err.value}'`;
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (error.code === 11000) {
    const message = `Duplicate field value entered. More info: ${error.errmsg}`;
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error

  if (error.name === "ValidationError") {
    const message = Object.values(err.errors).map(
      val => ` ${val.message.toLowerCase()}`
    );
    error = new ErrorResponse(message, 400);
  }

  if (error.name === "HttpError" && error.code === "EAI_AGAIN") {
    const message = `Proxy error. Cannot connect to the host. ${error.message}`;
    error = new ErrorResponse(message, 500);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || `Server Error returned no message`,
  });
};

module.exports = errorHandler;
