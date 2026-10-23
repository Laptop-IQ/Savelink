import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export default async function authMiddleware(req, res, next) {
  // Token grab karo
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Not authorized or token missing",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Token verify karo
    const payload = jwt.verify(token, JWT_SECRET);

    // Only check that the user still exists: fetch just the _id (lean, no
    // password hash, no full mongoose document) -> much lighter per request.
    const user = await User.findById(payload.id).select("_id").lean();
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Controllers only need the id (req.user.id / req.user._id).
    req.user = { id: String(user._id), _id: user._id };
    next();
  } catch (err) {
    console.error("JWT verification failed:", err);
    return res.status(401).json({
      success: false,
      message: "Token invalid or expired",
    });
  }
}
