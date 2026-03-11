const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  mustChangePassword: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
  },
});

// Hash password before saving
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Seed default admin
adminSchema.statics.seedDefaultAdmin = async function () {
  const existingAdmin = await this.findOne({ username: "admin" });

  if (!existingAdmin) {
    await this.create({
      username: "admin",
      password: "admin123", // Default password - must be changed on first login
      mustChangePassword: true,
    });
    console.log("Default admin created: admin / admin123");
  }
};

module.exports = mongoose.model("Admin", adminSchema);
