/* eslint-disable no-param-reassign */
const passport = require('passport');
const nodemailer = require('nodemailer');
const async = require('async');
const crypto = require('crypto');
const User = require('../models/user');
const Product = require('../models/product');

const EMAIL_USER = process.env.EMAIL_USER || 'k4nsyiavbcbmtcxx@ethereal.email';
const EMAIL_API_KEY = process.env.EMAIL_API_KEY || 'Mx2qnJcNKM5mp4nrG3';
const EMAIL_PORT = process.env.EMAIL_PORT || '587';
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.ethereal.email';

module.exports = {
  getRegister(req, res) {
    res.render('index/register');
  },
  // POST /register
  async postRegister(req, res) {
    const newUser = new User({ email: req.body.email, username: req.body.username });
    try {
      await User.register(newUser, req.body.password);
    } catch (error) {
      req.flash('error', error.message);
      return res.redirect('back');
    }
    passport.authenticate('local')(req, res, () => {
      req.flash('success', `Successfully signed up! Nice to meet you ${req.body.username}`);
      res.redirect('/');
    });
  },
  getLogin(req, res) {
    res.render('index/login');
  },
  // POST /login
  postLogin(req, res, next) {
    if (req.body.remember) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // Cookie expires after 30 days
    } else {
      req.session.cookie.expires = false; // Cookie expires at end of session
    }
    passport.authenticate('local',
      {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true,
      })(req, res, next);
  },
  // GET /logout
  getLogout(req, res) {
    req.logout();
    req.flash('success', 'See you later!');
    res.redirect('/');
  },
  async getIndex(req, res) {
    const products = await Product.paginate({ "feat_2.status": true, available: true }, {
      page: req.query.page || 1,
      limit: 20,
    });
    products.page = Number(products.page);
    res.render('index', { currentUser: req.user, products });
  },
  getForgot(req, res) {
    res.render('index/forgot');
  },
  postForgot(req, res, next) {
    async.waterfall([
      (done) => {
        crypto.randomBytes(20, (err, buf) => {
          const token = buf.toString('hex');
          done(err, token);
        });
      },
      (token, done) => {
        User.findOne({ email: req.body.email }, (err, user) => {
          if (!user) {
            req.flash('error', 'No account with that email address exists.');
            return res.redirect('/forgot');
          }
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
          user.save((error) => {
            done(error, token, user);
          });
        });
      },
      (token, user, done) => {
        const smtpTransport = nodemailer.createTransport({
          host: EMAIL_HOST,
          port: EMAIL_PORT,
          auth: {
            user: EMAIL_USER,
            pass: EMAIL_API_KEY,
          },
        });
        const mailOptions = {
          to: user.email,
          from: 'support@dyc.com',
          subject: 'Deal Your Crypto Password Reset',
          text: `${'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n'
            + 'Please click on the following link, or paste this into your browser to complete the process:\n\n'
            + 'http://'}${req.headers.host}/reset/${token}\n\n`
            + 'If you did not request this, please ignore this email and your password will remain unchanged.\n',
        };
        smtpTransport.sendMail(mailOptions, (err) => {
          req.flash('success', `An e-mail has been sent to ${user.email} with further instructions.`);
          done(err, 'done');
        });
      },
    ], (err) => {
      if (err) return next(err);
      res.redirect('back');
    });
  },
  getReset(req, res) {
    User.findOne(
      {
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() },
      }, (err, user) => {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('/forgot');
        }
        res.render('index/reset', { token: req.params.token });
      },
    );
  },
  postReset(req, res) {
    async.waterfall([
      (done) => {
        User.findOne(
          {
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() },
          }, (err, user) => {
            if (!user) {
              req.flash('error', 'Password reset token is invalid or has expired.');
              return res.redirect('back');
            }
            if (req.body.password === req.body.confirm) {
              user.setPassword(req.body.password, () => {
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;
                user.save(() => {
                  req.logIn(user, (error) => {
                    done(error, user);
                  });
                });
              });
            } else {
              req.flash('error', 'Passwords do not match.');
              return res.redirect('back');
            }
          },
        );
      },
      (user, done) => {
        const smtpTransport = nodemailer.createTransport({
          host: EMAIL_HOST,
          port: EMAIL_PORT,
          auth: {
            user: EMAIL_USER,
            pass: EMAIL_API_KEY,
          },
        });
        const mailOptions = {
          to: user.email,
          from: 'support@dyc.com',
          subject: 'Your password has been changed',
          text: `${'Hello,\n\n'
            + 'This is a confirmation that the password for your account '}${user.email} has just been changed.\n`,
        };
        smtpTransport.sendMail(mailOptions, (err) => {
          req.flash('success', 'Success! Your password has been changed.');
          done(err);
        });
      },
    ], () => {
      res.redirect('/');
    });
  },
  getContact(req, res) {
    res.render('index/contact');
  },
  postContact(req, res) {
    const output = `
    <h1>Contact Request - Deal Your Crypto</h1>
    <h3>Contact Details</h3>
    <ul>
      <li>Name: ${req.body.name}</li>
      <li>Email: ${req.body.email}</li>
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
        subject: 'Deal Your Crypto - Contact Request', // Subject line
        html: output, // html body
      };
      // send mail with defined transport object
      transporter.sendMail(mailOptions, (error) => {
        if (error) {
          req.flash('error', `${error.message}`);
          res.render('back', { error: error.message });
        }
        req.flash('success', 'Successfully sent a mail! We will get back to you as soon as possible!');
        res.redirect('/contact');
      });
    });
  },
  postForgotEmail(req, res, next) {
    async.waterfall([
      (done) => {
        crypto.randomBytes(20, (err, buf) => {
          const token = buf.toString('hex');
          done(err, token);
        });
      },
      (token, done) => {
        User.findOne({ email: req.body.email }, (err, user) => {
          if (!user) {
            req.flash('error', 'No account with that email address exists.');
            return res.redirect('/dashboard');
          }
          user.resetEmailToken = token;
          user.resetEmailExpires = Date.now() + 3600000; // 1 hour
          user.save((error) => {
            done(error, token, user);
          });
        });
      },
      (token, user, done) => {
        const smtpTransport = nodemailer.createTransport({
          host: EMAIL_HOST,
          port: EMAIL_PORT,
          auth: {
            user: EMAIL_USER,
            pass: EMAIL_API_KEY,
          },
        });
        const mailOptions = {
          to: user.email,
          from: 'support@dyc.com',
          subject: 'Deal Your Crypto Change Email Request',
          text: `${'You are receiving this because you (or someone else) have requested to change the email for your account.\n\n'
            + 'Please click on the following link, or paste this into your browser to complete the process:\n\n'
            + 'http://'}${req.headers.host}/resetemail/${token}\n\n`
            + 'If you did not request this, please ignore this email and your email will remain unchanged.\n',
        };
        smtpTransport.sendMail(mailOptions, (err) => {
          req.flash('success', `An e-mail has been sent to ${user.email} with further instructions.`);
          done(err, 'done');
        });
      },
    ], (err) => {
      if (err) return next(err);
      res.redirect('back');
    });
  },
  getResetEmail(req, res) {
    User.findOne(
      {
        resetEmailToken: req.params.token,
        resetEmailExpires: { $gt: Date.now() },
      }, (err, user) => {
        if (!user) {
          req.flash('error', 'Email reset token is invalid or has expired.');
          return res.redirect('/resetemail');
        }
        res.render('index/resetemail', { token: req.params.token });
      },
    );
  },
  postResetEmail(req, res) {
    async.waterfall([
      (done) => {
        User.findOne(
          {
            resetEmailToken: req.params.token,
            resetEmailExpires: { $gt: Date.now() },
          }, (err, user) => {
            if (!user) {
              req.flash('error', 'Email reset token is invalid or has expired.');
              return res.redirect('back');
            }
            if (req.body.email === req.body.confirm) {
              User.findByIdAndUpdate(req.user._id, { email: req.body.email }, () => {
                user.resetEmailToken = undefined;
                user.resetEmailExpires = undefined;
                user.save(() => {
                  req.logIn(user, (error) => {
                    done(error, user);
                  });
                });
              });
            } else {
              req.flash('error', 'Emails do not match.');
              return res.redirect('back');
            }
          },
        );
      },
      (user, done) => {
        const smtpTransport = nodemailer.createTransport({
          host: EMAIL_HOST,
          port: EMAIL_PORT,
          auth: {
            user: EMAIL_USER,
            pass: EMAIL_API_KEY,
          },
        });
        const mailOptions = {
          to: user.email,
          from: 'support@dyc.com',
          subject: 'Your email has been changed',
          text: `${'Hello,\n\n'
            + 'This is a confirmation that the email for your account '}${user.email} has just been changed.\n`,
        };
        smtpTransport.sendMail(mailOptions, (err) => {
          req.flash('success', 'Success! Your email has been changed.');
          done(err);
        });
      },
    ], () => {
      res.redirect('/');
    });
  },
  getFaq(req, res) {
    res.render('faq');
  },
  getGdpr(req, res) {
    res.render('gdpr');
  },
  getTos(req, res) {
    res.render('terms-of-service');
  },
  getPrivPol(req, res) {
    res.render('privacy-policy');
  },
};
