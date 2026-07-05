const express = require('express');
const multer = require('multer');
const path = require('path');
const Artwork = require('../models/artwork');
const { verifyToken } = require('./auth');
const router = express.Router();

// ============================================
// MULTER CONFIGURATION (Image Upload Setup)
// ============================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Save images to public/uploads/ folder
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    // Create unique filename: timestamp-randomnumber-originalextension
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

// File filter to allow only image files
const fileFilter = (req, file, cb) => {
  // Allowed image types
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  
  // Check file extension
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  // Check MIME type
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true); // Accept file
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Multer upload configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// ============================================
// ROUTES
// ============================================

/**
 * GET /api/gallery
 * Get all artworks (Public - No authentication needed)
 * Returns: Array of all artworks sorted by newest first
 */
router.get('/', async (req, res) => {
  try {
    // Fetch all artworks and sort by creation date (newest first)
    const artworks = await Artwork.find().sort({ createdAt: -1 });
    
    res.json(artworks);
  } catch (err) {
    res.status(500).json({ 
      message: 'Error fetching artworks', 
      error: err.message 
    });
  }
});

/**
 * GET /api/gallery/:id
 * Get single artwork by ID
 * Returns: Single artwork object
 */
router.get('/:id', async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    
    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }
    
    res.json(artwork);
  } catch (err) {
    res.status(500).json({ 
      message: 'Error fetching artwork', 
      error: err.message 
    });
  }
});

/**
 * POST /api/gallery/upload
 * Upload new artwork (Admin Only - Requires authentication)
 * Body: {title, artist, description, image (file)}
 * Returns: Success message and uploaded artwork object
 */
router.post('/upload', verifyToken, upload.single('image'), async (req, res) => {
  try {
    // Extract form data
    const { title, artist, description } = req.body;

    // Validate all required fields
    if (!title || !artist || !description || !req.file) {
      return res.status(400).json({ 
        message: 'All fields are required (title, artist, description, image)' 
      });
    }

    // Create new artwork document
    const artwork = new Artwork({
      title: title.trim(),
      artist: artist.trim(),
      description: description.trim(),
      image: `/uploads/${req.file.filename}`, // Image URL path
      uploadedBy: req.user.username, // Admin username who uploaded
    });

    // Save to database
    await artwork.save();

    res.status(201).json({ 
      message: 'Artwork uploaded successfully',
      artwork 
    });
  } catch (err) {
    // Delete uploaded file if database save fails
    if (req.file) {
      const fs = require('fs');
      fs.unlink(`public/${req.file.filename}`, (unlinkErr) => {
        if (unlinkErr) console.log('Error deleting file:', unlinkErr);
      });
    }

    res.status(500).json({ 
      message: 'Error uploading artwork', 
      error: err.message 
    });
  }
});

/**
 * PUT /api/gallery/:id
 * Update artwork details (Admin Only - Requires authentication)
 * Body: {title, artist, description}
 * Note: Image cannot be updated, delete and re-upload to change image
 * Returns: Updated artwork object
 */
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { title, artist, description } = req.body;

    // Validate at least one field is provided
    if (!title && !artist && !description) {
      return res.status(400).json({ 
        message: 'At least one field (title, artist, or description) must be provided' 
      });
    }

    // Build update object with only provided fields
    const updateData = {};
    if (title) updateData.title = title.trim();
    if (artist) updateData.artist = artist.trim();
    if (description) updateData.description = description.trim();

    // Find by ID and update, return new document
    const artwork = await Artwork.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true } // new: true returns updated doc
    );

    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }

    res.json({ 
      message: 'Artwork updated successfully', 
      artwork 
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Error updating artwork', 
      error: err.message 
    });
  }
});

/**
 * DELETE /api/gallery/:id
 * Delete artwork (Admin Only - Requires authentication)
 * Returns: Success message
 * Note: Physical image file is NOT deleted (optional feature)
 */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    // Find and delete artwork by ID
    const artwork = await Artwork.findByIdAndDelete(req.params.id);

    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }

    // Optional: Delete physical image file from server
    // Uncomment if you want to delete the image file as well
    /*
    const fs = require('fs');
    const filePath = `public${artwork.image}`;
    fs.unlink(filePath, (err) => {
      if (err) console.log('Warning: Could not delete image file:', err);
    });
    */

    res.json({ message: 'Artwork deleted successfully' });
  } catch (err) {
    res.status(500).json({ 
      message: 'Error deleting artwork', 
      error: err.message 
    });
  }
});

/**
 * GET /api/gallery/user/:username
 * Get all artworks uploaded by specific admin
 * Returns: Array of artworks by that admin
 */
router.get('/user/:username', async (req, res) => {
  try {
    const artworks = await Artwork.find({ 
      uploadedBy: req.params.username 
    }).sort({ createdAt: -1 });

    if (artworks.length === 0) {
      return res.status(404).json({ 
        message: `No artworks found for user: ${req.params.username}` 
      });
    }

    res.json(artworks);
  } catch (err) {
    res.status(500).json({ 
      message: 'Error fetching artworks', 
      error: err.message 
    });
  }
});

/**
 * GET /api/gallery/search/:query
 * Search artworks by title or artist name
 * Returns: Array of matching artworks
 */
router.get('/search/:query', async (req, res) => {
  try {
    const searchQuery = req.params.query;

    // Search in title or artist fields (case-insensitive)
    const artworks = await Artwork.find({
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { artist: { $regex: searchQuery, $options: 'i' } },
      ],
    }).sort({ createdAt: -1 });

    if (artworks.length === 0) {
      return res.status(404).json({ 
        message: `No artworks found matching: "${searchQuery}"` 
      });
    }

    res.json(artworks);
  } catch (err) {
    res.status(500).json({ 
      message: 'Error searching artworks', 
      error: err.message 
    });
  }
});

// Export router
module.exports = router;