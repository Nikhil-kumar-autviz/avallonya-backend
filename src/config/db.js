const mongoose = require('mongoose');
const logger = require('../utils/logger');
const Admin = require('../models/adminModel');


const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
      Admin.seedAdmin()
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
      logger.error("Database connection failed:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
