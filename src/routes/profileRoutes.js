const express = require('express');
const {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount
} = require('../controllers/profileController');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: User profile management
 */

// All profile routes require authentication
router.use(protect);

// Get user profile
router.get('/', getProfile);

// Update user profile
router.put('/', updateProfile);

// Change password
router.put('/change-password', changePassword);

// Delete account
router.delete('/delete-account', deleteAccount);

module.exports = router;
