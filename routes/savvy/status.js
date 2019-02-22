const app = new (require('express').Router)();
const Checkout = require('../../models/checkout');

app.get('/savvy/status/:order', async (req, res) => {
  var orderId = req.params.order;
var confirmations = null;
  
var confirmations1 = await Checkout.findOne({orderId: orderId}, '-_id confirmations', function(err, confirmations) { 
  if(err) {
    res.send(err)
  }
}); //get from DB, see callback.js
var maxConfirmations1 = await Checkout.findOne({orderId: orderId}, '-_id maxConfirmations', function(err, maxConfirmations) { 
  if(err) {
    res.send(err)
  }
}); //get from DB, see callback.js

confirmations = confirmations1.confirmations;
maxConfirmations = maxConfirmations1.maxConfirmations;

console.log('----------------------');
console.log(confirmations);
console.log(maxConfirmations);
console.log('----------------------');

var resp = {
  success: confirmations >= maxConfirmations
};
if(confirmations !== null)
  resp.confirmations = confirmations;
res.json(resp); //return this data to savvy form
});

module.exports = app;