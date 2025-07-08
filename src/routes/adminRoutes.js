const adminController = require("../controllers/adminController");
const { isAdmin } = require("../middleware/auth");
const { validateUpdateCategory } = require("../middleware/express-validators");
const router = require("express").Router();
router.post("/login", adminController.adminLogin);
router.get(
  "/all-products-categories",isAdmin,
  adminController.getCategoriesFromDBAdmin
);
router.get(
  "/get-qogita-categories",isAdmin,
  adminController.getNewCategoriesFromAPIAdmin
);
router.put(
  "/all-products-categories/:qid",
  validateUpdateCategory,isAdmin,
  adminController.updateCategoryByQid
);
router.get("/get-all-user-orders",isAdmin, adminController.getAllUsersOrders);
router.get("/get-order/:id",isAdmin, adminController.getUserSingleOrder);
router.post(
  "/create-cart-and-checkout",isAdmin,
  adminController.createCartAndPlaceOrder
);
router.put("/cancel-customer-order",isAdmin, adminController.cancelOrder);
router.put("/dispatch-customer-order/:orderId",isAdmin, adminController.dispatchOrder);
router.put("/complete-customer-order/:orderId",isAdmin, adminController.completeOrder);

module.exports = router;
