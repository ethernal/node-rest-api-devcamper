const crypto = require("crypto");
const asyncHandler = require(`../middleware/async`);
const ErrorResponse = require(`../utils/errorResponse`);
const User = require(`../models/User`);
const sendEmail = require("../utils/sendEmail");

// @desc        Register new user
// @route       POST /api/v1/auth/register
// @access      Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role,
  });

  // Create token
  const token = user.getSignedToken();

  res.status(200).json({
    success: true,
    message: `User ${user.name} registered`,
    token,
  });
});

// @desc        Login user
// @route       POST /api/v1/auth/login
// @access      Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // verify if user exists (check email and password)
  if (!email || !password) {
    return next(new ErrorResponse(`Please provide email and password`, 400));
  }

  // Check if user exists
  // because in the model password has a property `select: false` we must explicitly set it here
  // so that it is returned from the model by using`.select' method
  // adding `+ password` as filed name indicates that the filed MUST be returned by the query
  const user = await User.findOne({ email }).select(`+password`);
  if (!user) {
    return next(new ErrorResponse(`Invalid credentials`, 401));
  }

  // Validate password
  const passwordCorrect = await user.validatePassword(password);
  if (!passwordCorrect) {
    return next(new ErrorResponse(`Invalid credentials`, 401));
  }

  sendTokenResponse(user, 200, res);
});

// @desc        Logout user and clear cookie
// @route       GET /api/v1/auth/logout
// @access      Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
  });

  res.status(200).json({
    success: true,
    message: `Logging out user successful. Cookie cleared.`,
    data: {},
  });
});

// @desc        Get Current logged in user
// @route       GET /api/v1/auth/me
// @access      Private
exports.getLoggedInUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    message: `Current user data sent`,
    data: user,
  });
});

// @desc        Update user data
// @route       GET /api/v1/auth/update-user-data
// @access      Private
exports.updateUserData = asyncHandler(async (req, res, next) => {
  const allowedFields = {
    name: req.body.name,
    email: req.body.email,
  };

  const user = await User.findByIdAndUpdate(req.user.id, allowedFields, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: `User data updated`,
    data: user,
  });
});

// @desc        Update user's password
// @route       PUT /api/v1/auth/update-user-password
// @access      Private
exports.updateUserPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  if (!(await user.validatePassword(req.body.currentPassword))) {
    return next(new ErrorResponse(`Password is incorrect`, 401));
  }

  user.password = req.body.newPassword;

  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc        Send password reset email with generated token
// @route       POST /api/v1/auth/reset-password
// @access      Public
exports.resetPasswordRequest = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(
      new ErrorResponse(
        `No user is associated with email ${req.body.email}`,
        404
      )
    );
  }

  const passwordResetToken = user.generateAndSetResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // Create URL for Password Reset
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/auth/reset-password/${passwordResetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetURL}`;

  try {
    await sendEmail({
      email: user.email,
      subject: `API - Password Reset Request`,
      bodyText: message,
    });
    res.status(200).json({
      success: true,
      message: "Email with password reset token sent",
      data: user,
    });
  } catch (error) {
    console.error(error);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new ErrorResponse(
        `Email could not be send due to an error: ${error.message}`,
        500
      )
    );
  }
});

// @desc        Reset Password
// @route       PUT /api/v1/auth/reset-password/:resetToken
// @access      Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash("sha3-256")
    .update(req.params.resetToken)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    next(
      new ErrorResponse(
        `Cannot reset password, token may have expired or user does not exist`,
        400
      )
    );
  }

  // Set new password
  // it will be hashed automatically by the middleware
  // be aware that it will also be sent as plain text if HTTPS is not used
  user.password = req.body.password;
  user.resetPasswordExpire = undefined;
  user.resetPasswordToken = undefined;
  // In case of error in save (ex. non compliant password)
  // token will NOT get set to undefined and request can be repeated
  await user.save();

  sendTokenResponse(user, 200, res);
});

/**
 * Helper functions
 */

// Get token from the model, create a cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedToken();

  // Set cookie options
  const cookieOptions = {
    // Set expiration date to X days from now
    expires: new Date(
      Date.now() + process.env.TOKEN_COOKIE_EXPIRE * (24 * 60 * 60 * 1000)
    ),
    // Set as session cookie - only available to HTTP protocol sessions
    httpOnly: true,
  };

  // Enable Secure Cookies in Production environment only as dev env. will not have HTTPS
  if (process.env.NODE_ENV === "production") {
    cookieOptions.secure = true;
  }
  res
    .status(statusCode)
    // Create a cookie with token key set to token value
    .cookie("token", token, cookieOptions)
    .json({
      success: true,
      message: `Cookie setup and token returned`,
      token,
    });
};
