const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next => {
    const error = next;
    if (error.name === `HttpError` && error.code === `EAI_AGAIN`) {
      console.warn(`Could not connect to GeoCoder Provider.`.yellow.inverse);
    } else {
      throw error;
    }
  });

module.exports = asyncHandler;
