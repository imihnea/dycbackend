const express = require('express');

const router = express.Router();

const {
 addToCart,
 removeFromCart,
 checkout
  } = require('../controllers/cart');

const middleware = require('../middleware/index');

const { asyncErrorHandler, checkId, getPrice } = middleware;

router.post('/add/:id', checkId, addToCart);

router.put('/delete/:id', checkId, removeFromCart);

router.post('/checkout', getPrice, asyncErrorHandler(checkout));

module.exports = router;
