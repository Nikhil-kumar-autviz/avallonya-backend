const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a name"],
    trim: true,
    maxlength: [50, "Name cannot be more than 50 characters"],
  },
  email: {
    type: String,
    required: [true, "Please add an email"],
    unique: [true, "Email already exists"],
  },
  password: {
    type: String,
    required: [true, "Please add a password"],
    minlength: [6, "Password must be at least 6 characters"],
    select: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isPhoneVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: String,
  verificationExpire: Date,
  phoneVerificationToken: String,
  phoneVerificationExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  role: {
    type: String,
    enum: ["user", "seller"],
    default: "user",
  },
  phone: {
    type: String,
    trim: true,
    required: [true, "Please add a phone number"],
  },
  dialCode: {
    type: String,
    required: [true, "Please add a dial code"],
  },
  companyInfo: {
    shippingCountry: {
      type: String,
      required: [true, "Please add a shipping country"],
    },
    vatNumber: {
      type: String,
      default: "",
    },
    companyName: {
      type: String,
      required: [true, "Please add a company name"],
    },
    countryOfRegistration: {
      type: String,
      required: [true, "Please add country of registration"],
    },
    registrationNumber: {
      type: String,
      required: [true, "Please add a registration number"],
    },
  },
  // Business details
  businessDetails: {
    salesChannels: [
      {
        type: String,
        enum: ["Amazon", "Physical Store", "Dropshipping", "Boutique", "Online Store", "Bulk Trading", "Hospitality", "Use for my business", "Other"],
        required: [true, "Please add at least one sales channel"],
      },
    ],
    annualTurnover: {
      type: String,
      enum: ["< $10k", "$10k - $50k", "$50k - $250k", "$250k - $1M", "$1M+"],
      required: [true, "Please add annual turnover"],
    },
    employeeCount: {
      type: String,
      enum: ["1-10", "11-50", "51-200", "201-500", "500+"],
      required: [true, "Please add employee count"],
    },
    yearFounded: {
      type: String,
      required: [true, "Please add year founded"],
    },
    businessStartDate: {
      type: Date,
      required: [true, "Please add business start date"],
    },
  },
  dateOfBirth: {
    type: Date,
  },
  gender: {
    type: String,
    enum: ["male", "female", "other", "prefer_not_to_say"],
  },
  profileImage: {
    type: String,
  },
  cart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cart",
  },
  orders: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
  ],
  addresses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  wishlist: [String],
});

userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

userSchema.methods.getVerificationToken = function () {
  const rawToken = crypto.randomBytes(20).toString("hex");

  this.verificationToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  this.verificationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Step 3: Include rawToken (NOT hashed) in JWT
  const jwtPayload = {
    email: this.email,
    phone: this.phone || null,
    token: rawToken, // ✅ RAW token
  };

  const jwtToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });

  return jwtToken;
};

userSchema.methods.generatePhoneVerificationToken = function () {
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  this.phoneVerificationToken = crypto.createHash("sha256").update(verificationCode).digest("hex");
  this.phoneVerificationExpire = new Date(Date.now() + 10 * 60 * 1000);
  console.log("Generated token expires at:", this.phoneVerificationExpire);
  return verificationCode;
};

userSchema.methods.verifyPhoneToken = async function (token) {
  if (!token || typeof token !== "string") {
    throw new Error("Invalid verification token");
  }
  if (!this.phoneVerificationToken || !this.phoneVerificationExpire) {
    throw new Error("No verification process was started");
  }
  const isExpired = new Date(this.phoneVerificationExpire).getTime() < Date.now();
  if (isExpired) {
    this.phoneVerificationToken = undefined;
    this.phoneVerificationExpire = undefined;
    await this.save({ validateBeforeSave: false });
    throw new Error("Verification code has expired");
  }
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  if (hashedToken !== this.phoneVerificationToken) {
    throw new Error("Invalid verification code");
  }
  this.isPhoneVerified = true;
  this.phoneVerificationToken = undefined;
  this.phoneVerificationExpire = undefined;
  await this.save({ validateBeforeSave: false });
  return true;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
