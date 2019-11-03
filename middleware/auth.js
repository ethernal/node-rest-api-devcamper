const jwt = require(`jsonwebtoken`);
const asyncHandler = require(`./async`);
const ErrorResponse = require("../utils/errorResponse");
const User = require("../models/User");

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    // Set token from Headers
    token = req.headers.authorization.replace("Bearer ", "");
  }
  // Set token from Cookie
  else if (req.cookies.token) {
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    return next(
      new ErrorResponse(
        "Not authorized to access this route. Token was not provided.",
        401
      )
    );
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    console.log(decoded);
    // logged in user
    req.user = await User.findById(decoded.id);
    next();
  } catch (err) {
    return next(
      new ErrorResponse(
        "Cannot verify token. Not authorized to this route",
        401
      )
    );
  }
});

// Grant access to specific roles

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role ${
            req.user.role
          } is not authorized to access this route. Role of: ${roles.map(
            role => `${role} `
          )}is required.`,
          403
        )
      );
    }
    next();
  };
};
