const app = new (require('express').Router)();
const Checkout = require('../../models/checkout');

app.get('/savvy/status/:order', async (req, res) => {
  var orderId = req.params.order;
var confirmations = null;
  
confirmations = await Checkout.findOne({orderId: orderId}, 'confirmations', function(err, confirmations) { 
  if(err) {
    res.send(err)
  }
}); //get from DB, see callback.js
maxConfirmations = await Checkout.findOne({orderId: orderId}, 'maxConfirmations', function(err, maxConfirmations) { 
  if(err) {
    res.send(err)
  }
}); //get from DB, see callback.js

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