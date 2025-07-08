const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const adminSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true },
    password: String,
    role: { type: String, default: "admin" },
  },
  { timestamps: true, versionKey: false, skipVersioning: true }
);

// Instance method to generate auth token
adminSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );
};

// Static method to find by credentials
adminSchema.statics.findByCredentials = async function (email, password) {
  const admin = await this.findOne({ email });
  if (!admin) {
    throw new Error("Invalid login credentials");
  }

  const isPasswordMatch = await bcrypt.compare(password, admin.password);
  if (!isPasswordMatch) {
    throw new Error("Invalid login credentials");
  }

  return admin;
};

// Define model *after* methods are attached
const Admin = mongoose.model("admins", adminSchema);

// Seeder function for admin creation
if (!Admin.seedAdmin) {
  Admin.seedAdmin = async () => {
    try {
      const { QOGITA_EMAIL, QOGITA_PASSWORD } = process.env;

      if (!QOGITA_EMAIL || !QOGITA_PASSWORD) {
        throw new Error(
          "Environment variables QOGITA_EMAIL and QOGITA_PASSWORD must be set"
        );
      }

      const existingAdmin = await Admin.findOne({ email: QOGITA_EMAIL });

      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(QOGITA_PASSWORD, 10);
        await Admin.create({
          email: QOGITA_EMAIL,
          password: hashedPassword,
          role: "admin",
        });
        console.log("🎉 Admin user created successfully");
        return;
      }

      const isSamePassword = await bcrypt.compare(
        QOGITA_PASSWORD,
        existingAdmin.password
      );

      if (!isSamePassword) {
        const newHashedPassword = await bcrypt.hash(QOGITA_PASSWORD, 10);
        existingAdmin.password = newHashedPassword;
        await existingAdmin.save();
        console.log("🔁 Admin password updated");
      } else {
        console.log("✅ Admin already exists with same credentials");
      }
    } catch (err) {
      console.error("❌ Error seeding admin:", err.message);
    }
  };
}

module.exports = Admin;
