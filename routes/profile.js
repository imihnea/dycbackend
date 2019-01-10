/* eslint-disable no-param-reassign */
const express = require('express');

const router = express.Router();

const multer = require('multer');

const cloudinary = require('cloudinary');

const { profileUpdate, getProfile } = require('../controllers/profile');

const middleware = require('../middleware/index');

const { isLoggedIn, checkUserproduct, asyncErrorHandler } = middleware; // destructuring assignment

// Set Storage Engine
const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    cb(null, Date.now() + file.originalname);
  },
});
  
const imageFilter = (req, file, cb) => {
  // accept image files only
  if (!file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: imageFilter,
});

// GET Profile route

router.get('/:id', getProfile);

// PUT Profile route

router.put('/:id/update', isLoggedIn, upload.single('avatar'), asyncErrorHandler(profileUpdate));

module.exports = router;
