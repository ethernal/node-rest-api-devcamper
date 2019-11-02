const asyncHandler = require(`../middleware/async`);
const ErrorResponse = require(`../utils/errorResponse`);
const User = require(`../models/User`);

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

  // create token
  const token = user.getSignedToken();

  res.status(200).json({
    success: true,
    token,
  });
});
