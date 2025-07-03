const mongoose = require('mongoose');

const QogitaTokenSchema = new mongoose.Schema({
  accessToken: {
    type: String,
    required: true
  },
  accessExp: {
    type: Number,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  signature: {
    type: String,
    required: true
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

// Update the updatedAt field on save
QogitaTokenSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('QogitaToken', QogitaTokenSchema);
