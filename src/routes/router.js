const router = require("express").Router();
const authRoutes = require("./authRoutes");
const productRoutes = require("./productRoutes");
const cartRoutes = require("./cartRoutes");
const orderRoutes = require("./orderRoutes");
const addressRoutes = require("./addressRoutes");
const profileRoutes = require("./profileRoutes");
const adminRoutes = require("./adminRoutes");
const { protect, isAdmin } = require("../middleware/auth");
router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/addresses", addressRoutes);
router.use("/profile", profileRoutes);
router.use("/admin",
    //  protect, isAdmin,
      adminRoutes);

module.exports = router;
