const router = require("express").Router();
const authRoutes = require("./authRoutes");
const productRoutes = require("./productRoutes");
const cartRoutes = require("./cartRoutes");
const orderRoutes = require("./orderRoutes");
const addressRoutes = require("./addressRoutes");
const profileRoutes = require("./profileRoutes");
const adminRoutes = require("./adminRoutes");
const { getSingleDynamicContent } = require("../controllers/adminController");

router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/addresses", addressRoutes);
router.use("/profile", profileRoutes);
router.use("/admin",adminRoutes);
router.get("/get-content/:key",getSingleDynamicContent);

module.exports = router;
