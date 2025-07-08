const sendEmail = require("../utils/sendEmail");

module.exports.orderCancellationEmail = (orderData) => {
  const frontendUrl = process.env.FRONTEND_URL;

  const message = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333333; line-height: 1.6;">
  <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #eeeeee;">
   <img src="${process.env.BASE_URL}/logo.png" alt="Company logo" style="width: 100px; height: 100px;">
  </div>
  
  <div style="padding: 20px 0;">
    <h2 style="color: #333333;">Order Cancellation Confirmation</h2>
    <p>Dear ${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName},</p>
    <p>We're sorry to see you go! Your order <strong>#${orderData.orderNumber}</strong> has been successfully cancelled.</p>
    
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; font-size: 18px; font-weight: bold;">
      Order Number: ${orderData.orderNumber}
    </div>
    
    <h3 style="color: #333333; margin-bottom: 10px;">Cancelled Items</h3>
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
        ${orderData.items.map(
          (item) => `
        <tr>
          <td style="padding: 10px; text-align: left; border-bottom: 1px solid #eeeeee;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <img src="${item.imageUrl}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;">
              <div>
                <strong>${item.name}</strong><br>
                <small style="color: #777777;">${item.brand}</small>
              </div>
            </div>
          </td>
          <td style="padding: 10px; text-align: left; border-bottom: 1px solid #eeeeee;">${item.quantity}</td>
          <td style="padding: 10px; text-align: left; border-bottom: 1px solid #eeeeee;">${parseFloat(item.price).toFixed(2)} ${orderData.currency}</td>
          <td style="padding: 10px; text-align: left; border-bottom: 1px solid #eeeeee;">${parseFloat(item.subtotal).toFixed(2)} ${orderData.currency}</td>
        </tr>
        `
        ).join("")}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="padding: 10px; text-align: right; border-bottom: 1px solid #eeeeee;"><strong>Subtotal:</strong></td>
          <td style="padding: 10px; text-align: left; border-bottom: 1px solid #eeeeee;">${orderData.subtotal} ${orderData.currency}</td>
        </tr>
        <tr>
          <td colspan="3" style="padding: 10px; text-align: right; border-bottom: 1px solid #eeeeee;"><strong>Shipping:</strong></td>
          <td style="padding: 10px; text-align: left; border-bottom: 1px solid #eeeeee;">${orderData.shipping} ${orderData.currency}</td>
        </tr>
        <tr>
          <td colspan="3" style="padding: 10px; text-align: right; border-bottom: 1px solid #eeeeee;"><strong>Tax:</strong></td>
          <td style="padding: 10px; text-align: left; border-bottom: 1px solid #eeeeee;">${orderData.tax} ${orderData.currency}</td>
        </tr>
        <tr>
          <td colspan="3" style="padding: 10px; text-align: right;"><strong>Refund Amount:</strong></td>
          <td style="padding: 10px; text-align: left;">${orderData.totalAmount?.toFixed(2)} ${orderData.currency}</td>
        </tr>
      </tfoot>
    </table>
    
    <h3 style="color: #333333; margin-bottom: 10px;">Cancellation Details</h3>
    <p>Your refund will be processed within 3-5 business days and credited back to your original payment method.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${frontendUrl}/order-history" style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
        View Order History
      </a>
    </div>
    
    <p>If you didn't request this cancellation or have any questions, please reply to this email.</p>
    <p>We hope to serve you again in the future!</p>
  </div>
  
  <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eeeeee; font-size: 12px; color: #777777;">
    <p>© ${new Date().getFullYear()} Avallonya. All rights reserved.</p>
  </div>
</div>
  `;

  sendEmail({
    email: orderData.shippingAddress.email,
    subject: `Cancellation Confirmation for Order #${orderData.orderNumber}`,
    message: message,
  });
};

