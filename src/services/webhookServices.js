const CartModel = require("../models/cartModel");
const OrderModel = require("../models/orderModel");
const { processOrderCore } = require("./adminServices");

module.exports.handleCheckoutSessionCompleted = async (session) => {
  const { orderNumber, orderId, userId } = session.metadata;

  await OrderModel.findOneAndUpdate(
    { orderNumber: orderNumber },
    {
      paymentStatus: "paid",
      status: "processing",
      paymentMethod: "stripe",
      paymentMethodType: session.payment_method_types[0],
      paymentId: session.payment_intent,
      completedAt: new Date(),
    }
  );
  processOrderCore(orderId);

};
module.exports.handleAsyncPaymentSucceeded = async (session) => {
  const orderId = session.metadata?.orderNumber;
  console.log("✅ Async payment succeeded:", orderId);

  await OrderModel.findOneAndUpdate(
    { orderNumber: orderId },
    {
      paymentStatus: "paid",
      status: "processing",
      paymentId: session.payment_intent,
      completedAt: new Date(),
    }
  );
};

module.exports.handleAsyncPaymentFailed = async (session) => {
  const orderId = session.metadata?.orderNumber;
  await OrderModel.findOneAndUpdate(
    { orderNumber: orderId },
    {
      paymentStatus: "failed",
      status: "cancelled",
      adminNotes: "Async payment failed or was declined.",
    }
  );
};

module.exports.handlePaymentIntentSucceeded = async (intent) => {
  const orderId = intent.metadata?.orderNumber;
  await OrderModel.findOneAndUpdate(
    { orderNumber: orderId },
    {
      paymentStatus: "paid",
      status: "processing",
      paymentId: intent.id,
    }
  );
};

module.exports.handlePaymentIntentFailed = async (intent) => {
  const orderId = intent.metadata?.orderNumber;
  await OrderModel.findOneAndUpdate(
    { orderNumber: orderId },
    {
      paymentStatus: "failed",
      status: "cancelled",
      adminNotes: "Payment failed: " + intent.last_payment_error?.message,
    }
  );
};

module.exports.handleCheckoutSessionExpired = async (session) => {
  const orderId = session.metadata?.orderNumber;
  await OrderModel.findOneAndUpdate(
    { orderNumber: orderId },
    {
      paymentStatus: "expired",
      status: "cancelled",
      adminNotes:
        "Checkout session expired before completion from user payment.",
    }
  );
};

module.exports.handleChargeSucceeded = async (charge) => {
  const orderId = charge.metadata?.orderNumber;
  await OrderModel.findOneAndUpdate(
    { orderNumber: orderId },
    {
      paymentStatus: "paid",
      paymentId: charge.id,
    }
  );
};
