const app = new (require('express').Router)();
const Checkout = require('../../models/checkout');
const User = require('../../models/user');
const nodemailer = require('nodemailer');

const EMAIL_USER = process.env.EMAIL_USER || 'k4nsyiavbcbmtcxx@ethereal.email';
const EMAIL_API_KEY = process.env.EMAIL_API_KEY || 'Mx2qnJcNKM5mp4nrG3';
const EMAIL_PORT = process.env.EMAIL_PORT || '587';
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.ethereal.email';

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  auth: {
      user: EMAIL_USER,
      pass: EMAIL_API_KEY,
  },
  });

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
          var mailquery = User.findById({ _id: user });
          mailquery.exec(function(err, user1) {
            console.log(`user1 variable is === ${user1}`);
            if(err) {
              res.send('error');
            }
            
            const output = `
            <h1>Deposit successfully confirmed!</h1>
            <h3>Thank you for your trust, here are the details:</h3>
            <h3>Amount deposited: ${amountPaid} ${coin.toUpperCase()} </h3>
            <h3>We look forward to doing more business with you!</h3>
            <h3>Deal Your Crypto</h3>
            `;
                  const mailOptions = {
                      from: `support@dyc.com`, // sender address
                      to: `${user1.email}`, // list of receivers
                      subject: 'Deal Your Crypto - Balance Confirmation', // Subject line
                      html: output, // html body
                  };
                  // send mail with defined transport object
                  transporter.sendMail(mailOptions, (error) => {
                      if (error) {
                      console.log(`error for sending mail confirmation === ${error}`);
                      }
                  });

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