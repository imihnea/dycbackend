const app = new (require('express').Router)();
const Checkout = require('../../models/checkout');

app.get('/savvy/status/:order', (req, res) => {
  var orderId = req.params.order;
var confirmations = null;
var maxConfirmations = null;
  
Checkout.findOne({ orderId: orderId }, function(err, checkout) {
  if(err || checkout === null){
    console.log('status.js la confirmations var')
    req.flash('error', 'There is no such transaction.');
    res.redirect('/');
    } else {
    confirmations = checkout.confirmations;
    maxConfirmations = checkout.maxConfirmations;
    var resp = {
      success: confirmations >= maxConfirmations
    };
    if(confirmations !== null)
      resp.confirmations = confirmations;
    res.json(resp); //return this data to savvy form
    }
  });
}); //get from DB, see callback.js

module.exports = app;