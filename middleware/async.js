const asyncHandler = fn => (req, res, next) => {
  // Flattens the promise of (FN) and resolves the given function
  // surrounded with a catch block so all errors in async functions
  // are passed to Express
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
