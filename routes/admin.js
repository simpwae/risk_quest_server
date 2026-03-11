const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");
const requireAdmin = require("../middleware/requireAdmin");

// Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Set session
    req.session.adminId = admin._id;
    req.session.isAdmin = true;

    res.json({
      success: true,
      admin: {
        id: admin._id,
        username: admin.username,
        mustChangePassword: admin.mustChangePassword,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Logout failed" });
    }
    res.json({ success: true, message: "Logged out successfully" });
  });
});

// Check auth status
router.get("/status", requireAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.session.adminId).select("-password");
    if (!admin) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }

    res.json({
      success: true,
      admin: {
        id: admin._id,
        username: admin.username,
        mustChangePassword: admin.mustChangePassword,
      },
    });
  } catch (error) {
    console.error("Status check error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Change password
router.post("/change-password", requireAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    const admin = await Admin.findById(req.session.adminId);
    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }

    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    admin.password = newPassword;
    admin.mustChangePassword = false;
    await admin.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Password change error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
