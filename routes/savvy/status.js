const app = new (require('express').Router)();
const Checkout = require('../../models/checkout');

app.get('/savvy/status/:order', (req, res) => {
  var orderId = req.params.order;
var confirmations = null;
var maxConfirmations = null;

function getCheckout(checkout){
  var query = Checkout.find({orderId:orderId});
  return query;
}

var query = getCheckout(orderId);
confirmations = query.confirmations;
maxConfirmations = query.maxConfirmations;

var resp = {
  success: confirmations >= maxConfirmations
};
if(confirmations !== null)
  resp.confirmations = confirmations;
res.json(resp); //return this data to savvy form
});
module.exports = app;