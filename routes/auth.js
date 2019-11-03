const express = require(`express`);

const {
  register,
  login,
  logout,
  getLoggedInUser,
  resetPasswordRequest,
  resetPassword,
  updateUserData,
  updateUserPassword,
} = require(`../controllers/auth`);

const router = express.Router();

const { protect } = require(`../middleware/auth`);

router.get(`/me`, protect, getLoggedInUser);
router.post(`/register`, register);
router.post(`/login`, login);
router.post(`/logout`, protect, logout);
router.post(`/update-user-data`, protect, updateUserData);
router.post(`/reset-password`, resetPasswordRequest);
router.put(`/reset-password/:resetToken`, resetPassword);
router.put(`/update-user-password`, protect, updateUserPassword);

module.exports = router;
