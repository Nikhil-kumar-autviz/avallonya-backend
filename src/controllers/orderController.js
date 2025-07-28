const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const User = require("../models/userModel");
const Address = require("../models/addressModel");
const productService = require("../services/productService");
const { createCartAndPlaceOrder } = require("./adminController");
const { processOrderCore } = require("../services/adminServices");
const stripe = require("../utils/stripe");

/**
 * @swagger
 * components:
 *   schemas:
 *     AddressSnapshot:
 *       type: object
 *       properties:
 *         addressId:
 *           type: string
 *           description: Reference to original address (if still exists)
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         companyName:
 *           type: string
 *         streetAddress:
 *           type: string
 *         townCity:
 *           type: string
 *         state:
 *           type: string
 *         zip:
 *           type: string
 *         countryRegion:
 *           type: string
 *         phone:
 *           type: string
 *         email:
 *           type: string
 *         addressType:
 *           type: string
 *           enum: [home, work, other]
 *     Order:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         orderNumber:
 *           type: string
 *         user:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             type: object
 *         subtotal:
 *           type: number
 *         tax:
 *           type: number
 *         shipping:
 *           type: number
 *         discount:
 *           type: number
 *         totalAmount:
 *           type: number
 *         currency:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, accepted, shipped, delivered, cancelled, refunded]
 *         paymentStatus:
 *           type: string
 *           enum: [pending, paid, failed, refunded]
 *         paymentMethod:
 *           type: string
 *           enum: [credit_card, debit_card, paypal, stripe, cash_on_delivery]
 *         shippingAddress:
 *           $ref: '#/components/schemas/AddressSnapshot'
 *         shippingMethod:
 *           type: string
 *           enum: [standard, express, overnight, pickup]
 *         trackingNumber:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order from cart
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - addressId
 *               - paymentMethod
 *             properties:
 *               addressId:
 *                 type: string
 *                 description: ID of the address to use for shipping
 *               paymentMethod:
 *                 type: string
 *                 enum: [credit_card, debit_card, paypal, stripe, cash_on_delivery]
 *               shippingMethod:
 *                 type: string
 *                 enum: [standard, express, overnight, pickup]
 *                 default: standard
 *               notes:
 *                 type: string
 *               items:
 *                 type: array
 *                 description: Optional array of items to order. If not provided, uses cart items.
 *                 items:
 *                   type: object
 *                   required:
 *                     - gtin
 *                     - name
 *                     - quantity
 *                   properties:
 *                     gtin:
 *                       type: string
 *                       description: Product GTIN
 *                     name:
 *                       type: string
 *                       description: Product name
 *                     imageUrl:
 *                       type: string
 *                       description: Product image URL
 *                     category:
 *                       type: string
 *                       description: Product category
 *                     brand:
 *                       type: string
 *                       description: Product brand
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       description: Quantity to order
 *                     price:
 *                       type: number
 *                       description: Unit price of the product
 *                     originPrice:
 *                       type: number
 *                       description: Original price before discounts
 *                     selectedSize:
 *                       type: string
 *                       description: Selected size variant
 *                     selectedColor:
 *                       type: string
 *                       description: Selected color variant
 *                     isInStock:
 *                       type: boolean
 *                       default: true
 *                       description: Whether the product is in stock
 *     responses:
 *       201:
 *         description: Order created successfully
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
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid input or empty cart
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
const createOrder = async (req, res) => {
  try {
    const { addressId, paymentMethod, shippingMethod, notes } = req.body;
    const cart = await Cart.findOrCreateForUser(req.user.id);
    console.log("userid",req.user.id)
    if (cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }
    if (!addressId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Address ID, payment method, and items are required",
      });
    }

    // Verify address
    const address = await Address.findOne({
      _id: addressId,
      user: req.user.id,
    });
    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found or does not belong to user",
      });
    }

    let orderItems = [];
    let subtotal = 0;
    const taxRate = 0.08; // 8%

    // Process each item
    for (const item of cart.items) {
      if (
        !item.selectedSellerOffers ||
        item.selectedSellerOffers.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: `No seller offers available for product ${item.gtin}`,
        });
      }

      // Process each seller offer independently
      for (const offer of item.selectedSellerOffers) {
        const quantity = offer.quantityPurchase || item.quantity;
        const price = parseFloat(offer.price);

        // Validate the offer
        if (isNaN(price)) {
          console.error(`Invalid price for offer ${offer.qid}`);
          continue;
        }

        if (!quantity || quantity <= 0) {
          console.error(`Invalid quantity for offer ${offer.qid}`);
          continue;
        }

        if (offer.inventory < quantity) {
          console.error(`Insufficient inventory for offer ${offer.qid}`);
          continue;
        }

        const offerSubtotal = price * quantity;

        // Create order item with both price and unitPrice
        orderItems.push({
          productId: item.gtin,
          gtin: item.gtin,
          name: item.name,
          imageUrl: item.imageUrl,
          category: item.category,
          brand: item.brand,
          selectedSize: item.selectedSize || "",
          selectedColor: item.selectedColor || "",
          quantity: quantity,
          price: price,
          unitPrice: price,
          subtotal: offerSubtotal,
          seller: offer.seller,
          sellerData: {
            price: price,
            mov: offer.mov,
            movCurrency: offer.movCurrency,
            inventory: offer.inventory,
            isTraceable: offer.isTraceable,
            qid: offer.qid,
            finalOrderValue: offer.finalOrderValue,
          },
          productSnapshot: {
            addedAt: new Date(),
            isInStock: true,
          },
        });

        subtotal += offerSubtotal;
      }
    }

    if (orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid seller offers found for any items",
      });
    }

    // Calculate totals
    const tax = parseFloat((subtotal * taxRate).toFixed(2));
    const shippingCost =
      shippingMethod === "express"
        ? 15
        : shippingMethod === "overnight"
        ? 25
        : 5;
    const totalAmount = parseFloat((subtotal + tax + shippingCost).toFixed(2));

    // Create address snapshot
    const addressSnapshot = {
      addressId: address._id,
      firstName: address.firstName,
      lastName: address.lastName,
      streetAddress: address.streetAddress,
      townCity: address.townCity,
      state: address.state,
      zip: address.zip,
      countryRegion: address.countryRegion,
      phone: address.phone,
      email: address.email,
    };

    // Generate order number
    const now = new Date();
    const orderNumber = `ORD-${now.getFullYear()}${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}${now
      .getDate()
      .toString()
      .padStart(2, "0")}-${Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, "0")}`;

    // Create order document
    const order = new Order({
      user: req.user.id,
      orderNumber,
      items: orderItems,
      subtotal,
      tax,
      shipping: shippingCost,
      totalAmount,
      paymentMethod,
      shippingAddress: addressSnapshot,
      shippingMethod: shippingMethod || "standard",
      notes: notes || "",
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await order.save();
    await User.findByIdAndUpdate(req.user.id, {
      $push: { orders: order._id },
    });

    // Prepare line items for Stripe
    const line_items = orderItems.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: `${item.name} (Seller: ${item.seller})`,
          images: [item.imageUrl],
          metadata: {
            productId: item.gtin,
            sellerId: item.seller,
            isTraceable: item.sellerData.isTraceable.toString(),
            qid: item.sellerData.qid,
          },
        },
        unit_amount: Math.round(item.price * 100), // Use price instead of unitPrice
      },
      quantity: item.quantity,
    }));

    const customer = await stripe.customers.create({
      email: order.shippingAddress.email,
      phone: order.shippingAddress.phone,
      name: order.shippingAddress.fullName || order.shippingAddress.name,
    });
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      currency: "usd",
      mode: "payment",
      customer: customer.id,
      line_items,
      expires_at: Math.floor(Date.now() / 1000) + 1800, // 30 minutes from now
      metadata: {
        orderId: order?._id?.toString(),
        orderNumber: order.orderNumber,
        userId: order?.user?._id?.toString(),
        contact: order.shippingAddress?.phone?.toString(),
        totalAmount: totalAmount.toString(),
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: Math.round(order.shipping * 100 + order.tax * 100),

              currency: order.currency.toLowerCase(),
            },
            display_name:
              order.shippingMethod === "standard"
                ? "Standard Shipping + Tax"
                : "Shipping + Tax",
          },
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/order-success?orderId=${order?._id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cart`,
    });
    // Create Stripe session

    return res.status(201).json({
      success: true,
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        items: orderItems.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price, // Use price instead of unitPrice
          subtotal: item.subtotal,
          seller: item.seller,
          isTraceable: item.sellerData.isTraceable,
        })),
      },
      payment: {
        sessionId: session.id,
        paymentUrl: session.url,
        expiresAt: session.expires_at,
      },
    });
  } catch (error) {
    console.error("Order creation error:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating order",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};
/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get user's orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of orders per page
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
const getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const orders = await Order.getOrdersByUser(req.user.id, page, limit);
    const totalOrders = await Order.countDocuments({ user: req.user.id });

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total: totalOrders,
        pages: Math.ceil(totalOrders / limit),
      },
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving orders",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/orders/{orderId}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */

