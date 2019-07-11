/* eslint-disable no-param-reassign */
const express = require('express');

const router = express.Router();

const multer = require('multer');

const cloudinary = require('cloudinary');

const { profileUpdate, getProfile } = require('../controllers/profile');

const middleware = require('../middleware/index');

const { isLoggedIn, asyncErrorHandler, verifyParam, checkId, getPrice } = middleware; // destructuring assignment

const crypto = require('crypto');

// Set Storage Engine
const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    let buf = crypto.randomBytes(16);
    buf = buf.toString('hex');
    let uniqFileName = file.originalname.replace(/\.jpeg|\.jpg|\.png/ig, '');
    uniqFileName += buf;
    cb(undefined, uniqFileName);
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
  limits: {
    fileSize: 5000000
  },
  onError: (err, next) => {
    next(err);
  },
});

// GET Profile route

router.get('/:id', checkId, getPrice, asyncErrorHandler(getProfile));

// PUT Profile route

router.put('/update/:_csrf/:csrfSecret', verifyParam, isLoggedIn, upload.single('avatar'), asyncErrorHandler(profileUpdate));

module.exports = router;
