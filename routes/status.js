const app = new (require('express').Router)();
const Product = require('../models/product');

app.get('/paybear/status/:order', (req, res) => {
  var orderId = req.params.order;
  Product.findByIdAndUpdate(req.params.id, {'orderId': orderId});
var confirmations = null;
  
confirmations = Product.findById(req.params.id, { confirmations: confirmations }); //get from DB, see callback.js
maxConfirmations = 3; //get from DB, see callback.js
var resp = {
  success: confirmations >= maxConfirmations
};
if(confirmations !== null)
  resp.confirmations = confirmations;
res.json(resp); //return this data to PayBear form
});
module.exports = app;