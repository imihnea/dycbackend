const express = require('express');

const router = express.Router();

const middleware = require('../middleware');

const { isLoggedIn } = middleware; // destructuring assignment

// The routes are at the end of index.js

module.exports = router;
