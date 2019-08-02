const express = require('express');

const router = express.Router();

const {
  getCart,
  addToCart,
  removeFromCart,
  checkout
} = require('../controllers/cart');

const middleware = require('../middleware/index');

const { asyncErrorHandler, checkId, getPrice, assignCookie, verifyCookie } = middleware;

router.get('/', getPrice, assignCookie, asyncErrorHandler(getCart));

router.post('/add/:id', checkId, asyncErrorHandler(addToCart));

router.put('/delete/:id', checkId, removeFromCart);

router.post('/checkout', verifyCookie, getPrice, asyncErrorHandler(checkout));

module.exports = router;
