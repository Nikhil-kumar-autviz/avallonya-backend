const mongoose = require("mongoose");

const sellerOffersSchema = new mongoose.Schema({
  seller: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
  inventory: {
    type: Number,
    required: true,
  },
  mov: {
    type: String,
    default: "0",
  },
  movCurrency: {
    type: String,
    default: "",
  },
  movProgress: {
    type: String,
    default: "0",
  },
  finalOrderValue: {
    type: String,
    default: "0",
  },
  minQuantity: {
    type: Number,
    default: 1,
  },
  unit: {
    type: Number,
    required: true,
  },
  priceCurrency: {
    type: String,
    default: "USD",
  },
  qid: {
    type: String,
    required: true,
  },
  quantityInCart: {
    type: Number,
    default: 0,
  },
  isTraceable: {
    type: Boolean,
    default: false,
  },
  quantityPurchase: {
    type: Number,
    default: 0,
  },
}, { _id: false,versionKey:false,strict:false }); 


sellerOffersSchema.index({seller:1})

const cartItemSchema = new mongoose.Schema(
  {
    gtin: {
      type: String,
      required: [true, "GTIN is required"],
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
    },
    imageUrl: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "",
    },
    brand: {
      type: String,
      default: "",
    },
    // quantity: {
    //   type: Number,
    //   required: [true, "Quantity is required"],
    //   min: [1, "Quantity must be at least 1"],
    //   default: 1,
    // },
    slug: {
      type: String,
    },
    fid: {
      type: String,
    },
    selectedSellerOffers:[sellerOffersSchema],
    // Timestamps
    addedAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false, timestamps: true }
);
cartItemSchema.index({ _id: 1 });
cartItemSchema.index({gtin:1})

const CartItem = mongoose.model("CartItem", cartItemSchema);
module.exports = CartItem;
