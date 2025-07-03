const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  gtin: { type: String, required: true },
  name: { type: String, required: true },
  imageUrl: { type: String },
  category: { type: String },
  brand: { type: String },
  selectedSize: { type: String, default: "" },
  selectedColor: { type: String, default: "" },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  subtotal: { type: Number },
  seller: { type: String },
  sellerData: {
    price: { type: Number },
    mov: { type: Number },
    movCurrency: { type: String },
    inventory: { type: Number },
    isTraceable: { type: Boolean },
    qid: { type: String },
    finalOrderValue: { type: Number }
  },
  productSnapshot: {
    addedAt: { type: Date, default: Date.now },
    isInStock: { type: Boolean, default: true }
  }
}, { strict: false });

// Address snapshot schema for historical record
const addressSnapshotSchema = new mongoose.Schema({
  // Reference to the original address (if still exists)
  addressId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Address",
    default: null,
  },
  // Snapshot of address data at time of order
  firstName: {
    type: String,
    required: [true, "First name is required"],
  },
  lastName: {
    type: String,
    required: [true, "Last name is required"],
  },
  companyName: {
    type: String,
    default: "",
  },
  streetAddress: {
    type: String,
    required: [true, "Street address is required"],
  },
  townCity: {
    type: String,
    required: [true, "Town/City is required"],
  },
  state: {
    type: String,
    required: [true, "State is required"],
  },
  zip: {
    type: String,
    required: [true, "ZIP code is required"],
  },
  countryRegion: {
    type: String,
    required: [true, "Country/Region is required"],
  },
  phone: {
    type: String,
    required: [true, "Phone number is required"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
  },
  addressType: {
    type: String,
    enum: ["home", "work", "other"],
    default: "home",
  },
});

const orderSchema = new mongoose.Schema(
  {
    // Order identification
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },

    // Order items
    items: [orderItemSchema],

    // Order totals
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      default: 0,
    },
    shipping: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
    },

    // Order status
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      default: "pending",
    },

    // Payment information
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    paymentMethod: {
      type: String,
      enum: [
        "credit_card",
        "debit_card",
        "paypal",
        "stripe",
        "cash_on_delivery",
      ],
      default: "credit_card",
    },

    paymentId: {
      type: String, // Payment gateway transaction ID
      default: null,
    },

    // Shipping information
    shippingAddress: addressSnapshotSchema,
    shippingMethod: {
      type: String,
      enum: ["standard", "express", "overnight", "pickup"],
      default: "standard",
    },
    trackingNumber: {
      type: String,
      default: null,
    },

    // Order notes
    notes: {
      type: String,
      default: "",
    },
    adminNotes: {
      type: String,
      default: "",
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    shippedAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
  },
  { strict: false }
);

// Generate order number and calculate totals before saving
orderSchema.pre("save", function (next) {
  // Generate order number for new orders

  console.log(this, "this");
  if (this.isNew && !this.orderNumber) {
    // Generate order number: ORD-YYYYMMDD-XXXXX

    console.log("creating order number");

    const date = new Date();
    const dateStr =
      date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, "0") +
      date.getDate().toString().padStart(2, "0");
    const randomNum = Math.floor(Math.random() * 99999)
      .toString()
      .padStart(5, "0");
    this.orderNumber = `ORD-${dateStr}-${randomNum}`;
  }

  // Only recalculate if subtotal is not already set or is invalid
  if (!this.subtotal || isNaN(this.subtotal)) {
    this.subtotal = this.items.reduce((total, item) => {
      const itemSubtotal = item.subtotal || 0;
      return total + (isNaN(itemSubtotal) ? 0 : itemSubtotal);
    }, 0);
  }

  // Ensure all values are numbers and not NaN
  const subtotal = isNaN(this.subtotal) ? 0 : this.subtotal;
  const tax = isNaN(this.tax) ? 0 : this.tax;
  const shipping = isNaN(this.shipping) ? 0 : this.shipping;
  const discount = isNaN(this.discount) ? 0 : this.discount;

  this.totalAmount = subtotal + tax + shipping - discount;
  this.updatedAt = Date.now();
  next();
});

// Instance method to update order status
orderSchema.methods.updateStatus = function (status, notes = "") {
  this.status = status;
  if (notes) {
    this.adminNotes = notes;
  }

  // Set timestamps based on status
  if (status === "accepted" && !this.acceptedAt) {
    this.acceptedAt = Date.now();
  } else if (status === "shipped" && !this.shippedAt) {
    this.shippedAt = Date.now();
  } else if (status === "delivered" && !this.deliveredAt) {
    this.deliveredAt = Date.now();
  }

  return this.save();
};

// Instance method to update payment status
orderSchema.methods.updatePaymentStatus = function (
  paymentStatus,
  paymentId = null
) {
  this.paymentStatus = paymentStatus;
  if (paymentId) {
    this.paymentId = paymentId;
  }
  return this.save();
};

// Static method to get orders by user
orderSchema.statics.getOrdersByUser = function (userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return this.find({ user: userId })
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

orderSchema.statics.getOrdersOfAllUser = async function (page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const allOrders = await this.find()
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  const filteredStatusFromDatabase = await this.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);
  const packageStatus = filteredStatusFromDatabase?.reduce(
    (acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    },
    { accepted: 0, cancelled: 0, pending: 0, completed: 0, rejected: 0 }
  );
  
  return { allOrders, packageStatus };
};

module.exports = mongoose.model("Order", orderSchema);
