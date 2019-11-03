const express = require(`express`);

const {
  register,
  login,
  getLoggedInUser,
  resetPasswordRequest,
  resetPassword,
} = require(`../controllers/auth`);

const router = express.Router();

const { protect } = require(`../middleware/auth`);

router.post(`/register`, register);
router.post(`/login`, login);
router.get(`/me`, protect, getLoggedInUser);
router.post(`/reset-password`, resetPasswordRequest);
router.put(`/reset-password/:resetToken`, resetPassword);

module.exports = router;
