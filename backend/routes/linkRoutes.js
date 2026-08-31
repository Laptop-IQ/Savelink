import express from "express";

import {
  getAllLinks,
  getLink,
  getPublicLink,
  createLink,
  updateLink,
  addTag,
  removeTag,
  toggleStar,
  recordPublicVisit,
  recordVisit,
  deleteLink,
  deleteAllLinks,
  getStats,
  searchLinks,
  exportLinks,
  importLinks,
} from "../controllers/linkController.js";

import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// ============================================================
// PUBLIC ROUTES - NO AUTH REQUIRED
// ============================================================

// Get public link by shareId (anyone can view)
router.get("/share/:shareId", getPublicLink);

// Record visit to public link (anyone can click)
router.post("/share/:shareId/visit", recordPublicVisit);

// ============================================================
// AUTHENTICATED ROUTES - AUTH REQUIRED
// ============================================================

// Get all user links
router.get("/", authMiddleware, getAllLinks);

// Create link (only authenticated users)
router.post("/", authMiddleware, createLink);

// Get single link details
router.get("/:id", authMiddleware, getLink);

// Update link
router.put("/:id", authMiddleware, updateLink);

// Delete single link
router.delete("/:id", authMiddleware, deleteLink);

// Delete all links
router.delete("/", authMiddleware, deleteAllLinks);

// Tags
router.post("/:id/tag", authMiddleware, addTag);
router.delete("/:id/tag", authMiddleware, removeTag);

// Star/unstar
router.post("/:id/star", authMiddleware, toggleStar);

// Record visit (authenticated user)
router.post("/:id/visit", authMiddleware, recordVisit);

// Stats
router.get("/stats", authMiddleware, getStats);

// Search
router.get("/search", authMiddleware, searchLinks);

// Export
router.get("/export", authMiddleware, exportLinks);

// Import
router.post("/import", authMiddleware, importLinks);

export default router;
