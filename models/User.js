const crypto = require(`crypto`);
const mongoose = require(`mongoose`);
const bcrypt = require(`bcryptjs`);
const jwt = require(`jsonwebtoken`);

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, `Please add a name`],
  },
  email: {
    type: String,
    required: [true, `Please add an email`],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      `Please add a valid email`,
    ],
  },
  role: {
    type: String,
    enum: [`user`, `publisher`],
    default: `user`,
  },
  password: {
    type: String,
    required: [true, `Please add a password`],
    minlength: 6,
    select: false,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Encrypt password using bcrypt
UserSchema.pre("save", async function(next) {
  // this can run when we save user data ex. when we create a reset password token but...
  // if password was not modified move to next
  // and do not try to encrypt the password
  if (!this.isModified("password")) {
    next();
  }

  // encrypt the password on user save / creation but only if password field was modified.
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Sign TOKEN and return

UserSchema.methods.getSignedToken = function() {
  return jwt.sign({ id: this._id }, process.env.TOKEN_SECRET, {
    expiresIn: process.env.TOKEN_EXPIRE,
  });
};

// Validate user entered password to haashed password in the database
UserSchema.methods.validatePassword = async function(submittedPassword) {
  return await bcrypt.compare(submittedPassword, this.password);
};

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString("hex");
  // Hash token and setup resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash("sha3-256")
    .update(resetToken)
    .digest("hex");

  // Set Expiration time for password reset token to 30 minutes
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model(`User`, UserSchema);
