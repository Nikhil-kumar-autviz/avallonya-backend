const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const bcrypt=require("bcryptjs")
// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(" ")[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

exports.isAdmin = async (req, res, next) => {
  const hashedToken = req.headers["x-token-hash"];

  if (!hashedToken) {
    return res.status(401).json({ error: "Missing token hash" });
  }


  const isValid = await bcrypt.compare(process.env.QOGITA_EMAIL, hashedToken);
  if (!isValid) {
    return res.status(403).json({ error: "Invalid token" });
  }

  req.isAdmin = true;
  next();
};
