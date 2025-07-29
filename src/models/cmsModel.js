const mongoose = require("mongoose");

const ContentSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed, 
    required: true,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});
const Content=mongoose.model("Content", ContentSchema);
module.exports = Content