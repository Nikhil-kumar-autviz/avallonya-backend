const mongoose = require("mongoose");
const CartItem = require("./CartItemsModel");

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    items: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CartItem",
      },
    ],
    totalItems: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true, versionKey: false }
);

// Pre-save hook to recalculate total items
cartSchema.pre("save", async function (next) {
  await this.populate("items");
  this.totalItems = this.items.reduce(
    (total, item) =>
      total +
      item.selectedSellerOffers.reduce(
        (sum, seller) => sum + seller.quantityPurchase,
        0
      ),
    0
  );
  next();
});

// Add or update item
cartSchema.methods.addItem = async function (itemData) {
  await this.populate("items");
  const existingItem = this.items.find((item) => item.gtin === itemData.gtin);
  if (existingItem) {
    const existingOfferIndex = existingItem.selectedSellerOffers.findIndex(
      (offer) => offer.seller === itemData.sellerOffers.seller
    );
    if (existingOfferIndex !== -1) {
      const existingOffer =
        existingItem.selectedSellerOffers[existingOfferIndex];
      const incomingOffer = itemData.sellerOffers;
      existingItem.selectedSellerOffers[existingOfferIndex] = {
        ...existingOffer,
        ...incomingOffer,
        quantityPurchase:
          (existingOffer.quantityPurchase || 0) +
          (incomingOffer.quantityPurchase || 0),
      };
    } else {
      existingItem.selectedSellerOffers.push(itemData.sellerOffers);
    }
    existingItem.quantity += itemData.quantity || 1;
    await existingItem.save();
  } else {
    console.log("save new item");
    const newItem = await CartItem.create({
      ...itemData,
      selectedSellerOffers: [itemData.sellerOffers],
    });
    this.items.push(newItem._id);
  }
  return this.save();
};

// Update item quantity
cartSchema.methods.updateItemQuantity = async function (itemId, seller, newQuantityPurchase) {
  await this.populate("items");
  const existingItem = this.items.find((item) => item.id === itemId);
  if (!existingItem) throw new Error("Item not found in cart");

  const offerIndex = existingItem.selectedSellerOffers.findIndex(
    (offer) => offer.seller.toString() === seller.toString()
  );

  if (offerIndex === -1) throw new Error("Seller offer not found for this item");

  // Update quantity for specific seller offer
  existingItem.selectedSellerOffers[offerIndex].quantityPurchase = newQuantityPurchase;

  // Recalculate total quantity of item by summing all sellerOffers
  existingItem.quantity = existingItem.selectedSellerOffers.reduce(
    (acc, offer) => acc + (offer.quantityPurchase || 0),
    0
  );

  await existingItem.save();
  return this.save();
};

// Remove item from cart
cartSchema.methods.removeItem = async function (itemId, seller) {
  await this.populate("items");

  const existingItem = this.items.find((item) => item.id === itemId);
  if (!existingItem) throw new Error("Item not found in cart");

  if (seller) {
    // Remove only the seller offer from selectedSellerOffers
    existingItem.selectedSellerOffers = existingItem.selectedSellerOffers.filter(
      (offer) => offer.seller.toString() !== seller.toString()
    );

    // Recalculate item quantity
    existingItem.quantity = existingItem.selectedSellerOffers.reduce(
      (acc, offer) => acc + (offer.quantityPurchase || 0),
      0
    );

    // If no seller offers left, remove whole item
    if (existingItem.selectedSellerOffers.length === 0) {
      this.items.pull(existingItem._id);
      await CartItem.findByIdAndDelete(existingItem._id);
    } else {
      await existingItem.save();
    }
  } else {
    // Remove entire item
    this.items.pull(existingItem._id);
    await CartItem.findByIdAndDelete(existingItem._id);
  }

  return this.save();
};


// Clear all items
cartSchema.methods.clearCart = async function () {
  await CartItem.deleteMany({ _id: { $in: this.items } });
  this.items = [];
  return this.save();
};

// Static: find or create cart with populated user/items
cartSchema.statics.findOrCreateForUser = async function (userId) {
  let cart = await this.findOne({ user: userId })
    .populate({
      path: "items",
      populate: {
        path: "selectedSellerOffers",
      },
    })
    .populate("user");

  if (!cart) {
    cart = await this.create({ user: userId, items: [] });
    cart = await this.findById(cart._id)
      .populate({
        path: "items",
        populate: {
          path: "selectedSellerOffers",
        },
      })
      .populate("user");
  }

  return cart;
};

module.exports = mongoose.model("Cart", cartSchema);
