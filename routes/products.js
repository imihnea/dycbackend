const express = require('express');

const Product = require('../models/product');

const { productShow } = require('../controllers/dashboard');

const middleware = require('../middleware/index');

const { asyncErrorHandler } = middleware; // destructuring assignment

const router = express.Router();

router.get('/:id/view', asyncErrorHandler(productShow));

module.exports = router;
