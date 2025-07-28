const { check, body } = require("express-validator");

module.exports.registerValidation = [
  check("name", "Name is required").not().isEmpty(),
  check("email", "Please include a valid email").isEmail(),
  check(
    "password",
    "Please enter a password with 6 or more characters"
  ).isLength({ min: 6 }),
  check("phone", "Phone number is required").not().isEmpty(),
  check("dialCode", "Dial code is required").not().isEmpty(),
  body("companyInfo.shippingCountry", "Shipping country is required")
    .not()
    .isEmpty(),
  body("companyInfo.companyName", "Company name is required").not().isEmpty(),
  body(
    "companyInfo.countryOfRegistration",
    "Country of registration is required"
  )
    .not()
    .isEmpty(),
  body("companyInfo.registrationNumber", "Registration number is required")
    .not()
    .isEmpty(),
  body(
    "businessDetails.salesChannels",
    "At least one sales channel is required"
  )
    .isArray({ min: 1 })
    .custom((channels) => {
      const validChannels = [
        "Amazon",
        "Physical Store",
        "Dropshipping",
        "Boutique",
        "Online Store",
        "Bulk Trading",
        "Hospitality",
        "Use for my business",
        "Other",
      ];
      return channels.every((channel) => validChannels.includes(channel));
    })
    .withMessage("Invalid sales channel provided"),

  body("businessDetails.annualTurnover", "Annual turnover is required")
    .isIn(["< $10k", "$10k - $50k", "$50k - $250k", "$250k - $1M", "$1M+"])
    .withMessage("Invalid annual turnover value"),

  body("businessDetails.employeeCount", "Employee count is required")
    .isIn(["1-10", "11-50", "51-200", "201-500", "500+"])
    .withMessage("Invalid employee count value"),

  body("businessDetails.yearFounded", "Year founded is required")
    .not()
    .isEmpty()
    .isNumeric()
    .isLength({ min: 4, max: 4 })
    .withMessage("Year must be a 4-digit number"),

  body("businessDetails.businessStartDate", "Business start date is required")
    .isISO8601()
    .withMessage("Invalid date format. Use YYYY-MM-DD")
    .custom((date) => {
      return new Date(date) < new Date();
    })
    .withMessage("Business start date cannot be in the future"),
];

module.exports.mobileVerificationValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("phone")
    .matches(/^[0-9]{7,15}$/)
    .withMessage("Valid phone number is required"),
  body("dialCode")
    .matches(/^\+\d{1,4}$/)
    .withMessage("Valid country code is required"),
];

module.exports.resendVerificationValidation = [
  check("type", "Verification type is required")
    .isIn(["email", "phone"])
    .withMessage("Type must be either email or phone"),
  check("email", "Email is required for email verification")
    .if((_, { req }) => req.body.type === "email")
    .isEmail()
    .withMessage("Please provide a valid email"),
  check("phone", "Phone is required for phone verification")
    .if((_, { req }) => req.body.type === "phone")
    .not()
    .isEmpty(),
];

module.exports.loginValidation = [
  check("email", "Please include a valid email").isEmail(),
  check("password", "Password is required").exists(),
];

module.exports.forgetPasswordValidation = [
  check("email", "Please include a valid email").isEmail(),
];
module.exports.resetPasswordValidation = [
  check(
    "password",
    "Please enter a password with 6 or more characters"
  ).isLength({ min: 6 }),
];

module.exports.verifyPhoneValidation = [
  check("code")
    .notEmpty()
    .withMessage("Verification code is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("Verification code must be exactly 6 digits")
,
    
  check("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .isMobilePhone()

    .withMessage("Phone number must be valid"),
    
  check("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be valid"),
];
