const app = new (require('express').Router)();
const Checkout = require('../models/checkout');

app.get('/savvy/status/:order', (req, res) => {
  var orderId = req.params.order;
var confirmations = null;
  
confirmations = Checkout.findOne({ orderId: orderId }, 'confirmations', function(err, checkout) {
  if(err){
    res.send(err);
  }
}); //get from DB, see callback.js
maxConfirmations = Checkout.findOne({ orderId: orderId }, 'maxConfirmations', function(err, checkout) {
  if(err){
    res.send(err);
  }
});  //get from DB, see callback.js
var resp = {
  success: confirmations >= maxConfirmations
};
if(confirmations !== null)
  resp.confirmations = confirmations;
res.json(resp); //return this data to savvy form
});
module.exports = app;