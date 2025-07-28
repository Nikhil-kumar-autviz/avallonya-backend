const Category = require("../models/categoryModel");
const Order = require("../models/orderModel");
const { makeAuthenticatedRequest } = require("../services/qogitaService");
const { processOrderCore } = require("../services/adminServices");
const logger = require("../utils/logger");
const {
  orderCancellationEmail,
  orderDispatchEmail,
  orderDeliveredEmail,
} = require("../template/orders.template");
const Admin = require("../models/adminModel");
const qogitaTokenModel = require("../models/qogitaTokenModel");
const User = require("../models/userModel");

// exports.getAllCategoriesForAdmin = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const skip = (page - 1) * limit;
//     const { count } = await qogitaService.makeAuthenticatedRequest('get', '/categories');
//     const endpoint = `/categories?size=${count}`;
//     const { results } = await qogitaService.makeAuthenticatedRequest('get', endpoint);
//     const qids = results?.map(item => item?.qid);
//     const existingCategories = await Category.find({ qid: { $in: qids } }).lean();
//     const existingQids = new Set(existingCategories.map(cat => cat.qid));
//     const newCategories = results.filter(item => !existingQids.has(item.qid)).map(item => ({
//       categoryName: item.name,
//       slug: item.slug,
//       qid: item.qid,
//       weightCost: 0,
//       heightCost: 0,
//      }));

//     if (newCategories.length > 0) {
//       await Category.insertMany(newCategories);
//     }

//     const [paginatedCategories, totalCount] = await Promise.all([
//       Category.find({ qid: { $in: qids } })
//         .skip(skip)
//         .limit(limit)
//         .sort({ createdAt: -1 }),
//       Category.countDocuments({ qid: { $in: qids } }),
//     ]);

//     res.status(200).json({
//       results: paginatedCategories,
//       count: totalCount,
//       currentPage: page,
//       totalPages: Math.ceil(totalCount / limit),
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching and syncing categories',
//       message: error.message,
//     });
//   }
// };

module.exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }
    const admin = await Admin.findByCredentials(email, password);
    if (!admin) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    const token = admin.generateAuthToken();
    const qogitaAdminDetails = await qogitaTokenModel
      .findOne({ "user.email": email })
      .sort({ _id: -1 });
    res.status(200).json({
      user: qogitaAdminDetails?.user,
      role: admin.role,
      token,
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ error: "Login failed. Please try again later." });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;     
    const limit = parseInt(req.query.limit) || 10; 
    const skip = (page - 1) * limit;

    const totalUsers = await User.countDocuments(); 
    const totalPages = Math.ceil(totalUsers / limit);

    const users = await User.find({}, "-password -__v")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      page,
      limit,
      totalUsers,
      totalPages,
      users,
    });
  } catch (err) {
    
    res.status(500).json({ success: false, message: "Server error",error:error?.message });
  }
};

