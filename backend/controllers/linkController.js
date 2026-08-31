import mongoose from "mongoose";
import crypto from "crypto";
import Link from "../models/linkModel.js";

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const VALID_CATEGORIES = [
  "Work",
  "Personal",
  "Reading List",
  "Inspiration",
  "Other",
];

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const getUserId = (req) => {
  return req.user?._id || null;
};

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const normalizeTags = (tags) => {
  let parsedTags = [];

  if (Array.isArray(tags)) {
    parsedTags = tags;
  } else if (typeof tags === "string") {
    parsedTags = tags.split(",");
  }

  parsedTags = parsedTags
    .map((tag) => String(tag).trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 50);

  return [...new Set(parsedTags)];
};

const escapeRegex = (value) => {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const parsePagination = (req) => {
  let page = Number.parseInt(req.query.page, 10);
  let limit = Number.parseInt(req.query.limit, 10);

  if (!Number.isInteger(page) || page < 1) {
    page = 1;
  }

  if (!Number.isInteger(limit) || limit < 1) {
    limit = DEFAULT_LIMIT;
  }

  limit = Math.min(limit, MAX_LIMIT);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const validateUrl = (value) => {
  if (!value || typeof value !== "string") {
    return null;
  }

  const cleanUrl = value.trim();

  if (!/^https?:\/\//i.test(cleanUrl)) {
    return null;
  }

  try {
    const parsed = new URL(cleanUrl);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
};

/*
|--------------------------------------------------------------------------
| GET ALL LINKS
|--------------------------------------------------------------------------
| Only authenticated users can get their links
|--------------------------------------------------------------------------
*/

export const getAllLinks = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { page, limit, skip } = parsePagination(req);

    const filter = { userId };

    const [links, total] = await Promise.all([
      Link.find(filter).sort({ savedAt: -1 }).skip(skip).limit(limit).lean(),

      Link.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: links.length,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      links,
    });
  } catch (err) {
    console.error("GetAllLinks Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET OWN LINK
|--------------------------------------------------------------------------
| Authenticated user can access own link
|--------------------------------------------------------------------------
*/

export const getLink = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid link ID",
      });
    }

    const link = await Link.findOne({
      _id: id,
      userId,
    }).lean();

    if (!link) {
      return res.status(404).json({
        success: false,
        message: "Link not found",
      });
    }

    return res.status(200).json({
      success: true,
      link,
    });
  } catch (err) {
    console.error("GetLink Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET PUBLIC LINK
|--------------------------------------------------------------------------
| Public links can be viewed without authentication
|--------------------------------------------------------------------------
*/

export const getPublicLink = async (req, res) => {
  try {
    const { shareId } = req.params;

    if (
      !shareId ||
      typeof shareId !== "string" ||
      !/^[a-f0-9]{48}$/i.test(shareId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid share ID",
      });
    }

    const link = await Link.findOne({
      shareId,
      isPublic: true,
    })
      .select(
        "url title category tags note starred visits savedAt createdAt updatedAt shareId isPublic",
      )
      .lean();

    if (!link) {
      return res.status(404).json({
        success: false,
        message: "Public link not found",
      });
    }

    return res.status(200).json({
      success: true,
      link,
    });
  } catch (err) {
    console.error("GetPublicLink Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/*
|--------------------------------------------------------------------------
| CREATE LINK
|--------------------------------------------------------------------------
| Authentication required - only authenticated users can save links
|--------------------------------------------------------------------------
*/

export const createLink = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const {
      url,
      title,
      category = "Other",
      tags = [],
      note = "",
      isPublic = false,
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | URL
    |--------------------------------------------------------------------------
    */

    const cleanUrl = validateUrl(url);

    if (!cleanUrl) {
      return res.status(400).json({
        success: false,
        message: "Valid HTTP/HTTPS URL is required",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | TITLE
    |--------------------------------------------------------------------------
    */

    if (!title || typeof title !== "string") {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    const cleanTitle = title.trim();

    if (!cleanTitle) {
      return res.status(400).json({
        success: false,
        message: "Title cannot be empty",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | CATEGORY
    |--------------------------------------------------------------------------
    */

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | TAGS
    |--------------------------------------------------------------------------
    */

    const parsedTags = normalizeTags(tags);

    /*
    |--------------------------------------------------------------------------
    | NOTE
    |--------------------------------------------------------------------------
    */

    const cleanNote = String(note || "").trim();

    /*
    |--------------------------------------------------------------------------
    | CREATE
    |--------------------------------------------------------------------------
    */

    const linkData = {
      userId,
      url: cleanUrl,
      title: cleanTitle,
      category,
      tags: parsedTags,
      note: cleanNote,
      isPublic: Boolean(isPublic),
      starred: false,
      visits: 0,
      savedAt: new Date(),
    };

    const link = new Link(linkData);

    await link.save();

    return res.status(201).json({
      success: true,
      message: "Link saved",
      link,
    });
  } catch (err) {
    console.error("CreateLink Error:", err);

    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors)
        .map((error) => error.message)
        .join(", ");

      return res.status(400).json({
        success: false,
        message: messages,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE LINK
|--------------------------------------------------------------------------
*/

export const updateLink = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid link ID",
      });
    }

    const { url, title, category, note, tags, isPublic } = req.body;

    const link = await Link.findOne({
      _id: id,
      userId,
    });

    if (!link) {
      return res.status(404).json({
        success: false,
        message: "Link not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | URL
    |--------------------------------------------------------------------------
    */

    if (url !== undefined) {
      const cleanUrl = validateUrl(url);

      if (!cleanUrl) {
        return res.status(400).json({
          success: false,
          message: "Valid HTTP/HTTPS URL is required",
        });
      }

      link.url = cleanUrl;
    }

    /*
    |--------------------------------------------------------------------------
    | TITLE
    |--------------------------------------------------------------------------
    */

    if (title !== undefined) {
      if (typeof title !== "string") {
        return res.status(400).json({
          success: false,
          message: "Title must be a string",
        });
      }

      const cleanTitle = title.trim();

      if (!cleanTitle) {
        return res.status(400).json({
          success: false,
          message: "Title cannot be empty",
        });
      }

      link.title = cleanTitle;
    }

    /*
    |--------------------------------------------------------------------------
    | CATEGORY
    |--------------------------------------------------------------------------
    */

    if (category !== undefined) {
      if (!VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category",
        });
      }

      link.category = category;
    }

    /*
    |--------------------------------------------------------------------------
    | NOTE
    |--------------------------------------------------------------------------
    */

    if (note !== undefined) {
      link.note = String(note || "").trim();
    }

    /*
    |--------------------------------------------------------------------------
    | TAGS
    |--------------------------------------------------------------------------
    */

    if (tags !== undefined) {
      link.tags = normalizeTags(tags);
    }

    /*
    |--------------------------------------------------------------------------
    | PUBLIC SHARING
    |--------------------------------------------------------------------------
    */

    if (isPublic !== undefined) {
      link.isPublic = Boolean(isPublic);
    }

    /*
    |--------------------------------------------------------------------------
    | SAVE
    |--------------------------------------------------------------------------
    |
    | Important:
    | save() triggers linkModel pre("save"), which creates/removes shareId.
    |
    */

    await link.save();

    return res.status(200).json({
      success: true,
      message: "Link updated",
      link,
    });
  } catch (err) {
    console.error("UpdateLink Error:", err);

    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors)
        .map((error) => error.message)
        .join(", ");

      return res.status(400).json({
        success: false,
        message: messages,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/*
|--------------------------------------------------------------------------
| ADD TAG
|--------------------------------------------------------------------------
*/

export const addTag = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { id } = req.params;
    const { tag } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid link ID",
      });
    }

    if (!tag || !String(tag).trim()) {
      return res.status(400).json({
        success: false,
        message: "Tag is required",
      });
    }

    const cleanTag = String(tag).trim().toLowerCase();

    const link = await Link.findOne({
      _id: id,
      userId,
    });

    if (!link) {
      return res.status(404).json({
        success: false,
        message: "Link not found",
      });
    }

    if (!Array.isArray(link.tags)) {
      link.tags = [];
    }

    if (link.tags.includes(cleanTag)) {
      return res.status(409).json({
        success: false,
        message: "Tag already exists",
      });
    }

    if (link.tags.length >= 50) {
      return res.status(400).json({
        success: false,
        message: "Maximum 50 tags allowed",
      });
    }

    link.tags.push(cleanTag);

    await link.save();

    return res.status(200).json({
      success: true,
      message: "Tag added",
      link,
    });
  } catch (err) {
    console.error("AddTag Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/*
|--------------------------------------------------------------------------
| REMOVE TAG
|--------------------------------------------------------------------------
*/

export const removeTag = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { id } = req.params;
    const { tag } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid link ID",
      });
    }

    if (!tag || !String(tag).trim()) {
      return res.status(400).json({
        success: false,
        message: "Tag is required",
      });
    }

    const cleanTag = String(tag).trim().toLowerCase();

    const link = await Link.findOne({
      _id: id,
      userId,
    });

    if (!link) {
      return res.status(404).json({
        success: false,
        message: "Link not found",
      });
    }

    link.tags = (link.tags || []).filter(
      (existingTag) => existingTag !== cleanTag,
    );

    await link.save();

    return res.status(200).json({
      success: true,
      message: "Tag removed",
      link,
    });
  } catch (err) {
    console.error("RemoveTag Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/*
|--------------------------------------------------------------------------
| TOGGLE STAR
|--------------------------------------------------------------------------
*/

export const toggleStar = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid link ID",
      });
    }

    const link = await Link.findOne({
      _id: id,
      userId,
    });

    if (!link) {
      return res.status(404).json({
        success: false,
        message: "Link not found",
      });
    }

    link.starred = !link.starred;

    await link.save();

    return res.status(200).json({
      success: true,
      message: link.starred ? "Link starred" : "Link unstarred",
      link,
    });
  } catch (err) {
    console.error("ToggleStar Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/*
|--------------------------------------------------------------------------
| RECORD PUBLIC VISIT
|--------------------------------------------------------------------------
| Anyone can visit public links (no auth required)
|--------------------------------------------------------------------------
*/

export const recordPublicVisit = async (req, res) => {
  try {
    const { shareId } = req.params;

    if (
      !shareId ||
      typeof shareId !== "string" ||
      !/^[a-f0-9]{48}$/i.test(shareId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid share ID",
      });
    }

    const link = await Link.findOneAndUpdate(
      {
        shareId,
        isPublic: true,
      },
      {
        $inc: {
          visits: 1,
        },
      },
      {
        new: true,
        projection: {
          _id: 1,
          visits: 1,
          url: 1,
        },
      },
    ).lean();

    if (!link) {
      return res.status(404).json({
        success: false,
        message: "Public link not found",
      });
    }

    return res.status(200).json({
      success: true,
      visits: link.visits,
      url: link.url,
    });
  } catch (err) {
    console.error("RecordPublicVisit Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/*
|--------------------------------------------------------------------------
| RECORD VISIT (for authenticated users)
|--------------------------------------------------------------------------
*/

export const recordVisit = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid link ID",
      });
    }

    const link = await Link.findOneAndUpdate(
      {
        _id: id,
        userId,
      },
      {
        $inc: {
          visits: 1,
        },
      },
      {
        new: true,
      },
    );

    if (!link) {
      return res.status(404).json({
        success: false,
        message: "Link not found",
      });
    }

    return res.status(200).json({
      success: true,
      visits: link.visits,
      link,
    });
  } catch (err) {
    console.error("RecordVisit Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/*
|--------------------------------------------------------------------------
| DELETE LINK
|--------------------------------------------------------------------------
*/

export const deleteLink = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid link ID",
      });
    }

    const link = await Link.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!link) {
      return res.status(404).json({
        success: false,
        message: "Link not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Link deleted",
    });
  } catch (err) {
    console.error("DeleteLink Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/*
|--------------------------------------------------------------------------
| DELETE ALL LINKS
|--------------------------------------------------------------------------
*/

export const deleteAllLinks = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const result = await Link.deleteMany({
      userId,
    });

    return res.status(200).json({
      success: true,
      message: "All links deleted",
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error("DeleteAllLinks Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET STATS
|--------------------------------------------------------------------------
*/

export const getStats = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const objectUserId = new mongoose.Types.ObjectId(userId);

    const [totalLinks, starredCount, totalVisits, categoryStats] =
      await Promise.all([
        Link.countDocuments({
          userId: objectUserId,
        }),

        Link.countDocuments({
          userId: objectUserId,
          starred: true,
        }),

        Link.aggregate([
          {
            $match: {
              userId: objectUserId,
            },
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: "$visits",
              },
            },
          },
        ]),

        Link.aggregate([
          {
            $match: {
              userId: objectUserId,
            },
          },
          {
            $group: {
              _id: "$category",
              count: {
                $sum: 1,
              },
            },
          },
          {
            $sort: {
              count: -1,
            },
          },
        ]),
      ]);

    const stats = {
      totalLinks,
      starredCount,
      totalVisits: totalVisits[0]?.total || 0,

      categoryStats: categoryStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    };

    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (err) {
    console.error("GetStats Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/*
|--------------------------------------------------------------------------
| SEARCH LINKS
|--------------------------------------------------------------------------
| Authentication required
|--------------------------------------------------------------------------
*/

export const searchLinks = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { query = "", category, starred, tags } = req.query;

    const { page, limit, skip } = parsePagination(req);

    const filter = {
      userId,
    };

    /*
    |--------------------------------------------------------------------------
    | Text Search
    |--------------------------------------------------------------------------
    */

    const cleanQuery = String(query || "").trim();

    if (cleanQuery) {
      const safeQuery = escapeRegex(cleanQuery);

      filter.$or = [
        {
          title: {
            $regex: safeQuery,
            $options: "i",
          },
        },
        {
          url: {
            $regex: safeQuery,
            $options: "i",
          },
        },
        {
          note: {
            $regex: safeQuery,
            $options: "i",
          },
        },
        {
          tags: {
            $regex: safeQuery,
            $options: "i",
          },
        },
      ];
    }

    /*
    |--------------------------------------------------------------------------
    | Category
    |--------------------------------------------------------------------------
    */

    if (category && category !== "All") {
      if (!VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category",
        });
      }

      filter.category = category;
    }

    /*
    |--------------------------------------------------------------------------
    | Starred
    |--------------------------------------------------------------------------
    */

    if (starred !== undefined) {
      if (starred === "true") {
        filter.starred = true;
      } else if (starred === "false") {
        filter.starred = false;
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Tags
    |--------------------------------------------------------------------------
    */

    if (tags) {
      const tagList = normalizeTags(tags);

      if (tagList.length > 0) {
        filter.tags = {
          $in: tagList,
        };
      }
    }

    const [links, total] = await Promise.all([
      Link.find(filter).sort({ savedAt: -1 }).skip(skip).limit(limit).lean(),

      Link.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: links.length,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      links,
    });
  } catch (err) {
    console.error("SearchLinks Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/*
|--------------------------------------------------------------------------
| EXPORT LINKS
|--------------------------------------------------------------------------
*/

export const exportLinks = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const links = await Link.find({
      userId,
    })
      .sort({ savedAt: -1 })
      .lean();

    res.setHeader("Content-Type", "application/json");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="linkvault-backup-${Date.now()}.json"`,
    );

    return res.status(200).json(links);
  } catch (err) {
    console.error("ExportLinks Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/*
|--------------------------------------------------------------------------
| IMPORT LINKS
|--------------------------------------------------------------------------
*/

export const importLinks = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { links = [] } = req.body;

    if (!Array.isArray(links) || links.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No links to import",
      });
    }

    if (links.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Maximum 500 links can be imported at once",
      });
    }

    const validLinks = [];

    for (const item of links) {
      if (!item || typeof item !== "object") {
        continue;
      }

      const cleanUrl = validateUrl(item.url);
      const cleanTitle = String(item.title || "").trim();

      if (!cleanUrl || !cleanTitle) {
        continue;
      }

      let category = item.category || "Other";

      if (!VALID_CATEGORIES.includes(category)) {
        category = "Other";
      }

      const isPublic =
        item.isPublic !== undefined ? Boolean(item.isPublic) : false;

      const visits = Math.max(0, Math.floor(Number(item.visits) || 0));

      const savedAt = item.savedAt ? new Date(item.savedAt) : new Date();

      validLinks.push({
        userId,
        url: cleanUrl,
        title: cleanTitle.slice(0, 200),
        category,
        tags: normalizeTags(item.tags),
        note: String(item.note || "")
          .trim()
          .slice(0, 5000),
        starred: Boolean(item.starred),
        visits,
        isPublic,

        // insertMany does not execute save middleware,
        // so generate shareId manually.
        shareId: isPublic ? crypto.randomBytes(24).toString("hex") : undefined,

        savedAt: Number.isNaN(savedAt.getTime()) ? new Date() : savedAt,
      });
    }

    if (validLinks.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid links to import",
      });
    }

    const imported = await Link.insertMany(validLinks, {
      ordered: false,
    });

    return res.status(201).json({
      success: true,
      message: `Imported ${imported.length} links`,
      count: imported.length,
    });
  } catch (err) {
    console.error("ImportLinks Error:", err);

    if (err?.writeErrors?.length) {
      return res.status(400).json({
        success: false,
        message: "Some links could not be imported",
        importedCount: err.insertedDocs?.length || 0,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
