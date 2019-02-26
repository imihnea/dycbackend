const app = new (require('express').Router)();
const Checkout = require('../../models/checkout');
const User = require('../../models/user');

app.post('/savvy/callback/:order', (req, res) => {
  if(req.body && req.params.order) {
    var orderId = req.params.order;
    console.log('order id = ', orderId);
    console.log('callback body = ', req.body);
    console.log('---------------');
    var data = req.body;
    var invoice = data.invoice;
    var coin = data.blockchain;
    var amountPaid = data.inTransaction.amount / Math.pow(10, data.inTransaction.exp);
    console.log('amount paid ===', amountPaid);


    
    console.log(data.confirmations);
    if (data.maxConfirmations > data.confirmations) {
      var query = Checkout.findOne({ orderId: orderId });
      query.exec(function(err, checkout) {
        if(err) {
          res.send('error');
        }
        if(checkout !== null ) {
          var query_1 = Checkout.findOneAndUpdate({ orderId: orderId }, {confirmations: data.confirmations });
          query_1.then(function(doc2) {
            console.log("Confirmation arrived!");
          });
        }
      });
    } else if(data.confirmations >= data.maxConfirmations) {
      var query_2 = Checkout.findOne({ orderId: orderId });
      query_2.exec(function(err, checkout) {
        if(err) {
          res.send('error');
        }
        if(checkout !== null) {
          var user = checkout.user;
          if(coin === 'btc') {
            var query_btc = User.findByIdAndUpdate({ _id: user }, { $inc: { btcbalance: amountPaid } } );
            query_btc.then(function(doc) {
              console.log("Deposit arrived!");
            });
          }
          if(coin === 'ltc') {
            var query_ltc = User.findByIdAndUpdate({ _id: user }, { $inc: { ltcbalance: amountPaid } } );
            query_ltc.then(function(doc) {
              console.log("Deposit arrived!");
            });
          }
          if(coin === 'eth') {
            var query_eth = User.findByIdAndUpdate({ _id: user }, { $inc: { ethbalance: amountPaid } } );
            query_eth.then(function(doc) {
              console.log("Deposit arrived!");
            });
          }
          if(coin === 'bch') {
            var query_bch = User.findByIdAndUpdate({ _id: user }, { $inc: { bchbalance: amountPaid } } );
            query_bch.then(function(doc) {
              console.log("Deposit arrived!");
            });
          }
          if(coin === 'dash') {
            var query_dash = User.findByIdAndUpdate({ _id: user }, { $inc: { dashbalance: amountPaid } } );
            query_dash.then(function(doc) {
              console.log("Deposit arrived!");
            });
          }
          var query_4 = Checkout.findOneAndUpdate({ orderId: orderId }, { paid: true });
          query_4.then(function(doc) {
            console.log("Marked as paid");
          });
        }
      });
      var query_1 = Checkout.findOneAndUpdate({ orderId: orderId }, {confirmations: data.confirmations });
      query_1.then(function(doc2) {
        console.log("Confirmation arrived!");
      });
      res.send(invoice);
    } else {
      res.send('waiting for confirmations');
    }
  } 
  else {
    res.send('error');
  }

});

module.exports = app;