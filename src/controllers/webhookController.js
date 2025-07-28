
const orderModel = require("../models/orderModel");
const {
  handleCheckoutSessionCompleted,
  handleAsyncPaymentSucceeded,
  handleAsyncPaymentFailed,
  handlePaymentIntentSucceeded,
  handlePaymentIntentFailed,
  handleCheckoutSessionExpired,
  handleChargeSucceeded,
} = require("../services/webhookServices");
const stripe = require("../utils/stripe");
module.exports.stripePaymentStatusCheckController = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
console.log("webhook working")
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  const session = event.data.object;

  try{
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(session);
      break;
    case "checkout.session.async_payment_succeeded":
      await handleAsyncPaymentSucceeded(session);
      break;
    case "checkout.session.async_payment_failed":
      await handleAsyncPaymentFailed(session);
      break;
    case "checkout.session.expired":
      await handleCheckoutSessionExpired(session);
      break;
    case "payment_intent.succeeded":
      await handlePaymentIntentSucceeded(session);
      break;
    case "payment_intent.payment_failed":
      await handlePaymentIntentFailed(session);
      break;
    case "charge.succeeded":
      await handleChargeSucceeded(session);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  res.status(200).json({ received: true });
   } catch (err) {
      console.error("Webhook handling error:", err);
      res.status(500).send("Internal webhook error");
   }
};
