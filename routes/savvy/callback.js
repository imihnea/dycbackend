const app = new (require('express').Router)();
const Checkout = require('../../models/checkout');

app.post('/savvy/callback/:order', (req, res) => {
  var orderId = req.params.order;
  console.log('order id = ', orderId);
  console.log('callback body = ', req.body);
  console.log('---------------');
  var data = req.body;
  var invoice = data.invoice;
  var amount_payed = data.inTransaction.amount / Math.power(10, data.inTransaction.exp);
  console.log('amount payed ===', amount_payed);

  console.log(req.body.confirmations);
  if (req.body.confirmations >= 3) {
    res.send(invoice);
  } else {
    res.send('waiting for confirmations');
  }
});

module.exports = app;