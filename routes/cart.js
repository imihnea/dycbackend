const express = require('express');

const router = express.Router();

const {
  getCart,
  addToCart,
  removeFromCart,
  checkout
} = require('../controllers/cart');

const middleware = require('../middleware/index');

const { asyncErrorHandler, checkId, getPrice } = middleware;

router.get('/', getPrice, asyncErrorHandler(getCart));

router.post('/add/:id', checkId, addToCart);

router.put('/delete/:id', checkId, removeFromCart);

router.post('/checkout', getPrice, asyncErrorHandler(checkout));

module.exports = router;
