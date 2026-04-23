require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const axios = require("axios");
const connectDB = require("./db");
const { googleAuthCallback } = require("./userService/userService");
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require("./utils/auth");
const authenticateToken = require("./middleware/auth");
const User = require("./userService/userModel");

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

app.get("/auth/test", (req, res) => {
  res.json({ message: "Auth route is working" });
});

app.get("/auth/google/callback", async (req, res) => {
  console.log("Google callback received:", req.query);
  const { code } = req.query;

  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
  }

  try {
    const user = await googleAuthCallback(code);
    
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Set refresh token in HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Success redirect
    // (Frontend will pick up the refresh token from the HTTP-only cookie automatically)
    res.redirect(`${process.env.FRONTEND_URL}/login_success`);
  } catch (error) {
    console.error("Authentication error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
  }
});

app.get("/auth/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-googleId");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/auth/refresh", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  
  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token missing" });
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.id);
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const accessToken = generateAccessToken(user);
    res.json({ accessToken });
  } catch (error) {
    console.error("Refresh token error:", error.message);
    res.status(403).json({ message: "Invalid refresh token" });
  }
});

app.post("/auth/logout", (req, res) => {
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out" });
});

app.get("/hello", (req, res) => {
  res.json({ message: "Hello from backend 👋" });
});

app.use((req, res) => {
  console.log(`404 - Not Found: ${req.method} ${req.url}`);
  res.status(404).send(`Cannot ${req.method} ${req.url} - custom 404`);
});

// MongoDB Connection
const startServer = async () => {
  await connectDB();
  
  const PORT = 5001;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();
