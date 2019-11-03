const asyncHandler = require(`../middleware/async`);
const ErrorResponse = require(`../utils/errorResponse`);
const User = require(`../models/User`);
const sendEmail = require("../utils/sendEmail");

// @desc        Register user
// @route       POST /api/v1/auth/register
// @access      Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // create user
  const user = await User.create({
    name,
    email,
    password,
    role,
  });

  // create token
  const token = user.getSignedToken();

  res.status(200).json({
    success: true,
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

  // check if user exists
  // because in the model password has a property `select: false` here we must explicitly set it so that it is returned from the model by using `.select' method and adding `+password` as filed name that MUST be returned
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

// @desc        Get Current logged in user
// @route       GET /api/v1/auth/me
// @access      Private
exports.getLoggedInUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc        Reset password
// @route       POST /api/v1/auth/reset-password
// @access      Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(
      new ErrorResponse(`No user associated with email ${req.body.email}`, 404)
    );
  }

  const passwordResetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // Create URL for Password Reset

  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/reset-password/${passwordResetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetURL}`;

  try {
    await sendEmail({
      email: user.email,
      subject: `API - Password Reset Request`,
      bodyText: message,
    });
    res.status(200).json({
      success: true,
      message: "Email sent",
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

/**
 * Helper functions
 */

// Get token from the model, create a cookie and send response

const sendTokenResponse = (user, statusCode, res) => {
  // create token
  const token = user.getSignedToken();

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.TOKEN_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  // Enable Secure Cookies in Production environment only as dev env. will not have HTTPS
  if (process.env.NODE_ENV === "production") {
    cookieOptions.secure = true;
  }
  res
    .status(statusCode)
    .cookie("token", token, cookieOptions)
    .json({
      success: true,
      token,
    });
};