module.exports.orderDispatchEmail = (orderData) => {
  const frontendUrl = process.env.FRONTEND_URL;

  const message = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333333; line-height: 1.6;">
  <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #eeeeee;">
   <img src="${process.env.BASE_URL}/logo.png" alt="Company logo" style="width: 100px; height: 100px;">
  </div>
  
  <div style="padding: 20px 0;">
    <h2 style="color: #333333;">Your Order Has Been Dispatched!</h2>
    <p>Dear ${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName},</p>
    <p>Great news! Your order <strong>#${orderData.orderNumber}</strong> is on its way to you.</p>
    
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
        ${orderData.items.map(
          (item) => `
        <tr>
          <td style="padding: 10px; text-align: left; border-bottom: 1px solid #eeeeee;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <img src="${item.imageUrl}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;">
              <div>
                <strong>${item.name}</strong><br>
                <small style="color: #777777;">${item.brand}</small>
              </div>
            </div>
          </td>
          <td style="padding: 10px; text-align: left; border-bottom: 1px solid #eeeeee;">${item.quantity}</td>
          <td style="padding: 10px; text-align: left; border-bottom: 1px solid #eeeeee;">${parseFloat(item.price).toFixed(2)} ${orderData.currency}</td>
          <td style="padding: 10px; text-align: left; border-bottom: 1px solid #eeeeee;">${parseFloat(item.subtotal).toFixed(2)} ${orderData.currency}</td>
        </tr>
        `
        ).join("")}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="padding: 10px; text-align: right; border-bottom: 1px solid #eeeeee;"><strong>Subtotal:</strong></td>
          <td style="padding: 10px; text-align: left; border-bottom: 1px solid #eeeeee;">${orderData.subtotal} ${orderData.currency}</td>
        </tr>
        <tr>
          <td colspan="3" style="padding: 10px; text-align: right; border-bottom: 1px solid #eeeeee;"><strong>Shipping:</strong></td>
          <td style="padding: 10px; text-align: left; border-bottom: 1px solid #eeeeee;">${orderData.shipping} ${orderData.currency}</td>
        </tr>
        <tr>
          <td colspan="3" style="padding: 10px; text-align: right; border-bottom: 1px solid #eeeeee;"><strong>Tax:</strong></td>
          <td style="padding: 10px; text-align: left; border-bottom: 1px solid #eeeeee;">${orderData.tax} ${orderData.currency}</td>
        </tr>
        <tr>
          <td colspan="3" style="padding: 10px; text-align: right;"><strong>Total:</strong></td>
          <td style="padding: 10px; text-align: left;">${orderData.totalAmount?.toFixed(2)} ${orderData.currency}</td>
        </tr>
      </tfoot>
    </table>
    
    <h3 style="color: #333333; margin-bottom: 10px;">Shipping Information</h3>
    <p style="margin: 5px 0;">
      ${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}<br>
      ${orderData.shippingAddress.streetAddress}<br>
      ${orderData.shippingAddress.townCity}, ${orderData.shippingAddress.state} ${orderData.shippingAddress.zip}<br>
      ${orderData.shippingAddress.countryRegion}<br>
      Phone: ${orderData.shippingAddress.phone}
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${frontendUrl}/order-tracking?orderId=${orderData._id}" style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
        Track Your Order
      </a>
    </div>
    
    <p>Your package should arrive within the estimated delivery timeframe. We'll notify you when it's delivered.</p>
    <p>Thank you for shopping with us!</p>
  </div>
  
  <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eeeeee; font-size: 12px; color: #777777;">
    <p>© ${new Date().getFullYear()} Avallonya. All rights reserved.</p>
  </div>
</div>
  `;
console.log(orderData.shippingAddress.email)

  sendEmail({
    email: orderData.shippingAddress.email,
    subject: `Your Order #${orderData.orderNumber} Has Been Dispatched!`,
    message: message,
  });
};

