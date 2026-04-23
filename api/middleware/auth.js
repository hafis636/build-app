const { verifyAccessToken } = require("../utils/auth");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.sendStatus(401);
  }

  try {
    const user = verifyAccessToken(token);
    req.user = user;
    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return res.sendStatus(403); // Forbidden (token expired or invalid)
  }
};

module.exports = authenticateToken;
