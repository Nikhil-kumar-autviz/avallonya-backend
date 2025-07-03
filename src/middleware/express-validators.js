//updade-> admin/updatewithQid
const { body, param, validationResult } = require("express-validator");

exports.validateUpdateCategory = [
  param("qid").notEmpty().withMessage("qid param is required"),
  body("categoryName").notEmpty().isString().withMessage("categoryName must be a string"),
  body("priceCost")
    .optional()
    .isFloat({ min: 1.25 })
    .withMessage("priceCost must be a number >= 1.25"),

  body("weightCost")
    .optional()
    .isFloat({ min: 1.25 })
    .withMessage("weightCost must be a number >= 1.25"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }
    next();
  },
];
