const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot be more than 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot be more than 50 characters']
  },
  companyName: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot be more than 100 characters']
  },
  streetAddress: {
    type: String,
    required: [true, 'Street address is required'],
    trim: true,
    maxlength: [200, 'Street address cannot be more than 200 characters']
  },
  townCity: {
    type: String,
    required: [true, 'Town/City is required'],
    trim: true,
    maxlength: [100, 'Town/City cannot be more than 100 characters']
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
    maxlength: [100, 'State cannot be more than 100 characters']
  },
  zip: {
    type: String,
    required: [true, 'ZIP code is required'],
    trim: true,
    maxlength: [20, 'ZIP code cannot be more than 20 characters']
  },
  countryRegion: {
    type: String,
    required: [true, 'Country/Region is required'],
    trim: true,
    maxlength: [100, 'Country/Region cannot be more than 100 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    maxlength: [20, 'Phone number cannot be more than 20 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  addressType: {
    type: String,
    enum: ['home', 'work', 'other'],
    default: 'home'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
addressSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Ensure only one default address per user
addressSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    // Remove default flag from other addresses of the same user
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

// Index for faster queries
addressSchema.index({ user: 1 });
addressSchema.index({ user: 1, isDefault: 1 });

module.exports = mongoose.model('Address', addressSchema);
