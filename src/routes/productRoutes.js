const express = require('express');
const {
  getBrands,
  getCategories,
  searchProducts,
  getProductById,
  getProductByGtin,
  searchProductsByTerm,
} = require('../controllers/productController');

const router = express.Router();

// Get all brands
router.get('/brands', getBrands);

// Get product categories
router.get('/categories', getCategories);

// Search products (variants) with filters
router.get('/search', searchProducts);

// Search products by term
router.get('/search/:term', searchProductsByTerm);

// Get a product by GTIN
router.get('/gtin/:gtin', getProductByGtin);

// Get a single product (variant) by ID
router.get('/:id', getProductById);


module.exports = router;
