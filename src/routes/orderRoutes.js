const express = require('express');
const {
  createOrder,
  createOrderWithNewAddress,
  getOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management
 */

// All order routes require authentication
router.use(protect);



// Get user's orders
router.get('/', getOrders);

// Create new order from cart
router.post('/', createOrder);

// Create new order with new address
router.post('/with-new-address', createOrderWithNewAddress);

// Get order by ID
router.get('/:orderId', getOrderById);

// Cancel order
router.put('/:orderId/cancel', cancelOrder);

// Update order status (Admin only)
router.put('/:orderId/status', updateOrderStatus);



module.exports = router;
