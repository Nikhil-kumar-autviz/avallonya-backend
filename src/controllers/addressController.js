const { validationResult } = require('express-validator');
const Address = require('../models/addressModel');

/**
 * @swagger
 * components:
 *   schemas:
 *     Address:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - streetAddress
 *         - townCity
 *         - state
 *         - zip
 *         - countryRegion
 *         - phone
 *         - email
 *       properties:
 *         firstName:
 *           type: string
 *           maxLength: 50
 *         lastName:
 *           type: string
 *           maxLength: 50
 *         companyName:
 *           type: string
 *           maxLength: 100
 *         streetAddress:
 *           type: string
 *           maxLength: 200
 *         townCity:
 *           type: string
 *           maxLength: 100
 *         state:
 *           type: string
 *           maxLength: 100
 *         zip:
 *           type: string
 *           maxLength: 20
 *         countryRegion:
 *           type: string
 *           maxLength: 100
 *         phone:
 *           type: string
 *           maxLength: 20
 *         email:
 *           type: string
 *           format: email
 *         isDefault:
 *           type: boolean
 *           default: false
 *         addressType:
 *           type: string
 *           enum: [home, work, other]
 *           default: home
 */

/**
 * @swagger
 * /api/addresses:
 *   get:
 *     summary: Get all addresses for the authenticated user
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Addresses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Address'
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user.id }).sort({ isDefault: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: addresses.length,
      data: addresses
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

/**
 * @swagger
 * /api/addresses/{id}:
 *   get:
 *     summary: Get a specific address by ID
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Address ID
 *     responses:
 *       200:
 *         description: Address retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Address'
 *       404:
 *         description: Address not found
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
exports.getAddress = async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user.id });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    res.status(200).json({
      success: true,
      data: address
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

/**
 * @swagger
 * /api/addresses:
 *   post:
 *     summary: Create a new address
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Address'
 *     responses:
 *       201:
 *         description: Address created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Address'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
exports.createAddress = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // If this is the user's first address, make it default
    const existingAddresses = await Address.find({ user: req.user.id });
    if (existingAddresses.length === 0) {
      req.body.isDefault = true;
    }

    const address = await Address.create({
      ...req.body,
      user: req.user.id
    });

    res.status(201).json({
      success: true,
      data: address
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

/**
 * @swagger
 * /api/addresses/{id}:
 *   put:
 *     summary: Update an address
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Address ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Address'
 *     responses:
 *       200:
 *         description: Address updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Address'
 *       404:
 *         description: Address not found
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
exports.updateAddress = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    res.status(200).json({
      success: true,
      data: address
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

/**
 * @swagger
 * /api/addresses/{id}:
 *   delete:
 *     summary: Delete an address
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Address ID
 *     responses:
 *       200:
 *         description: Address deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Address not found
 *       400:
 *         description: Cannot delete default address
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
exports.deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user.id });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Check if this is the default address and if there are other addresses
    if (address.isDefault) {
      const otherAddresses = await Address.find({ user: req.user.id, _id: { $ne: req.params.id } });
      if (otherAddresses.length > 0) {
        // Make the first other address the default
        await Address.findByIdAndUpdate(otherAddresses[0]._id, { isDefault: true });
      }
    }

    await Address.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

/**
 * @swagger
 * /api/addresses/{id}/set-default:
 *   put:
 *     summary: Set an address as default
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Address ID
 *     responses:
 *       200:
 *         description: Default address updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Address'
 *       404:
 *         description: Address not found
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
exports.setDefaultAddress = async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user.id });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Remove default flag from all other addresses
    await Address.updateMany(
      { user: req.user.id, _id: { $ne: req.params.id } },
      { isDefault: false }
    );

    // Set this address as default
    address.isDefault = true;
    await address.save();

    res.status(200).json({
      success: true,
      data: address
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};
