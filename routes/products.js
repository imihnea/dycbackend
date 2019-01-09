const express = require('express');

const product = require('../models/product');

const router = express.Router();

router.get('/:id/view', (req, res) => {
  product.findById(req.params.id).exec((err, foundproduct) => {
    if (err || !foundproduct) {
      req.flash('error', 'Sorry, that product does not exist!');
      return res.redirect('/');
    }
    // render show template with that product
    res.render('products/product_view', { product: foundproduct });
  });
});

module.exports = router;
