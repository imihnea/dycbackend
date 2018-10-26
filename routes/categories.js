const express = require('express');

const product = require('../models/product');

const router = express.Router();

const middleware = require('../middleware');

const { isLoggedIn, checkUserproduct } = middleware; // destructuring assignment

// show all categories
router.get('/', (req, res) => {
  // Get all categories from DB
  product.find({}, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('index/categories', { products: allproducts, page: 'categories' });
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
      res.render('products/product_all', { products: allproducts, page: 'products' });
    }
  });
});
// CREATE - add new product to DB
router.post('/products', isLoggedIn, (req, res) => {
// get data from form and add to products array
  const name = req.body.name;
  const image = req.body.image;
  const desc = req.body.description;
  const category = req.body.category;
  const author = {
    id: req.user._id,
    username: req.user.username,
  };
  const price = req.body.price;
  const newproduct = {
    name: name,
    image: image,
    category: category,
    description: desc,
    price: price,
    author: author,
  };
    // Create a new product and save to DB
  product.create(newproduct, (err) => {
    if (err) {
      req.flash('error', err.message);
    } else {
    // redirect back to products page
      res.redirect('/categories/products');
    }
  });
});

// NEW - show form to create new product
router.get('/products/new', isLoggedIn, (req, res) => {
  res.render('products/product_new');
});

// SHOW - shows more info about one product
router.get('/products/:id', (req, res) => {
// find the product with provided ID
  product.findById(req.params.id).exec((err, foundproduct) => {
    if (err || !foundproduct) {
      req.flash('error', 'Sorry, that product does not exist!');
      return res.redirect('/products');
    }
    // render show template with that product
    res.render('products/product', { product: foundproduct });
  });
});

// EDIT - shows edit form for a product
router.get('/products/:id/edit', isLoggedIn, checkUserproduct, (req, res) => {
// render edit template with that product
  res.render('products/product_edit', { product: req.product });
});

// PUT - updates product in the database
router.put('/products/:id', isLoggedIn, checkUserproduct, (req, res) => {
  product.findByIdAndUpdate(req.params.id, req.body.atm, (err) => {
    if (err) {
      req.flash('error', 'Error editing ATM!');
      res.redirect('/products');
    } else {
      req.flash('success', 'Successfully edited ATM!');
      res.redirect('/products');
    }
  });
});

// DELETE - deletes product from database - maybe add "are you sure" prompt.

router.delete('/products/:id', isLoggedIn, checkUserproduct, (req, res) => {
  product.findByIdAndRemove(req.params.id, (err) => {
    if (err) {
      req.flash('error', err.message);
      res.redirect('/products');
    } else {
      req.flash('success', 'Successfully deleted product!');
      res.redirect('/products');
    }
  });
});

module.exports = router;
