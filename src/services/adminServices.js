const Order = require("../models/orderModel");
const sendEmail = require("../utils/sendEmail");
const { qogitaApi, getValidAccessToken } = require("./qogitaService");

const orderConfirmationEmail = (orderData) => {
  const frontendUrl = process.env.FRONTEND_URL;

  const message = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333333; line-height: 1.6;">
  <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #eeeeee;">
    <img src="data:image/png;base64,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" alt="Company Logo" style="max-width: 150px;">
  </div>
  
  <div style="padding: 20px 0;">
    <h2 style="color: #333333;">Thank you for your order!</h2>
    <p>Dear ${orderData.shippingAddress.firstName} ${
    orderData.shippingAddress.lastName
  },</p>
    <p>We're pleased to confirm that we've received your order <strong>#${
      orderData.orderNumber
    }</strong> and it's being processed.</p>
    
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; font-size: 18px; font-weight: bold;">
      Order Number: ${orderData.orderNumber}
    </div>
    
    <h3 style="color: #333333; margin-bottom: 10px;">Order Summary</h3>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background-color: #f9f9f9;">
          <th style="padding: 10px; text-align: left; border-bottom: 1px solid #eeeeee;">Product</th>
          <th style="padding: 10px; text-align: left; border-bottom: 1px solid #eeeeee;">Quantity</th>
          <th style="padding: 10px; text-align: left; border-bottom: 1px solid #eeeeee;">Price</th>
          <th style="padding: 10px; text-align: left; border-bottom: 1px solid #eeeeee;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${orderData.items
          .map(
            (item) => `
        <tr>
          <td style="padding: 10px; text-align: left; border-bottom: 1px solid #eeeeee;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <img src="${item.imageUrl}" alt="${
              item.name
            }" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;">
              <div>
                <strong>${item.name}</strong><br>
                <small style="color: #777777;">${item.brand}</small>
              </div>
            </div>
          </td>
          <td style="padding: 10px; text-align: left; border-bottom: 1px solid #eeeeee;">${
            item.quantity
          }</td>
          <td style="padding: 10px; text-align: left; border-bottom: 1px solid #eeeeee;">${parseFloat(
            item.price
          ).toFixed(2)} ${orderData.currency}</td>
          <td style="padding: 10px; text-align: left; border-bottom: 1px solid #eeeeee;">${parseFloat(
            item.subtotal
          ).toFixed(2)} ${orderData.currency}</td>
        </tr>
        `
          )
          .join("")}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="padding: 10px; text-align: right; border-bottom: 1px solid #eeeeee;"><strong>Subtotal:</strong></td>
          <td style="padding: 10px; text-align: left; border-bottom: 1px solid #eeeeee;">${
            orderData.subtotal
          } ${orderData.currency}</td>
        </tr>
        <tr>
          <td colspan="3" style="padding: 10px; text-align: right; border-bottom: 1px solid #eeeeee;"><strong>Shipping:</strong></td>
          <td style="padding: 10px; text-align: left; border-bottom: 1px solid #eeeeee;">${
            orderData.shipping
          } ${orderData.currency}</td>
        </tr>
        <tr>
          <td colspan="3" style="padding: 10px; text-align: right; border-bottom: 1px solid #eeeeee;"><strong>Tax:</strong></td>
          <td style="padding: 10px; text-align: left; border-bottom: 1px solid #eeeeee;">${
            orderData.tax
          } ${orderData.currency}</td>
        </tr>
        <tr>
          <td colspan="3" style="padding: 10px; text-align: right;"><strong>Total:</strong></td>
          <td style="padding: 10px; text-align: left;">${
            orderData.totalAmount
          } ${orderData.currency}</td>
        </tr>
      </tfoot>
    </table>
    
    <h3 style="color: #333333; margin-bottom: 10px;">Shipping Information</h3>
    <p style="margin: 5px 0;">
      ${orderData.shippingAddress.firstName} ${
    orderData.shippingAddress.lastName
  }<br>
      ${orderData.shippingAddress.streetAddress}<br>
      ${orderData.shippingAddress.townCity}, ${
    orderData.shippingAddress.state
  } ${orderData.shippingAddress.zip}<br>
      ${orderData.shippingAddress.countryRegion}<br>
      Phone: ${orderData.shippingAddress.phone}
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${frontendUrl}/order-success?orderId=${
    orderData._id
  }" style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
        View Your Order
      </a>
    </div>
    
    <p>We'll send you another email when your order ships. If you have any questions, please reply to this email.</p>
    <p>Thank you for shopping with us!</p>
  </div>
  
  <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eeeeee; font-size: 12px; color: #777777;">
    <p>© ${new Date().getFullYear()} Avallonya. All rights reserved.</p>
  
  </div>
