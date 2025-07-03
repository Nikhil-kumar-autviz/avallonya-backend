const express = require("express");
const {
  stripePaymentStatusCheckController,
} = require("../controllers/webhookController");
const webhookRouter = express.Router();

webhookRouter.post(
  "/stripe-payments",
  express.raw({ type: "application/json" }),
  stripePaymentStatusCheckController
);
module.exports = webhookRouter;
