const User = require("../models/userModel");
const { validationResult, body } = require("express-validator");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const sgMail = require("../utils/sendgridEmail");
const jwt = require("jsonwebtoken");
const twilio = require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Set SendGrid API key

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password (min 6 characters)
 *     responses:
 *       201:
 *         description: User registered successfully, verification email sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map((err) => ({
          field: err.param,
          message: err.msg,
        })),
      });
    }
    const { name, email, password, phone, dialCode, companyInfo, businessDetails } = req.body;
    let user = await User.findOne({ email });
    if (user) {
      if (!user.isVerified) {
        await sendVerifications(user);
        return res.status(200).json({
          success: true,
          data: { email, phone },
          message: "Verification codes resent. Please check your email and phone.",
        });
      }
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }
    user = await User.create({
      name: name.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone.replace(/[^\d+]/g, "").trim(),
      dialCode: dialCode,
      companyInfo: {
        shippingCountry: companyInfo.shippingCountry,
        vatNumber: companyInfo.vatNumber || "",
        companyName: companyInfo.companyName,
        countryOfRegistration: companyInfo.countryOfRegistration,
        registrationNumber: companyInfo.registrationNumber,
      },
      businessDetails: {
        salesChannels: businessDetails.salesChannels,
        annualTurnover: businessDetails.annualTurnover,
        employeeCount: businessDetails.employeeCount,
        yearFounded: businessDetails.yearFounded,
        businessStartDate: new Date(businessDetails.businessStartDate),
      },
    });
    await sendVerifications(user);
    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        dialCode: user.dialCode,
        isEmailVerified: user.isVerified,
        isPhoneVerified: user.isPhoneVerified,
      },
      message: "Registration successful. Please check your email and phone for verification codes.",
    });
  } catch (error) {
    console.error("Registration error:", error.message);
    res.status(500).json({
      success: false,
      message: error?.message,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

async function sendVerifications(user) {
  const verificationToken = await user.getVerificationToken();
  const phoneVerificationCode = await user.generatePhoneVerificationToken();
  await user.save({ validateBeforeSave: false });
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-user/${verificationToken}`;
  const emailMsg = {
    to: user.email,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: "Verify Your Email Address",
    html: createVerificationEmail(verificationUrl),
  };
  try {
    await Promise.all([
      sgMail.send(emailMsg),
      // sendEmail({
      //   email: user.email,
      //   subject: "Email Verification",
      //   message: createVerificationEmail(verificationUrl),
      // }),
    ]);
  } catch (error) {
    console.error("Verification sending error:", error);
    user.verificationToken = undefined;
    user.verificationExpire = undefined;
    user.phoneVerificationToken = undefined;
    user.phoneVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });
    throw error;
  }
}

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *       400:
 *         description: Invalid credentials
 *       401:
 *         description: Email not verified
 *       500:
 *         description: Server error
 */
exports.login = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map((err) => ({
          field: err.param,
          message: err.msg,
        })),
      });
    }

    const { email, password } = req.body;

    // Normalize and sanitize inputs
    const normalizedEmail = email.toLowerCase().trim();
    const sanitizedPassword = password.trim();

    // Check if user exists with password
    const user = await User.findOne({ email: normalizedEmail }).select("+password +isVerified +isPhoneVerified +phone");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
        code: "INVALID_CREDENTIALS",
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(sanitizedPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
        code: "INVALID_CREDENTIALS",
      });
    }

    // Check verification status
    if (!user.isVerified || !user.isPhoneVerified) {
      const verificationData = {
        email: user.email,
        phone: user.phone,
        isEmailVerified: user.isVerified,
        isPhoneVerified: user.isPhoneVerified,
        dialCode: user.dialCode,
      };

      // Generate and send verification codes if not verified
      if (!user.isVerified) {
        const verificationToken = await user.getVerificationToken();
        await user.save({ validateBeforeSave: false });
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-user/${verificationToken}`;
        const emailMsg = {
          to: user.email,
          from: process.env.SENDGRID_FROM_EMAIL,
          subject: "Verify Your Email Address",
          html: createVerificationEmail(verificationUrl),
        };
        await sgMail.send(emailMsg);
        // sendEmail({
        //   email: user.email,
        //   subject: "Email Verification",
        //   message: createVerificationEmail(verificationUrl),
        // }),
        // In production, you would send the email here
        console.log(`Email verification token: ${verificationToken}`);
      }
      return res.status(403).json({
        success: false,
        message: "Account verification required",
        code: "VERIFICATION_REQUIRED",
        verificationRequired: true,
        verificationData,
      });
    }
    const token = user.getSignedJwtToken();
    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({
      success: true,
      token,
      user: userData,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      code: "SERVER_ERROR",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current logged in user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/**
 * @swagger
 * /api/auth/verify-email/{verificationtoken}:
 *   get:
 *     summary: Verify user email
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: verificationtoken
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *       400:
 *         description: Invalid or expired token
 *       500:
 *         description: Server error
 */

exports.checkVerificationStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("isVerified isPhoneVerified");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        emailVerified: user.isVerified,
        phoneVerified: user.isPhoneVerified,
        fullyVerified: user.isVerified && user.isPhoneVerified,
      },
    });
  } catch (error) {
    console.error("Verification status check error:", error);
    res.status(500).json({
      success: false,
      message: "Server error checking verification status",
    });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    let decoded;
    try {
      decoded = jwt.verify(req.params.verificationToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Invalid or tampered verification link",
        code: "INVALID_JWT_TOKEN",
      });
    }
    const { email, token: rawToken } = decoded;
    console.log(rawToken);
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    if (user.isVerified) {
      return res.status(200).json({
        success: true,
        message: "Email already verified",
        verificationData: {
          emailVerified: true,
          email: user.email,
          phone: user.phone,
          phoneVerified: user.isPhoneVerified,
          dialCode: user.dialCode,
        },
      });
    }
    console.log(new Date(user.verificationExpire).getTime() < Date.now(), user.verificationToken !== hashedToken, !user.verificationExpire);
    if (user.verificationToken !== hashedToken || !user.verificationExpire || new Date(user.verificationExpire).getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
        code: "INVALID_VERIFICATION_TOKEN",
      });
    }

    // 5. Update verification status
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpire = undefined;
    await user.save();
    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      verificationData: {
        emailVerified: true,
        email: user.email,
        phone: user.phone,
        phoneVerified: user.isPhoneVerified,
        dialCode: user.dialCode,
      },
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during email verification",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.verifyPhone = async (req, res) => {
  try {
    const { code, phone, email } = req.body;

    // Input validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
        message: "Validation failed",
        code: "VALIDATION_ERROR",
      });
    }

    if (!code || !phone || !email) {
      return res.status(400).json({
        success: false,
        message: "Code, phone number, and email are required",
        code: "MISSING_FIELDS",
      });
    }

    // Lookup user
    const user = await User.findOne({ phone, email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with provided phone and email",
        code: "USER_NOT_FOUND",
      });
    }

    try {
      // Await the verification method
      await user.verifyPhoneToken(code);
    } catch (verificationError) {
      return res.status(400).json({
        success: false,
        message: verificationError.message || "Invalid verification code",
        code: "INVALID_VERIFICATION_CODE",
      });
    }

    // Generate JWT after successful verification
    const token = user.getSignedJwtToken();

    return res.status(200).json({
      success: true,
      message: "Phone number verified successfully",
      token,
      verificationStatus: {
        emailVerified: user.isVerified,
        phoneVerified: true,
      },
    });
  } catch (error) {
    console.error("Phone verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during phone verification",
      code: "SERVER_ERROR",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's registered email
 *     responses:
 *       200:
 *         description: Verification email sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: User not found or already verified
 *       500:
 *         description: Server error
 */
exports.resendVerification = async (req, res) => {
  try {
    const { type, email, phone } = req.body;

    // Validate request
    if (!type || (type === "email" && !email) || (type === "phone" && !phone)) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields. Provide type and email/phone",
      });
    }

    // Find user based on verification type
    const user = await User.findOne(type === "email" ? { email } : { phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `No user found with this ${type}`,
      });
    }

    // Check if already verified
    if (type === "email" && user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    if (type === "phone" && user.isPhoneVerified) {
      return res.status(400).json({
        success: false,
        message: "Phone is already verified",
      });
    }

    // Generate and save appropriate token
    let verificationData;
    if (type === "email") {
      const verificationToken = user.getVerificationToken();
      await user.save({ validateBeforeSave: false });

      const verificationUrl = `${process.env.FRONTEND_URL}/verify-user/${verificationToken}`;

      verificationData = {
        email: user.email,
        subject: "Email Verification Resend",
        message: createVerificationEmail(verificationUrl),
      };
    } else {
      const verificationCode = await user.generatePhoneVerificationToken();
      await user.save({ validateBeforeSave: false });

      verificationData = {
        phone: user.phone,
        message: `Your verification code is: ${verificationCode}`,
      };
    }
    // Send verification
    try {
      if (type === "email") {
        const emailMsg = {
          to: verificationData.email,
          from: process.env.SENDGRID_FROM_EMAIL,
          subject: verificationData.subject,
          html: verificationData.message,
        };

        sgMail.send(emailMsg);

        // await sendEmail({
        //   email: verificationData.email,
        //   subject: verificationData.subject,
        //   message: verificationData.message,
        // });
      } else {
        twilio.messages.create({
          body: verificationData.message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: `${user.dialCode}${user.phone}`,
        });
      }

      res.status(200).json({
        success: true,
        message: `${type === "email" ? "Email" : "SMS"} verification sent`,
        // Only return code in development for testing
        code: process.env.NODE_ENV === "development" && type === "phone" ? verificationData.message.match(/\d{6}/)?.[0] : undefined,
      });
    } catch (err) {
      console.error(`Error sending ${type} verification:`, err);

      // Clean up tokens if sending fails
      if (type === "email") {
        user.verificationToken = undefined;
        user.verificationExpire = undefined;
      } else {
        user.phoneVerificationToken = undefined;
        user.phoneVerificationExpire = undefined;
      }
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: `Failed to send ${type} verification`,
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during verification resend",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Helper function for email template
function createVerificationEmail(verificationUrl) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px 0;">
      <h2 style="color: #4f46e5;">Email Verification</h2>
      <p>Thank you for registering with us!</p>
      <p>Please click the button below to verify your email address:</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${verificationUrl}" 
           style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; 
                  color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Verify Email Address
        </a>
      </div>
      <p>Or copy this link to your browser:</p>
      <div style="word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px; margin: 10px 0;">
        ${verificationUrl}
      </div>
      <p>This link expires in 24 hours.</p>
      <p>If you didn't request this, please ignore this email.</p>
    </div>
  `;
}

/**
 * @swagger
 * /api/auth/forgotpassword:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's registered email
 *     responses:
 *       200:
 *         description: Email sent with password reset instructions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found with that email",
      });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    // Save the user with the reset token and expiry
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Create email message
    const message = `
  <div style="max-width: 600px; margin: auto; padding: 32px 24px; font-family: Arial, sans-serif; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px;">
    <h2 style="color: #111827; font-size: 22px; font-weight: 700; margin-bottom: 16px;">Reset Your Password</h2>

    <p style="font-size: 16px; color: #333333; margin-bottom: 20px;">
      We received a request to reset your password. Click the button below to set a new one.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetUrl}"
         style="display: inline-block;
                padding: 14px 28px;
                background-color: #4f46e5;
                color: #ffffff;
                text-decoration: none;
                border-radius: 6px;
                font-size: 16px;
                font-weight: 600;">
        Reset Password
      </a>
    </div>

    <p style="font-size: 15px; color: #444444; margin-bottom: 8px;">
      If the button above doesn't work, copy and paste the link below into your browser:
    </p>

    <div style="font-size: 14px;
                word-break: break-word;
                background-color: #f4f4f4;
                padding: 12px;
                border-left: 4px solid #4f46e5;
                border-radius: 4px;
                font-family: monospace;
                color: #2a2a2a;
                margin-bottom: 24px;">
      ${resetUrl}
    </div>

    <p style="font-size: 14px; color: #777777; margin-bottom: 8px;">
      This password reset link is valid for <strong>10 minutes</strong>.
    </p>
    <p style="font-size: 14px; color: #999999;">
      If you didn’t request a password reset, you can safely ignore this email.
    </p>
  </div>
`;

    const emailMsg = {
      to: user.email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: "Verify Your Email Address",
      html: message,
    };
    try {
      await sgMail.send(emailMsg);
      // await sendEmail({
      //   email: user.email,
      //   subject: "Password Reset Request",
      //   message,
      // });

      res.status(200).json({
        success: true,
        message: "Email sent with password reset instructions",
      });
    } catch (err) {
      console.error("Email error:", err);
      // If email fails, reset the token and expiry
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({
        success: false,
        message: "Email could not be sent",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/**
 * @swagger
 * /api/auth/resetpassword/{resettoken}:
 *   put:
 *     summary: Reset password
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: resettoken
 *         required: true
 *         schema:
 *           type: string
 *         description: Password reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 description: New password (min 6 characters)
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *       400:
 *         description: Invalid token or password
 *       404:
 *         description: Invalid token
 *       500:
 *         description: Server error
 */
exports.resetPassword = async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.resettoken).digest("hex");

    // Find user by reset token and check if token is still valid
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Validate password
    if (!req.body.password || req.body.password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Generate JWT token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      message: "Password reset successful",
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports.sendPhoneVerificationCode = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  const { email, phone, dialCode } = req.body;

  try {
    // Find the user trying to verify
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check if their email is verified
    if (!user.isVerified) {
      return res.status(400).json({ success: false, message: "Email is not verified" });
    }

    // Check if the phone number is already verified for another account
    const otherUser = await User.findOne({
      phone: phone,
      dialCode: dialCode,
      isPhoneVerified: true,
      email: { $ne: email },
    });

    if (otherUser) {
      return res.status(409).json({ success: false, message: "Phone number already in use by another verified account" });
    }

    // If current user's phone is already verified
    if (user.isPhoneVerified) {
      return res.status(200).json({ success: true, message: "Phone already verified" });
    }

    // If phone is new or changed, update it
    if (user.phone !== phone) {
      user.phone = phone;
      user.isPhoneVerified = false;
      await user.save();
    }
    const phoneVerificationCode = user.generatePhoneVerificationToken();
    console.log(phoneVerificationCode);
    const smsMessage = `Your avallonya verification code is: ${phoneVerificationCode}`;
    // Send SMS via Twilio
    await twilio.messages.create({
      body: smsMessage,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `${user.dialCode}${user.phone}`,
    });
    await user.save({ validateBeforeSave: false });
    return res.status(200).json({ success: true, message: "Verification code sent to phone" });
  } catch (error) {
    console.error("Error sending verification code:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