</div>
  `;

  sendEmail({
    email: orderData.shippingAddress.email,
    subject: "Order Confirmation Email",
    message: message,
  });
};

async function processCartItems(items, apiHeaders, orderId) {
  const results = [];
  let itemsAddedToCart = false;

  for (const item of items) {
    // Use sellerData instead of sellerOffers[0]
    const offerQid = item.sellerData?.qid;
    if (!offerQid) {
      results.push({
        product: item.name,
        productId: item.productId,
        status: "skipped",
        reason: item.sellerData
          ? "Invalid offer QID"
          : "No seller data available",
      });
      continue;
    }

    try {
      const response = await qogitaApi.post(
        "/carts/active/lines/",
        {
          quantity: item.quantity,
          offerQid: offerQid,
        },
        { headers: apiHeaders }
      );

      itemsAddedToCart = true;
      results.push({
        product: item.name,
        productId: item.productId,
        status: "added",
        qogitaItemId: response.data?.qid,
        quantity: item.quantity,
        // Additional potentially useful info from schema:
        gtin: item.gtin,
        price: item.price,
        seller: item.seller,
      });
    } catch (error) {
      results.push({
        product: item.name,
        productId: item.productId,
        status: "failed",
        error: error.response?.data?.message || error.message,
        details: error.response?.data?.errors,
        // Additional debugging info:
        offerQid: item.sellerData?.qid,
        quantityAttempted: item.quantity,
      });
    }
  }

  return { results, itemsAddedToCart };
}

async function getShippingAddress(apiHeaders) {
  try {
    const response = await qogitaApi.get("/addresses", { headers: apiHeaders });
    return response.data.results?.[0];
  } catch (error) {
    console.log(`Failed to fetch addresses: ${error.message}`);
  }
}

async function processCheckout(addressQid, apiHeaders) {
  try {
    const patchPayload = {
      shippingAddressQid: addressQid,
      billingAddressQid: addressQid,
      selectedPaymentMethod: { code: "BANK_TRANSFER" },
    };
    await qogitaApi.post(
      "/checkouts/active/validate/",
      {},
      { headers: apiHeaders }
    );
    await qogitaApi.patch("/checkouts/active/", patchPayload, {
      headers: apiHeaders,
    });
  } catch (e) {
    console.error(e);
  }
}

async function completeOrder(apiHeaders) {
  try {
    const response = await qogitaApi.post(
      "/checkouts/active/complete/",
      {},
      { headers: apiHeaders }
    );

    // if (!response.data?.qid) {
    //   throw new Error("Invalid order completion response");
    // }

    return response.data;
  } catch (error) {
    console.log(error);
  }
}

async function updateOrderInDatabase(orderId, orderData) {
  const newOrder = await Order.findByIdAndUpdate(
    orderId,
    {
      qogitaOrderId: orderData.qid,
      updatedAt: new Date(),
      status: "accepted",
      qogitaOrderData: orderData,
    },
    { new: true }
  );
  orderConfirmationEmail(newOrder);
  return newOrder;
}
async function safeCartCleanup(needed, apiHeaders) {
  if (!needed) return;

  try {
    await qogitaApi.post("/carts/active/empty", {}, { headers: apiHeaders });
  } catch (error) {
    console.error("Cart cleanup failed:", error);
  }
}

function handleApiError(res, error, defaultMessage) {
  const statusCode = error.response?.status || 500;
  const message = error.response?.data?.message || defaultMessage;

  console.error("API Error:", {
    message: error.message,
    status: error.response?.status,
    data: error.response?.data,
  });

  return res.status(statusCode).json({
    success: false,
    message,
    error: error.message,
    ...(process.env.NODE_ENV === "development" && {
      details: error.response?.data,
      stack: error.stack,
    }),
  });
}

async function processOrderCore(orderId) {
  // Get access token and set headers
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    throw new Error("Failed to obtain Qogita access token");
  }

  const apiHeaders = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // Find the order
  const order = await Order.findById(orderId).lean();
  if (!order) {
    throw new Error("Order not found");
  }

  // Process cart items
  const { results, itemsAddedToCart } = await processCartItems(
    order.items,
    apiHeaders,
    orderId
  );

  // Check for failed items
  const failedItems = results.filter((item) => item.status !== "added");
  if (failedItems.length > 0) {
    await safeCartCleanup(itemsAddedToCart, apiHeaders);
    throw new Error("Some items failed to add to cart");
  }

  // Process shipping and checkout
  const shippingAddress = await getShippingAddress(apiHeaders);
  if (!shippingAddress) {
    await safeCartCleanup(itemsAddedToCart, apiHeaders);
    throw new Error("No valid shipping address found");
  }

  await processCheckout(shippingAddress.qid, apiHeaders);
  const orderCompletion = await completeOrder(apiHeaders);

  // Update database
  await updateOrderInDatabase(orderId, orderCompletion);

  return {
    qogitaOrderId: orderCompletion.qid,
    orderSummary: results,
    orderCompletion,
  };
}

module.exports = {
  processOrderCore,
  handleApiError,
  processCartItems,
  getShippingAddress,
  processCheckout,
  updateOrderInDatabase,
  completeOrder,
  safeCartCleanup,
};