const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { sessionId } = req.query;

    // 1. Find the order
    const order = await Order.findOne({
      _id: orderId,
      user: req.user.id,
    }).populate("user", "name email");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
    //check session id exist checks strippe payment
    if (sessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ["payment_intent"],
        });
        
        if (session.metadata?.orderId && session.metadata.orderId !== orderId) {
          console.warn(
            `Order ID mismatch: ${session.metadata.orderId} vs ${orderId}`
          );
        }
        if (
          session.payment_status &&
          order.paymentStatus !== session.payment_status
        ) {
          order.paymentStatus = session.payment_status;
          order.paymentDetails = order.paymentDetails || {};
          order.paymentDetails.paymentId =
            session.payment_intent?.id || order.paymentDetails?.paymentId;
          order.updatedAt = new Date();
          if(order.status==="pending"){
           order.status="processing" ;
           console.log("ok it triggered")
           processOrderCore(orderId)
           

          }
          await order.save();
          
        }
      } catch (stripeError) {
        console.warn("Stripe session retrieval error:", stripeError.message);
      }
    }
    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Get order by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving order",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/orders/{orderId}/cancel:
 *   put:
 *     summary: Cancel an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       400:
 *         description: Order cannot be cancelled
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      user: req.user.id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if order can be cancelled
    if (
      ["shipped", "delivered", "cancelled", "refunded", "accepted"].includes(
        order.status
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled",
      });
    }

    await order.updateStatus("cancelled", "Cancelled by user");

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: order,
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({
      success: false,
      message: "Error cancelling order",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/orders/with-new-address:
 *   post:
 *     summary: Create a new order with a new shipping address
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shippingAddress
 *               - paymentMethod
 *             properties:
 *               shippingAddress:
 *                 type: object
 *                 required:
 *                   - firstName
 *                   - lastName
 *                   - streetAddress
 *                   - townCity
 *                   - state
 *                   - zip
 *                   - countryRegion
 *                   - phone
 *                   - email
 *                 properties:
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   companyName:
 *                     type: string
 *                   streetAddress:
 *                     type: string
 *                   townCity:
 *                     type: string
 *                   state:
 *                     type: string
 *                   zip:
 *                     type: string
 *                   countryRegion:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   email:
 *                     type: string
 *                   addressType:
 *                     type: string
 *                     enum: [home, work, other]
 *                     default: home
 *               paymentMethod:
 *                 type: string
 *                 enum: [credit_card, debit_card, paypal, stripe, cash_on_delivery]
 *               shippingMethod:
 *                 type: string
 *                 enum: [standard, express, overnight, pickup]
 *                 default: standard
 *               notes:
 *                 type: string
 *               saveAddress:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to save this address to user's address book
 *               items:
 *                 type: array
 *                 description: Optional array of items to order. If not provided, uses cart items.
 *                 items:
 *                   type: object
 *                   required:
 *                     - gtin
 *                     - name
 *                     - quantity
 *                   properties:
 *                     gtin:
 *                       type: string
 *                       description: Product GTIN
 *                     name:
 *                       type: string
 *                       description: Product name
 *                     imageUrl:
 *                       type: string
 *                       description: Product image URL
 *                     category:
 *                       type: string
 *                       description: Product category
 *                     brand:
 *                       type: string
 *                       description: Product brand
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       description: Quantity to order
 *                     price:
 *                       type: number
 *                       description: Unit price of the product
 *                     originPrice:
 *                       type: number
 *                       description: Original price before discounts
 *                     selectedSize:
 *                       type: string
 *                       description: Selected size variant
 *                     selectedColor:
 *                       type: string
 *                       description: Selected color variant
 *                     isInStock:
 *                       type: boolean
 *                       default: true
 *                       description: Whether the product is in stock
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Invalid input or empty cart
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
const createOrderWithNewAddress = async (req, res) => {
  try {
    const {
      shippingAddress,
      paymentMethod,
      shippingMethod = "standard",
      notes = "",
      saveAddress = false,
    } = req.body;

    // Validate required fields
    if (!shippingAddress || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Shipping address and payment method are required",
      });
    }

    // Validate shipping address structure
    const requiredAddressFields = [
      "firstName",
      "lastName",
      "streetAddress",
      "townCity",
      "state",
      "zip",
      "countryRegion",
      "phone",
      "email",
    ];
    for (const field of requiredAddressFields) {
      if (!shippingAddress[field]) {
        return res.status(400).json({
          success: false,
          message: `Shipping address is missing required field: ${field}`,
        });
      }
    }

    // Get user's cart
    const cart = await Cart.findOrCreateForUser(req.user.id);
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty - cannot checkout",
      });
    }

    // Process cart items and validate offers
    let orderItems = [];
    let subtotal = 0;
    const taxRate = 0.08;
    const invalidItems = [];

    for (const item of cart.items) {
      if (
        !item.selectedSellerOffers ||
        item.selectedSellerOffers.length === 0
      ) {
        invalidItems.push({
          product: item.name,
          reason: "No seller offers available",
        });
        continue;
      }

      for (const offer of item.selectedSellerOffers) {
        try {
          const quantity = offer.quantityPurchase || item.quantity;
          const price = parseFloat(offer.price);

          // Validate offer
          if (isNaN(price) || price < 0) {
            throw new Error(`Invalid price (${offer.price})`);
          }

          if (!quantity || quantity <= 0) {
            throw new Error(`Invalid quantity (${quantity})`);
          }

          if (offer.inventory < quantity) {
            throw new Error(
              `Insufficient inventory (${offer.inventory} available)`
            );
          }

          const offerSubtotal = price * quantity;

          orderItems.push({
            productId: item.gtin,
            gtin: item.gtin,
            name: item.name,
            imageUrl: item.imageUrl,
            category: item.category,
            brand: item.brand,
            selectedSize: item.selectedSize || "",
            selectedColor: item.selectedColor || "",
            quantity: quantity,
            price: price,
            unitPrice: price,
            subtotal: offerSubtotal,
            seller: offer.seller,
            sellerData: {
              price: price,
              mov: offer.mov,
              movCurrency: offer.movCurrency,
              inventory: offer.inventory,
              isTraceable: offer.isTraceable,
              qid: offer.qid,
              finalOrderValue: offer.finalOrderValue,
            },
            productSnapshot: {
              addedAt: new Date(),
              isInStock: true,
            },
          });

          subtotal += offerSubtotal;
        } catch (error) {
          invalidItems.push({
            product: item.name,
            seller: offer.seller,
            reason: error.message,
          });
        }
      }
    }

    if (orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid items available for checkout",
        invalidItems,
      });
    }

    // Calculate order totals
    const tax = parseFloat((subtotal * taxRate).toFixed(2));
    const shippingCost =
      {
        standard: 5,
        express: 15,
        overnight: 25,
      }[shippingMethod] || 5;

    const totalAmount = parseFloat((subtotal + tax + shippingCost).toFixed(2));

    // Create address snapshot
    const addressSnapshot = {
      addressId: null,
      firstName: shippingAddress.firstName,
      lastName: shippingAddress.lastName,
      companyName: shippingAddress.companyName || "",
      streetAddress: shippingAddress.streetAddress,
      townCity: shippingAddress.townCity,
      state: shippingAddress.state,
      zip: shippingAddress.zip,
      countryRegion: shippingAddress.countryRegion,
      phone: shippingAddress.phone,
      email: shippingAddress.email,
      addressType: shippingAddress.addressType || "home",
    };

    // Save address if requested
    if (saveAddress) {
      try {
        const newAddress = new Address({
          ...shippingAddress,
          user: req.user.id,
          addressType: shippingAddress.addressType || "home",
        });
        const savedAddress = await newAddress.save();
        addressSnapshot.addressId = savedAddress._id;

        await User.findByIdAndUpdate(req.user.id, {
          $push: { addresses: savedAddress._id, orders: order?._id },
        });
      } catch (error) {
        console.error("Failed to save address:", error);
        // Continue with order even if address save fails
      }
    }

    // Generate order number
    const now = new Date();
    const orderNumber = `ORD-${now.getFullYear()}${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}${now
      .getDate()
      .toString()
      .padStart(2, "0")}-${Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, "0")}`;

    // Create order
    const order = new Order({
      user: req.user.id,
      orderNumber,
      items: orderItems,
      subtotal,
      tax,
      shipping: shippingCost,
      discount: 0,
      totalAmount,
      paymentMethod,
      shippingAddress: addressSnapshot,
      shippingMethod,
      notes,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await order.save();
    await User.findByIdAndUpdate(req.user.id, {
      $push: { orders: order?._id },
    });
    // Prepare Stripe line items
    const line_items = orderItems.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: `${item.name} (Seller: ${item.seller})`,
          images: [item.imageUrl],
          metadata: {
            productId: item.gtin,
            sellerId: item.seller,
            isTraceable: item.sellerData?.isTraceable?.toString(),
            qid: item.sellerData?.qid,
          },
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    // Create Stripe customer and checkout session
    const customer = await stripe.customers.create({
      email: shippingAddress.email,
      phone: shippingAddress.phone,
      name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
      metadata: {
        userId: req.user.id,
        orderId: order._id.toString(),
      },
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      currency: "usd",
      mode: "payment",
      customer: customer.id,
      line_items,
      expires_at: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
      metadata: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        userId: req.user.id,
        contact: shippingAddress.phone,
        totalAmount: totalAmount.toString(),
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: Math.round(order.shipping * 100 + order.tax * 100),

              currency: order.currency.toLowerCase(),
            },
            display_name:
              order.shippingMethod === "standard"
                ? "Standard Shipping + Tax"
                : "Shipping + Tax",
          },
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/order-success?orderId=${order._id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cart`,
    });

    // Return success response
    res.status(201).json({
      success: true,
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        itemCount: orderItems.length,
        shippingMethod,
        shippingCost,
        tax,
      },
      payment: {
        sessionId: session.id,
        paymentUrl: session.url,
        expiresAt: session.expires_at,
      },
      invalidItems: invalidItems.length > 0 ? invalidItems : undefined,
    });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while processing your order",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @swagger
 * /api/orders/{orderId}/status:
 *   put:
 *     summary: Update order status (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, accepted, shipped, delivered, cancelled, refunded]
 *                 description: New order status
 *               notes:
 *                 type: string
 *                 description: Admin notes for the status update
 *               trackingNumber:
 *                 type: string
 *                 description: Tracking number (for shipped status)
 *     responses:
 *       200:
 *         description: Order status updated successfully
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
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid status or status transition
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes, trackingNumber } = req.body;

    // Validate required fields
    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    // Validate status enum
    const validStatuses = [
      "pending",
      "accepted",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid statuses are: ${validStatuses.join(
          ", "
        )}`,
      });
    }

    // Find the order
    const order = await Order.findById(orderId).populate("user", "name email");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check for valid status transitions
    const currentStatus = order.status;
    const invalidTransitions = {
      delivered: ["pending", "accepted", "shipped"],
      cancelled: ["accepted", "shipped", "delivered"],
      refunded: ["pending", "accepted", "shipped"],
    };

    if (
      invalidTransitions[currentStatus] &&
      invalidTransitions[currentStatus].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${currentStatus} to ${status}`,
      });
    }

    // Update tracking number if provided and status is shipped
    if (status === "shipped" && trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    // Update the order status using the model method
    await order.updateStatus(status, notes || "");

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating order status",
      error: error.message,
    });
  }
};

module.exports = {
  createOrder,
  createOrderWithNewAddress,
  getOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
};