module.exports.orderDeliveredEmail = (orderData) => {
  const frontendUrl = process.env.FRONTEND_URL;

  const message = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333333; line-height: 1.6;">
  <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #eeeeee;">
   <img src="${process.env.BASE_URL}/logo.png" alt="Company logo" style="width: 100px; height: 100px;">
  </div>
  
  <div style="padding: 20px 0;">
    <h2 style="color: #333333;">Your Order Has Been Delivered!</h2>
    <p>Dear ${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName},</p>
    <p>We're happy to let you know that your order <strong>#${orderData.orderNumber}</strong> has been successfully delivered.</p>
    
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; font-size: 18px; font-weight: bold;">
      Order Number: ${orderData.orderNumber}
    </div>
    
    <h3 style="color: #333333; margin-bottom: 10px;">Delivered Items</h3>
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
        ${orderData.items.map(
          (item) => `
        <tr>
          <td style="padding: 10px; text-align: left; border-bottom: 1px solid #eeeeee;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <img src="${item.imageUrl}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;">
              <div>
                <strong>${item.name}</strong><br>
                <small style="color: #777777;">${item.brand}</small>
              </div>
            </div>
          </td>
          <td style="padding: 10px; text-align: left; border-bottom: 1px solid #eeeeee;">${item.quantity}</td>
          <td style="padding: 10px; text-align: left; border-bottom: 1px solid #eeeeee;">${parseFloat(item.price).toFixed(2)} ${orderData.currency}</td>
          <td style="padding: 10px; text-align: left; border-bottom: 1px solid #eeeeee;">${parseFloat(item.subtotal).toFixed(2)} ${orderData.currency}</td>
        </tr>
        `
        ).join("")}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="padding: 10px; text-align: right; border-bottom: 1px solid #eeeeee;"><strong>Subtotal:</strong></td>
          <td style="padding: 10px; text-align: left; border-bottom: 1px solid #eeeeee;">${orderData.subtotal} ${orderData.currency}</td>
        </tr>
        <tr>
          <td colspan="3" style="padding: 10px; text-align: right; border-bottom: 1px solid #eeeeee;"><strong>Shipping:</strong></td>
          <td style="padding: 10px; text-align: left; border-bottom: 1px solid #eeeeee;">${orderData.shipping} ${orderData.currency}</td>
        </tr>
        <tr>
          <td colspan="3" style="padding: 10px; text-align: right; border-bottom: 1px solid #eeeeee;"><strong>Tax:</strong></td>
          <td style="padding: 10px; text-align: left; border-bottom: 1px solid #eeeeee;">${orderData.tax} ${orderData.currency}</td>
        </tr>
        <tr>
          <td colspan="3" style="padding: 10px; text-align: right;"><strong>Total:</strong></td>
          <td style="padding: 10px; text-align: left;">${orderData.totalAmount?.toFixed(2)} ${orderData.currency}</td>
        </tr>
      </tfoot>
    </table>
    
    <h3 style="color: #333333; margin-bottom: 10px;">Delivery Details</h3>
    <p style="margin: 5px 0;">
      Delivered to:<br>
      ${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}<br>
      ${orderData.shippingAddress.streetAddress}<br>
      ${orderData.shippingAddress.townCity}, ${orderData.shippingAddress.state} ${orderData.shippingAddress.zip}<br>
      ${orderData.shippingAddress.countryRegion}
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${frontendUrl}/order-feedback?orderId=${orderData._id}" style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
        Leave Feedback
      </a>
    </div>
    
    <p>We hope you're satisfied with your purchase. If you have any issues, please contact our support team within 14 days of delivery.</p>
    <p>Thank you for shopping with us!</p>
  </div>
  
  <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eeeeee; font-size: 12px; color: #777777;">
    <p>© ${new Date().getFullYear()} Avallonya. All rights reserved.</p>
  </div>
</div>
  `;
console.log(orderData.shippingAddress.email)
  sendEmail({
    email: orderData.shippingAddress.email,
    subject: `Your Order #${orderData.orderNumber} Has Been Delivered!`,
    message: message,
  });
};