// Get categories from database with pagination
exports.getCategoriesFromDBAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchQuery = req?.query?.search?.toLowerCase() || "";
    const searchRegex = new RegExp(searchQuery, "i");

    const query = {
      $or: [
        { categoryName: { $regex: searchRegex } },
        { slug: { $regex: searchRegex } },
      ],
    };

    const [paginatedCategories, totalCount] = await Promise.all([
      Category.find(searchQuery ? query : {})
        .select("categoryName slug qid weightCost priceCost")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      Category.countDocuments(searchQuery ? query : {}),
    ]);

    res.status(200).json({
      results: paginatedCategories,
      count: totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getNewCategoriesFromAPIAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchQuery = req?.query?.search?.toLowerCase() || "";

    const { count } = await makeAuthenticatedRequest("get", "/categories");
    const endpoint = `/categories?size=${count}`;
    const { results } = await makeAuthenticatedRequest("get", endpoint);

    const qids = results?.map((item) => item?.qid);
    const existingCategories = await Category.find({ qid: { $in: qids } })
      .select("qid")
      .lean();

    const existingQids = new Set(existingCategories.map((cat) => cat.qid));

    // Filter new categories and apply search if provided
    let newCategories = results
      .filter((item) => !existingQids.has(item.qid))
      .map((item) => ({
        categoryName: item.name,
        slug: item.slug,
        qid: item.qid,
        weightCost: 1,
        priceCost: 1,
      }));

    if (searchQuery) {
      newCategories = newCategories.filter(
        (item) =>
          item.categoryName.toLowerCase().includes(searchQuery) ||
          item.slug.toLowerCase().includes(searchQuery)
      );
    }

    const paginatedResults = newCategories.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      currentPage: page,
      count: newCategories.length,
      totalPages: Math.ceil(newCategories.length / limit),
      results: paginatedResults,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.updateCategoryByQid = async (req, res) => {
  try {
    const { qid } = req.params;
    const updateData = req.body;

    const updatedCategory = await Category.findOneAndUpdate(
      { qid },
      updateData,
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    res.status(200).json({
      success: true,
      data: updatedCategory,
      message: "Category updated or created successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllUsersOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const orders = await Order.getOrdersOfAllUser(page, limit);
    const totalOrders = await Order.countDocuments();
    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total: totalOrders,
        pages: Math.ceil(totalOrders / limit),
      },
    });
  } catch (error) {
    console.error("Get orders message:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports.getUserSingleOrder = async (req, res) => {
  try {
    const order = await Order.findById(req?.params?.id);
    await order.populate("user");
    res.status(200).json({
      success: true,
      data: order,
      message: "Order retireived successfully",
    });
  } catch (error) {
    console.error("Get single order of user message:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.createCartAndPlaceOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required",
        data: null,
      });
    }

    const result = await processOrderCore(orderId);

    res.status(200).json({
      success: true,
      message: "Order processed successfully",
      data: result,
    });
  } catch (error) {
    logger.error(req.path, error);
    res.status(500).json({
      success: false,
      message: error.message,
      data: null,
    });
  }
};

module.exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    const existingOrder = await Order.findById(orderId);
    if (!existingOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Restrict cancellation if  accepted, dispatched, or completed
    if (
      ["accepted", "dispatched", "delivered"].includes(existingOrder.status)
    ) {
      return res
        .status(400)
        .json({ error: "Cannot cancel this order at its current stage." });
    }

    existingOrder.status = "cancelled";
    existingOrder.cancelledAt = new Date();
    existingOrder.adminNotes =
      (existingOrder.adminNotes || "") + " Cancelled by admin.";

    await existingOrder.save();
    orderCancellationEmail(existingOrder);
    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order: existingOrder,
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
};

module.exports.completeOrder = async (req, res) => {
  try {
    const orderId = req?.params?.orderId;

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.status === "delivered") {
      return res.status(400).json({ error: "Order is completed." });
    }

    order.status = "delivered";
    order.completedAt = new Date();
    order.adminNotes = (order.adminNotes || "") + " Completed by admin.";

    await order.save();
    orderDeliveredEmail(order);
    return res.status(200).json({
      message: "Order marked as completed successfully",
      order,
    });
  } catch (error) {
    console.error("Error completing order:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
};

module.exports.dispatchOrder = async (req, res) => {
  try {
    const orderId = req?.params?.orderId;
    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.status === "delivered") {
      return res
        .status(400)
        .json({ error: "Cannot dispatch a completed order." });
    }

    if (order.status === "dispatched") {
      return res.status(400).json({ error: "Order is  dispatched." });
    }

    order.status = "dispatched";
    order.adminNotes = (order.adminNotes || "") + " Dispatched by admin.";
    order.dispatchedAt = new Date();

    await order.save();
    orderDispatchEmail(order);
    return res.status(200).json({
      message: "Order marked as dispatched successfully",
      order,
    });
  } catch (error) {
    console.error("Error dispatching order:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
};
