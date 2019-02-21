const app = new (require('express').Router)();

app.post('/savvy/callback/:order', (req, res) => {
  console.log("hit callback");
  if(req.body && req.params.order) {
  var orderId = req.params.order;
  var data = req.body;
  var invoice = data.invoice;

  var query = { orderId: orderId };

  //save data.confirmations - number of confirmations to DB
  Checkout.findOneAndUpdate(query, { confirmations: data.confirmations },  function(err) {
    if(err){
      res.send(err);
    }
  });

  if(data.confirmations >= data.maxConfirmations) {
    var amountPaid = data.inTransaction.amount / Math.pow(10, data.inTransaction.exp);
    //compare $amountPaid with order total
    Checkout.findOne(query, 'orderTotal', function(err, orderTotal, next) {
      if(err) {
        res.send(err);
      } else {
        if(amountPaid >= orderTotal) {
          next();
        } else {
          res.send(`underpaid by ${orderTotal-amountPaid}`);
        }
      }
    });
    //compare $invoice with one saved in the database to ensure callback is legitimate
    Checkout.findOne(query, 'invoice', function(err, invoice, next) {
      if(err) {
        res.send(err);
      } else {
        if(invoice !== data.invoice) {
          res.send('wrong invoice');
        } else {
          next();
        }
      }
    });
    //mark the order as paid
    Checkout.findOneAndUpdate(query, { paid: true },  function(err) {
      if(err){
        res.send(err);
      }
    });
    res.send(invoice); //stop further callbacks
  } else {
    res.send('waiting for confirmations');
  }
} else {
  res.send('error');
}

});

module.exports = app;