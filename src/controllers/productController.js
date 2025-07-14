const User = require("../models/userModel");
const productService = require("../services/productService");

/**
 * @swagger
 * /api/products/brands:
 *   get:
 *     summary: Get all brands
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: page_size
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: slug
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         style: form
 *         explode: true
 *         description: Filter by brand slugs (can be multiple)
 *       - in: query
 *         name: premium
 *         schema:
 *           type: boolean
 *         description: Filter by premium status (true/false)
 *     responses:
 *       200:
 *         description: List of brands
 *       500:
 *         description: Server error
 */
exports.getBrands = async (req, res) => {
  try {
    const brands = await productService.getBrands(req.query);

    res.status(200).json({
      success: true,
      data: brands,
    });
  } catch (error) {
    console.error("Product controller error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching brands",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/products/categories:
 *   get:
 *     summary: Get product categories
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: page_size
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: slug
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         style: form
 *         explode: true
 *         description: Filter by category slugs (can be multiple)
 *     responses:
 *       200:
 *         description: List of categories
 *       500:
 *         description: Server error
 */
exports.getCategories = async (req, res) => {
  try {
    const categories = await productService.getCategories(req.query);

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Product controller error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/products/search:
 *   get:
 *     summary: Search products (variants)
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: General search query term
 *       - in: query
 *         name: category_name
 *         schema:
 *           type: string
 *         description: Filter by category name
 *       - in: query
 *         name: brand_name
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         explode: true
 *         style: form
 *         description: Filter by brand name(s). Can be provided multiple times to filter for multiple brands (e.g., ?brand_name=Apple&brand_name=Samsung)
 *       - in: query
 *         name: category_slug
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         explode: true
 *         style: form
 *         description: Filter by category slug(s). Can be specified multiple times for different slugs (e.g., ?category_slug=health-beauty&category_slug=makeup)
 *       - in: query
 *         name: min_price
 *         schema:
 *           type: number
 *         description: Filter by minimum price
 *       - in: query
 *         name: max_price
 *         schema:
 *           type: number
 *         description: Filter by maximum price
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: page_size
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Search results
 *       500:
 *         description: Server error
 */
exports.searchProducts = async (req, res) => {
  try {
    // Log the incoming query parameters
    console.log("Search products query parameters:", req.query);

    // Call the product service to search for products
    const products = await productService.searchProducts(req.query);

    // Return the search results
    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Product controller error:", error);

    // Handle specific error responses
    if (error.response) {
      return res.status(error.response.status || 500).json({
        success: false,
        message: "Error from Qogita API",
        error: error.response.data || error.message,
      });
    }

    // Handle general errors
    res.status(500).json({
      success: false,
      message: "Error searching products",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get a product (variant) by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID (QID)
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
exports.getProductById = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Product controller error:", error);

    // Handle 404 errors from Qogita API
    if (error.response && error.response.status === 404) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error fetching product",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/products/gtin/{gtin}:
 *   get:
 *     summary: Get a product by GTIN
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: gtin
 *         required: true
 *         schema:
 *           type: string
 *         description: Product GTIN
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
exports.getProductByGtin = async (req, res) => {
  try {
    const product = await productService.getProductByGtin(req.params.gtin);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Product controller error:", error);

    // Handle 404 errors from Qogita API
    if (error.response && error.response.status === 404) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error fetching product by GTIN",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/products/search/{term}:
 *   get:
 *     summary: Search products by term
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: term
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: page_size
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Search results
 *       500:
 *         description: Server error
 */
exports.searchProductsByTerm = async (req, res) => {
  try {
    // Log the incoming search term and query parameters
    console.log("Search term:", req.params.term);
    console.log("Search query parameters:", req.query);

    // Call the product service to search for products by term
    const products = await productService.searchProductsByTerm(
      req.params.term,
      req.query
    );

    // Return the search results
    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Product controller error:", error);

    // Handle specific error responses
    if (error.response) {
      return res.status(error.response.status || 500).json({
        success: false,
        message: "Error from Qogita API",
        error: error.response.data || error.message,
      });
    }

    // Handle general errors
    res.status(500).json({
      success: false,
      message: "Error searching products by term",
      error: error.message,
    });
  }
};

// POST /api/wishlist/toggle
module.exports.toggleWishlist = async (req, res) => {
  const { productId } = req.body;
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (!Array.isArray(user.wishlist)) {
      user.wishlist = [];
    }
    const productIndex = user.wishlist.findIndex(id => id.toString() === productId);
    let action = "";

    if (productIndex > -1) {
      user.wishlist.splice(productIndex, 1);
      action = "removed";
    } else {
      user.wishlist.push(productId);
      action = "added";
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: `Product ${action} from wishlist`,
      wishlist: user.wishlist
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports.getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user?._id).populate("wishlist");
    if (!user) return res.status(404).send("User not found");

    res.json({ wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
