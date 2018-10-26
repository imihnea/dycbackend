const express = require('express');

const router = express.Router();

const middleware = require('../middleware');

const { isLoggedIn } = middleware; // destructuring assignment




module.exports = router;