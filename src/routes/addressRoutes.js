const express = require('express');
const { check } = require('express-validator');
const {
  getAddresses,
  getAddress,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} = require('../controllers/addressController');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Addresses
 *   description: User address management
 */

// All address routes require authentication
router.use(protect);

// Validation rules for address fields
const addressValidation = [
  check('firstName', 'First name is required and must be less than 50 characters')
    .notEmpty()
    .isLength({ max: 50 }),
  check('lastName', 'Last name is required and must be less than 50 characters')
    .notEmpty()
    .isLength({ max: 50 }),
  check('companyName', 'Company name must be less than 100 characters')
    .optional()
    .isLength({ max: 100 }),
  check('streetAddress', 'Street address is required and must be less than 200 characters')
    .notEmpty()
    .isLength({ max: 200 }),
  check('townCity', 'Town/City is required and must be less than 100 characters')
    .notEmpty()
    .isLength({ max: 100 }),
  check('state', 'State is required and must be less than 100 characters')
    .notEmpty()
    .isLength({ max: 100 }),
  check('zip', 'ZIP code is required and must be less than 20 characters')
    .notEmpty()
    .isLength({ max: 20 }),
  check('countryRegion', 'Country/Region is required and must be less than 100 characters')
    .notEmpty()
    .isLength({ max: 100 }),
  check('phone', 'Phone number is required and must be less than 20 characters')
    .notEmpty()
    .isLength({ max: 20 }),
  check('email', 'Please include a valid email')
    .isEmail()
    .normalizeEmail(),
  check('addressType', 'Address type must be one of: home, work, other')
    .optional()
    .isIn(['home', 'work', 'other']),
  check('isDefault', 'isDefault must be a boolean')
    .optional()
    .isBoolean()
];

// Get all addresses for the authenticated user
router.get('/', getAddresses);

// Create a new address
router.post('/', addressValidation, createAddress);

// Get a specific address by ID
router.get('/:id', getAddress);

// Update an address
router.put('/:id', addressValidation, updateAddress);

// Delete an address
router.delete('/:id', deleteAddress);

// Set an address as default
router.put('/:id/set-default', setDefaultAddress);

module.exports = router;
