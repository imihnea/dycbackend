const express = require('express');

const nodemailer = require('nodemailer');

const router = express.Router();

// index route

router.get('/', (req, res) => {
  res.render('index', { currentUser: req.user });
});

// contact page

router.get('/contact', (req, res) => {
  res.render('contact');
});

router.post('/contact/send', (req, res) => {
  const output = `
  <h1>You have a new contact request</h1>
  <h3>Contact Details</h3>
  <ul>
    <li>Name: ${req.body.name}</li>
    <li>Email: ${req.body.email}</li>
  </ul>
  <h3>Message</h3>
  <p>${req.body.message}</p>
  `;
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  nodemailer.createTestAccount((err, account) => {
    // create reusable transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'k4nsyiavbcbmtcxx@ethereal.email',
        pass: 'Mx2qnJcNKM5mp4nrG3',
      },
    });

    // setup email data with unicode symbols
    const mailOptions = {
      from: '"Crypto ATM" <k4nsyiavbcbmtcxx@ethereal.email>', // sender address
      to: 'support@cryptoatm.ro', // list of receivers
      subject: 'Crypto ATM - Contact Request', // Subject line
      html: output, // html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(error);
      }
      console.log('Message sent: %s', info.messageId);
      // Preview only available when sending through an Ethereal account
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      req.flash('success', 'Successfully sent a mail! We will get back to you as soon as possible!');
      res.redirect('/contact');
      // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
      // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    });
  });
});

module.exports = router;