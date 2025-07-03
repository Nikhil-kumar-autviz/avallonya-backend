const Order = require("../models/orderModel");
const sendEmail = require("../utils/sendEmail");
const { qogitaApi, getValidAccessToken } = require("./qogitaService");

const orderConfirmationEmail = (orderData) => {
  const frontendUrl = process.env.FRONTEND_URL;

  const message = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333333; line-height: 1.6;">
  <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #eeeeee;">
   <img src="${process.env.BASE_URL}/logo.png" alt="Compnay logo" style="width: 100px; height: 100px;">
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
