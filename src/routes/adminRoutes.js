const {
  updateCategoryByQid,
  getCategoriesFromDBAdmin,
  getNewCategoriesFromAPIAdmin,
  getAllUsersOrders,
  createCartAndPlaceOrder,
  cancelCustomerOrderFromAdminPortal,
} = require("../controllers/adminController");
const { validateUpdateCategory } = require("../middleware/express-validators");
const router = require("express").Router();
router.get("/all-products-categories", getCategoriesFromDBAdmin);
router.get("/get-qogita-categories", getNewCategoriesFromAPIAdmin);
router.put("/all-products-categories/:qid",validateUpdateCategory, updateCategoryByQid);
router.get("/get-all-user-orders", getAllUsersOrders);
router.post("/create-cart-and-checkout",createCartAndPlaceOrder)
router.put('/cancel-customer-order',cancelCustomerOrderFromAdminPortal)

module.exports = router;
