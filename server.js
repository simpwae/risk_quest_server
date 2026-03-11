require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cors = require("cors");
const connectDB = require("./config/db");
const { initializeSocketHandlers } = require("./services/socketService");
const Admin = require("./models/Admin");

// Import routes
const adminRoutes = require("./routes/admin");
const questionRoutes = require("./routes/questions");
const gameRoutes = require("./routes/game");
const historyRoutes = require("./routes/history");

// Import middleware
const errorHandler = require("./middleware/errorHandler");

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Connect to MongoDB
connectDB();

// Session configuration
const sessionMiddleware = session({
  secret:
    process.env.SESSION_SECRET || "quiz-game-secret-key-change-in-production",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || "mongodb://localhost:27017/quiz-game",
    ttl: 24 * 60 * 60, // 1 day
  }),
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  },
});

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(sessionMiddleware);

// Share session with Socket.IO
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

// API Routes
app.use("/api/admin", adminRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/history", historyRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Initialize Socket.IO handlers
initializeSocketHandlers(io);

// Seed default admin on startup
const seedAdmin = async () => {
  try {
    await Admin.seedDefaultAdmin();
    console.log("Admin seeding completed");
  } catch (error) {
    console.error("Admin seeding failed:", error.message);
  }
};

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  seedAdmin();
});

module.exports = { app, server, io };
