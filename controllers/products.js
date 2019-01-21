const nodemailer = require('nodemailer');

const Product = require('../models/product');

const EMAIL_USER = process.env.EMAIL_USER || 'k4nsyiavbcbmtcxx@ethereal.email';
const EMAIL_API_KEY = process.env.EMAIL_API_KEY || 'Mx2qnJcNKM5mp4nrG3';
const EMAIL_PORT = process.env.EMAIL_PORT || '587';
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.ethereal.email';

module.exports = {
    async getProduct(req, res) {
        const product = await Product.findById(req.params.id).populate({
            path: 'reviews',
            options: { sort: { _id: -1 } },
            populate: {
              path: 'author',
              model: 'User',
            },
        });
        const floorRating = product.calculateAvgRating();
        res.render('products/product_view', { product, floorRating });
    },
    postReport(req, res) {
      const output = `
      <h1>Contact Request - User Report - Deal Your Crypto</h1>
      <h3>Contact Details</h3>
      <ul>
        <li>Id: ${req.user._id}</li>
        <li>Name: ${req.user.full_name}</li>
        <li>Email: ${req.user.email}</li>
        <li>Reported user ID: ${req.body.userid}</li>
        <li>Chat user was reported from: ${req.params.id}</li> 
        <li>Topic: ${req.body.topic}</li>
      </ul>
      <h3>Message</h3>
      <p>${req.body.message}</p>
      `;
       // Generate test SMTP service account from ethereal.email
        // Only needed if you don't have a real mail account for testing
        nodemailer.createTestAccount(() => {
            // create reusable transporter object using the default SMTP transport
            const transporter = nodemailer.createTransport({
            host: EMAIL_HOST,
            port: EMAIL_PORT,
            auth: {
                user: EMAIL_USER,
                pass: EMAIL_API_KEY,
            },
            });
            // setup email data with unicode symbols
            const mailOptions = {
                from: `${req.body.name} <${req.body.email}>`, // sender address
                to: 'support@dyc.com', // list of receivers
                subject: 'Deal Your Crypto - User Report - Contact Request', // Subject line
                html: output, // html body
            };
            // send mail with defined transport object
            transporter.sendMail(mailOptions, (error) => {
                if (error) {
                req.flash('error', `${error.message}`);
                res.render('back', { error: error.message });
                }
                req.flash('success', 'Report sent successfully! We will get back to you as soon as possible.');
                res.redirect('back');
            }); 
        });
    }
}