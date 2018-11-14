const express = require('express');

const product = require('../models/product');

const router = express.Router();

// show all categories
router.get('/', (req, res) => {
  // Get all categories from DB
  product.find({}, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('index/categories', { products: allproducts });
    }
  });
});

// show all products inside specific category
router.get('/products', (req, res) => {
// Get all products from DB
  product.find({}, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('products/product_all', { products: allproducts });
    }
  });
});

module.exports = router;
