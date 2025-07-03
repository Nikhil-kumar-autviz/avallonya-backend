const Cart = require("../models/cartModel");

/**
 * @swagger
 * components:
 *   schemas:
 *     CartItem:
 *       type: object
 *       required:
 *         - gtin
 *         - name
 *         - quantity
 *       properties:
 *         gtin:
 *           type: string
 *           description: GTIN for products
 *         name:
 *           type: string
 *           description: Product name
 *         imageUrl:
 *           type: string
 *           description: Product image URL
 *         category:
 *           type: string
 *           description: Product category
 *         brand:
 *           type: string
 *           description: Product brand
 *         quantity:
 *           type: number
 *           minimum: 1
 *           description: Quantity of the product
 *     Cart:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         user:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartItem'
 *         totalItems:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOrCreateForUser(req.user.id);
    const flattenedItems = [];
    for (const item of cart.items) {
      const { selectedSellerOffers, ...itemData } =
        item.toObject?.() || item;
      if (
        Array.isArray(selectedSellerOffers) &&
        selectedSellerOffers.length > 0
      ) {
        for (const {quantityInCart,...offer} of selectedSellerOffers) {
          flattenedItems.push({
            ...itemData,
            ...(offer.toObject?.() || offer),
          });
        }
      } else {
        flattenedItems.push(itemData);
      }
    }
    const refactoredCart = cart?.toObject();
    refactoredCart.items = flattenedItems;
    res.status(200).json({
      success: true,
      data: refactoredCart,
    });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving cart",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/cart/add:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CartItem'
 *     responses:
 *       200:
 *         description: Item added to cart successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
const addToCart = async (req, res) => {
  try {
    const {
      gtin,
      name,
      imageUrl,
      category,
      brand,
      quantity,
      fid,
      slug,
      sellerOffers,
    } = req.body;

    // Validate required fields
    if (!gtin || !name) {
      return res.status(400).json({
        success: false,
        message: "GTIN and name are required",
      });
    }

    if (quantity && quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    const cart = await Cart.findOrCreateForUser(req.user.id);
    console.log(cart);
    const itemData = {
      gtin,
      name,
      imageUrl: imageUrl || "",
      category: category || "",
      brand: brand || "",
      fid: fid,
      slug: slug,
      sellerOffers: sellerOffers,
    };

    await cart.addItem(itemData);

    res.status(200).json({
      success: true,
      message: "Item added to cart successfully",
      data: cart,
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding item to cart",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/cart/update/{itemId}:
 *   put:
 *     summary: Update cart item quantity
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: number
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Cart item updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart item not found
 *       500:
 *         description: Server error
 */
const updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity, seller } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    await cart.updateItemQuantity(itemId, seller, quantity);

    res.status(200).json({
      success: true,
      message: "Cart item updated successfully",
      data: cart,
    });
  } catch (error) {
    console.error("Update cart item error:", error);

    if (error.message === "Item not found in cart") {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating cart item",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/cart/remove/{itemId}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart item ID
 *     responses:
 *       200:
 *         description: Item removed from cart successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart not found
 *       500:
 *         description: Server error
 */
const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { seller } = req.query;
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    await cart.removeItem(itemId, seller);

    res.status(200).json({
      success: true,
      message: "Item removed from cart successfully",
      data: cart,
    });
  } catch (error) {
    console.error("Remove from cart error:", error);
    res.status(500).json({
      success: false,
      message: "Error removing item from cart",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/cart/clear:
 *   delete:
 *     summary: Clear all items from cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart not found
 *       500:
 *         description: Server error
 */
const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    await cart.clearCart();

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      data: cart,
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({
      success: false,
      message: "Error clearing cart",
      error: error.message,
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
