/* eslint-disable no-param-reassign */
/* eslint-disable no-undef */
const passport = require('passport');
const ejs = require('ejs');
const path = require('path');
const nodemailer = require('nodemailer');
const async = require('async');
const crypto = require('crypto');
const User = require('../models/user');
const Product = require('../models/product');
const Subscription = require('../models/subscription');
const searchTerm = require('../models/searchTerm');
const { errorLogger, userLogger } = require('../config/winston');
const moment = require('moment');
const Nexmo = require('nexmo');
const request = require("request");
const { Categories, secCategories } = require('../dist/js/categories');
const jwt = require('jsonwebtoken');
const ObjectID = require("bson-objectid");

const nexmo = new Nexmo({
  apiKey: process.env.NEXMO_API_KEY,
  apiSecret: process.env.NEXMO_API_SECRET
});
const EMAIL_USER = process.env.EMAIL_USER || 'k4nsyiavbcbmtcxx@ethereal.email';
const EMAIL_API_KEY = process.env.EMAIL_API_KEY || 'Mx2qnJcNKM5mp4nrG3';
const EMAIL_PORT = process.env.EMAIL_PORT || '587';
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.ethereal.email';
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET;
const SECRET = 'monkaMega';
const SECRET2 = 'monkaGiga';

let transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  auth: {
      user: EMAIL_USER,
      pass: EMAIL_API_KEY,
  },
});

const escapeHTML = (unsafe) => {
  return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/@/g, "&commat;")
        .replace(/\^/g, "&Hat;")
        .replace(/:/g, "&colon;")
        .replace(/;/g, "&semi;")
        .replace(/#/g, "&num;")
        .replace(/\$/g, "&dollar;")
        .replace(/%/g, "&percent;")
        .replace(/\*/g, "&ast;")
        .replace(/\(/g, "&lpar;")
        .replace(/\)/g, "&rpar;")
        .replace(/_/g, "&UnderBar;")
        .replace(/=/g, "&equals;")
        .replace(/\+/g, "&plus;")
        .replace(/`/g, "&grave;")
        .replace(/\//g, "&sol;")
        .replace(/\\/g, "&bsol;")
        .replace(/\|/g, "&vert;")
        .replace(/\[/g, "&lsqb;")
        .replace(/\]/g, "&rsqb;")
        .replace(/\{/g, "&lcub;")
        .replace(/\}/g, "&rcub;")
        .replace(/'/g, "&#039;");
}

function sendConfirmationEmail(req, userid, useremail) {
  const token = jwt.sign({
    user: userid
  }, 
  SECRET, 
  { expiresIn: '1h' });
  ejs.renderFile(path.join(__dirname, "../views/email_templates/register.ejs"), {
    link: `http://${req.headers.host}/confirmation/${token}`,
    footerlink: `http://${req.headers.host}/dashboard/notifications`,
    subject: 'Confirm Your Email - Deal Your Crypto',
  }, function (err, data) {
    if (err) {
        console.log(err);
        errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
    } else {
    const mailOptions = {
        from: `Deal Your Crypto <noreply@dyc.com>`,
        to: `${useremail}`,
        subject: 'Email Confirmation Required',
        html: data,
    };
    transporter.sendMail(mailOptions, (error) => {
        if (error) {
          console.log(error);
          errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message} - Email: ${useremail}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        }
      });
    }
  });
};

module.exports = {
  getRegister(req, res) {
    res.render('index/register', {
      errors: false, 
      regErrors: false,
      pageTitle: 'Register - Deal Your Crypto',
      pageDescription: 'Description',
      pageKeywords: 'Keywords'
    });
  },
  // POST /register
  async postRegister(req, res) {
    if (req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
      let errors = { msg: String };
      errors.msg = 'Please complete the captcha.';
      return res.render('index/register', {
        errors, 
        regErrors: false,
        pageTitle: 'Register - Deal Your Crypto',
        pageDescription: 'Description',
        pageKeywords: 'Keywords'
      } );
    }
    const secretKey = RECAPTCHA_SECRET;
    const verificationURL = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;
    request(verificationURL, async (error, response, body) => {
      body = JSON.parse(body);
      if (body.success !== undefined && !body.success) {
        let errors = { msg: String };
        errors.msg = 'Captcha verification failed. Please try again.';
        return res.render('index/register', {
          errors, 
          regErrors: false,
          pageTitle: 'Register - Deal Your Crypto',
          pageDescription: 'Description',
          pageKeywords: 'Keywords'
        });
      }
      req.check('email', 'The email address is invalid').isEmail().notEmpty().isLength({ max: 500 });
      req.check('username', 'The username must contain only alphanumeric characters').matches(/^[a-zA-Z0-9]+$/g).notEmpty();
      req.check('username', 'The username must be between 6 and 32 characters').isLength({ min: 6, max: 32 });
      req.check('password', 'The password must be between 8 and 64 characters').isLength({ min: 8, max: 64});
      req.check('password', 'The password must contain at least one uppercase character').matches(/[A-Z]/g);
      req.check('password', 'The password must contain at least one number').matches(/[0-9]/g);
      req.check('password', 'The password must contain at least one special character').matches(/(`|!|@|#|\$|%|\^|&|\*|\(|\)|_|\\|-|=|\+|,|<|>|\.|\/|\?|;|:|'|\]|\[|\{|\}|\|)/g);
      req.check('password', 'The password contains an unsupported character').matches(/^[a-zA-Z0-9 `!@#$%^&*()_\-=+,<>./?;:'\][{}\\|]+$/g);
      // Uncomment when testing is done
      // const password = new RegExp(req.body.password, "g");
      // req.check('vfPassword', 'The passwords do not match.').matches(password).notEmpty();
      const regErrors = req.validationErrors();
      if (regErrors) {
        res.render('index/register', {
          errors: false, 
          regErrors,
          pageTitle: 'Register - Deal Your Crypto',
          pageDescription: 'Description',
          pageKeywords: 'Keywords'
        });
      } else {
        const newUser = new User({ email: req.body.email, username: req.body.username });
        try {
          const password = escapeHTML(req.body.password);
          await User.register(newUser, password);
          sendConfirmationEmail(req, newUser._id, newUser.email, SECRET);
        } catch (error) {
          errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
          req.flash('error', error.message);
          return res.redirect('back');
        }
        passport.authenticate('local', { session: false })(req, res, () => {
          res.render('index/confirmEmail', {
            user: newUser,
            pageTitle: 'Confirm Email - Deal Your Crypto',
            pageDescription: 'Description',
            pageKeywords: 'Keywords'
          });
        }); 
      }
    });
  },
  async confirmEmail(req, res) {
    let uuser;
    jwt.verify(req.params.token, SECRET, async (err) => {
      if (err) {
        if (err.message.match(/Invalid/i)) {
          req.flash('error', 'Invalid link.');
          res.redirect('/login');
        }
        if (err.message.match(/Expired/i)) {
          req.flash('error', 'The link has expired. You should receive another email shortly.');
          const id = jwt.decode(req.params.token);
          uuser = await User.findById(id.user);
          sendConfirmationEmail(req, uuser._id, uuser.email, SECRET);
          res.redirect('/login');
        }
      } else {
        const user = jwt.decode(req.params.token);
        uuser = await User.findByIdAndUpdate(user.user, { confirmed: true }, async (err) => {
          if (err) {
            console.log(err);
            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
          } else {
            req.flash('success', 'You have successfully confirmed your email. You can now log in!');
            res.redirect('/login');
          }
        });
      }
    });
  },
  postVerify(req, res) {
    let pin = req.body.pin;
    let requestId = req.body.requestId;

    nexmo.verify.check({request_id: requestId, code: pin}, (err, result) => {
      if(err) {
        errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        req.flash('error', err.message);
        return res.redirect('back');
      } else {
        if(result && result.status == '0') { // Success!
          req.check('number', 'Something went wrong. Please try again.').matches(/^[0-9]+$/g).notEmpty().isLength({ max: 500 });
          const errors = req.validationErrors();
          if (errors) {
            res.render('dashboard/dashboard', {
              user: req.user,
              errors: errors,
              pageTitle: 'Dashboard - Deal Your Crypto',
              pageDescription: 'Description',
              pageKeywords: 'Keywords'
            });
          } else {
            let phoneNumber = req.body.number;
            User.findByIdAndUpdate(req.user._id, { number: phoneNumber, twofactor: true }, (err) => {
              if (err) {
                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                req.flash('error', err.message);
                res.redirect('back');
              }
            });
            req.flash('success', 'Account 2-Factor enabled successfully! 🎉');
            res.redirect('/dashboard');
          }
        } else {
          req.flash('error', 'Wrong PIN code, please try again.');
          return res.redirect('back');
        }
      }
    });
  },
  get2factor(req, res) {
    res.render('index/2factor',{
      pageTitle: 'Two-Factor - Deal Your Crypto',
      pageDescription: 'Description',
      pageKeywords: 'Keywords'
    })
  },
  async post2factor(req, res) {
    req.check('number', 'Something went wrong. Please try again.').matches(/^[0-9]+$/g).notEmpty().isLength({ max: 500 });
    const errors = req.validationErrors();
    if (errors) {
      res.render('dashboard/dashboard', {
        user: req.user,
        errors: errors,
        pageTitle: 'Dashboard - Deal Your Crypto',
        pageDescription: 'Description',
        pageKeywords: 'Keywords'
      });
    } else {
      let phoneNumber = req.body.number;
      const user = await User.findOne({number: phoneNumber});
      if (user) {
        req.flash('error', 'Phone number already used. Please try again using another number.');
        res.redirect('/2factor');
      } else {
        nexmo.verify.request({number: phoneNumber, brand: 'Deal Your Crypto'}, (err, result) => {
          if(err) {
            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
            req.flash('error', err.message);
            res.redirect('back');
          } else {
            let requestId = result.request_id;
            if(result.status == '0') {
              res.render('index/verify', { 
                number: phoneNumber, 
                requestId: requestId,
                pageTitle: 'Verify - Deal Your Crypto',
                pageDescription: 'Description',
                pageKeywords: 'Keywords'
              }); // Success! Now, have your user enter the PIN
            } else {
              req.flash('error', 'Something went wrong, please try again.');
              res.redirect('back');
            }
          }
        });
      }
    }
  },
  postDisable2FactorRequest(req, res) {
    const token = jwt.sign({
      user: req.user._id
    }, 
    SECRET2, 
    { expiresIn: '1h' });
    ejs.renderFile(path.join(__dirname, "../views/email_templates/disable_2factor.ejs"), {
      link: `http://${req.headers.host}/disable2factor/${token}`,
      footerlink: `http://${req.headers.host}/dashboard/notifications`,
      subject: 'Disable Two-Factor Authentication - Deal Your Crypto',
    }, function (err, data) {
      if (err) {
        errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        console.log(err);
      } else {
        const mailOptions = {
            from: `Deal Your Crypto <noreply@dyc.com>`,
            to: `${req.user.email}`,
            subject: 'Disable two-factor authentication',
            html: data,
        };
        transporter.sendMail(mailOptions, (error) => {
            if (error) {
              console.log(error);
              errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message} - Email: ${req.user.email}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
            }
        });
        userLogger.info(`Message: User requested 2F disable\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        req.flash('success', `An e-mail with further instructions has been sent to ${req.user.email}.`);
        res.redirect('back');
      }
    });
  },
  postDisable2Factor(req, res) {
    jwt.verify(req.params.token, SECRET2, async (err) => {
      if (err) {
        if (err.message.match(/Invalid/i)) {
          req.flash('error', 'Invalid link.');
          res.redirect('/');
        }
        if (err.message.match(/Expired/i)) {
          req.flash('error', 'The link has expired. Please try again.');
          res.redirect('/');
        }
      } else {
        const user = jwt.decode(req.params.token);
        User.findByIdAndUpdate(user.user, { number: undefined, twofactor: false }, (err) => {
          if (err) {
            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${user.user}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
            req.flash('error', err.message);
            res.redirect('/');
          } else {
            userLogger.info(`Message: User disabled 2F\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
            req.flash('success', 'Successfully disabled 2-Factor authentication.');
            res.redirect('/');
          }
        });
      }
    });
  },
  getLogin(req, res) {
    if ( req.user ) {
      res.render('index/login', { 
        user: req.user, 
        errors: false,
        pageTitle: 'Login - Deal Your Crypto',
        pageDescription: 'Description',
        pageKeywords: 'Keywords'
      });
    } else {
      res.render('index/login', { 
        errors: false,
        pageTitle: 'Login - Deal Your Crypto',
        pageDescription: 'Description',
        pageKeywords: 'Keywords'
       });
    }
  },
  // POST /login
  postLogin(req, res, next) {
    // Captcha only shows if the user had an invalid login request 
    if (req.query.errors === 1) {
      if (req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
        let errors = { msg: String };
        errors.msg = 'Please complete the captcha.';
        return res.render('index/login', {
          errors,
          pageTitle: 'Login - Deal Your Crypto',
          pageDescription: 'Description',
          pageKeywords: 'Keywords'
        });
      }
      const secretKey = "6LdvYJcUAAAAABRACFNVD7CyVxgDa3M04i1_aGs5";
      const verificationURL = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;
      request(verificationURL, (error, response, body) => {
        body = JSON.parse(body);
        if (body.success !== undefined && !body.success) {
          let errors = { msg: String };
          errors.msg = 'Captcha verification failed. Please try again.';
          return res.render('index/login', {
            errors,
            pageTitle: 'Login - Deal Your Crypto',
            pageDescription: 'Description',
            pageKeywords: 'Keywords'
          });
        } 
      });
    }
    if (req.body.remember) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // Cookie expires after 30 days
    } else {
      req.session.cookie.expires = false; // Cookie expires at end of session
    }
    req.check('username', 'The username must contain only alphanumeric characters').matches(/^[a-zA-Z0-9]+$/g).notEmpty().isLength({ max: 500 });
    const errors = req.validationErrors();
    if (errors) {
      let err = { msg: String };
      err.msg = 'The username must contain only alphanumeric characters';
      return res.render('index/login', {
        errors: err,
        pageTitle: 'Login - Deal Your Crypto',
        pageDescription: 'Description',
        pageKeywords: 'Keywords'
      });
    } else {
      User.findOne({ username: req.body.username }, (err, user) => {
        if(err) {
          errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
          let errors = { msg: String };
          errors.msg = err.message;
          return res.render('index/login', {
            errors,
            pageTitle: 'Login - Deal Your Crypto',
            pageDescription: 'Description',
            pageKeywords: 'Keywords'
          });
        }
        if(!user) {
          let errors = { msg: String };
          errors.msg = 'Invalid user/password combination or the user does not exist.';
          return res.render('index/login', {
            errors,
            pageTitle: 'Login - Deal Your Crypto',
            pageDescription: 'Description',
            pageKeywords: 'Keywords'
          });
        }
        if ((!user.confirmed) && (!user.googleId) && (!user.facebookId)){
          res.render('index/confirmEmail', {
            user,
            pageTitle: 'Confirm Email - Deal Your Crypto',
            pageDescription: 'Description',
            pageKeywords: 'Keywords'
          });
        } else {
          if (user.twofactor === true) {
            nexmo.verify.request({number: user.number, brand: 'Deal Your Crypto'}, (err, result) => {
              if(err) {
                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                let errors = { msg: String };
                errors.msg = err.message;
                return res.render('index/login', {
                  errors,
                  pageTitle: 'Login - Deal Your Crypto',
                  pageDescription: 'Description',
                  pageKeywords: 'Keywords'
                });
              } else {
                let requestId = result.request_id;
                if(result.status == '0') {
                  res.render('index/verifylogin', { 
                    username: req.body.username, 
                    password: escapeHTML(req.body.password), 
                    requestId: requestId,
                    pageTitle: 'Verify Login - Deal Your Crypto',
                    pageDescription: 'Description',
                    pageKeywords: 'Keywords'
                   }); // Success! Now, have your user enter the PIN
                } else {
                  let errors = { msg: String };
                  errors.msg = 'Something went wrong. Please try again.';
                  return res.render('index/login', {
                    errors,
                    pageTitle: 'Login - Deal Your Crypto',
                    pageDescription: 'Description',
                    pageKeywords: 'Keywords'
                  });
                }
              }
            });
          } else {
            req.body.password = escapeHTML(req.body.password);
            passport.authenticate('local',
            {
              successFlash: 'Welcome to Deal Your Crypto!',
              successRedirect: '/dashboard',
              failureRedirect: '/login',
              failureFlash: true,
            })(req, res, next);
          }
        }
      });
    }
  },
  async resendEmail(req, res) {
    const user = await User.findById(req.params.id);
    sendConfirmationEmail(req, user._id, user.email);
    req.flash('success', 'Confirmation email resent. Please check your inbox.');
    res.redirect('/login');
  },
  postVerifyLogin(req, res, next) {
    let pin = req.body.pin;
    let requestId = req.body.requestId;
    nexmo.verify.check({request_id: requestId, code: pin}, (err, result) => {
      if(err) {
        errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        req.flash('error', err.message);
        return res.redirect('back');
      } else {
        if(result && result.status == '0') { // Success!
            passport.authenticate('local',
          {
            successFlash: 'Welcome to Deal Your Crypto!',
            successRedirect: '/',
            failureRedirect: '/login',
            failureFlash: true,
          })(req, res, next);
        } else {
          req.flash('error', 'Wrong PIN code, please try again.');
          return res.redirect('back');
        }
      }
    });
  },
  // GET /logout
  getLogout(req, res) {
    req.logout();
    req.flash('success', 'See you later!');
    res.redirect('/');
  },
  async getIndex(req, res) {
    await Product.aggregate().match({$and: [{"feat_2.status": true}, {available: "True"}]}).sample(50).exec((err, result) => {
        if (err) {
          if(req.user) {
            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
          } else {
            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
          }
          return res.render('index', { 
            user: req.user, 
            'products.length': 0, 
            errors: false,
            onlyFeatured: false,
            pageTitle: 'Deal Your Crypto',
            pageDescription: 'Description',
            pageKeywords: 'Keywords'
          });
        } else {
          let products = result;
          if (products.length < 20) {
            let ids = [];
            products.forEach((product) => {
              ids.push(ObjectID(product._id));
            });
            Product.aggregate().match({$and: [{available: "True"}, {_id: {$nin: ids}}]}).sample(20 - products.length).exec((err, result) => {
              if (err) {
                if(req.user) {
                  errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                } else {
                  errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                }
                return res.render('index', { 
                  user: req.user, 
                  products,
                  errors: false,
                  onlyFeatured: false,
                  pageTitle: 'Deal Your Crypto',
                  pageDescription: 'Description',
                  pageKeywords: 'Keywords'
                }); 
              } else {
                Array.from(result).forEach((res) => {
                  products.push(res);
                });
                if ((result.length < (20 - products.length)) && (result.length != 0)) {
                  return res.render('index', { 
                    user: req.user, 
                    products,
                    errors: false,
                    onlyFeatured: false,
                    pageTitle: 'Deal Your Crypto',
                    pageDescription: 'Description',
                    pageKeywords: 'Keywords'
                  }); 
                } else {
                  return res.render('index', { 
                    user: req.user, 
                    products,
                    errors: false,
                    onlyFeatured: false,
                    pageTitle: 'Deal Your Crypto',
                    pageDescription: 'Description',
                    pageKeywords: 'Keywords'
                  }); 
                }
              }
            });
          } else {
            return res.render('index', { 
              user: req.user, 
              products,
              errors: false,
              onlyFeatured: true,
              pageTitle: 'Deal Your Crypto',
              pageDescription: 'Description',
              pageKeywords: 'Keywords'
            });
          }
        }
    });
  },
  getError(req, res) {
    res.render('errorPage', {
      pageTitle: 'Error - Deal Your Crypto',
      pageDescription: 'Description',
      pageKeywords: 'Keywords'
    });
  },
  getForgot(req, res) {
    res.render('index/forgot', {
      pageTitle: 'Forgot Password - Deal Your Crypto',
      pageDescription: 'Description',
      pageKeywords: 'Keywords'
    });
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
        req.check('email', 'Invalid email address.').isEmail().notEmpty().isLength({ max: 500 });
        const errors = req.validationErrors();
        if (errors) {
          req.flash('error', 'Invalid email address.');
          return res.redirect('/forgot');
        }
        User.findOne({ email: req.body.email }, (err, user) => {
          if (!user) {
            req.flash('error', 'An email was sent to that address if it is linked with an account.');
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
          userLogger.info(`Message: User requested a password reset\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
          req.flash('success', `An e-mail with further instructions has been sent to ${user.email}.`);
          done(err, 'done');
        });
      },
    ], (err) => {
      if (err) return next(err);
      res.redirect('back');
    });
  },
  getCategories(req, res) {
    res.render('index/categories',{
      errors: false, 
      pageTitle: 'Categories - Deal Your Crypto',
      pageDescription: 'Description',
      pageKeywords: 'Keywords'
    });
  },
    async firstCategSearch(req, res) {
      let currency = [];
      let secCat = [];
      let from = 0;
      req.check('searchName', 'Error: The query contains illegal characters.').matches(/^$|[a-zA-Z0-9 .,!?]+$/g).isLength({ max: 500 });
      req.check('category', 'Error: The category contains illegal characters.').matches(/^[a-zA-Z ]+$/g).notEmpty().isLength({ max: 500 });
      if (req.body.from) {
        req.check('from', 'Error: Page does not match. Please contact us regarding this issue.').isNumeric().notEmpty().isLength({ max: 500 });
        from = req.body.from;
      }
      let continent = '';
      if (req.body.continent) {
        req.check('continent', 'Error: Continent does not match. Please contact us regarding this issue.').matches(/^(fric|si|urop|orth|ceani|outh)$/g).notEmpty();
        continent = req.body.continent;
      }
      if (req.body.currency) {
        // The currency is given is this format -> currency-asc/desc
        req.check('currency', 'Error: Currency does not match. Please contact us regarding this issue.').matches(/^(btc-asc|btc-desc)$/g);
        currency = req.body.currency.split('-');
      }
      let condition = '';
      if (req.body.condition) {
        req.check('condition', 'Error: Condition does not match. Please contact us regarding this issue.').matches(/^(and|ik|efur|se|oke)$/g);
        condition = req.body.condition;
      }
      let avgRating = '';
      if (req.body.avgRating) {
        req.check('avgRating', 'Error: Rating does not match. Please contact us regarding this issue.').matches(/^(asc|desc)$/g);
        avgRating = req.body.avgRating;
      }
      const errors = req.validationErrors();
      if (errors) {
        const products = await Product.paginate({ "feat_2.status": true, available: "True" }, {
          page: req.query.page || 1,
          limit: 20,
        });
        products.page = Number(products.page);
        res.render('index', {
          user: req.user,
          errors,
          products,
          pageTitle: 'Deal Your Crypto',
          pageDescription: 'Description',
          pageKeywords: 'Keywords'
        });
      } else {
        if (from === 0) {
          let search = {};
          if (req.user) {
            search = {
              query: req.body.searchName,
              queryFilters: {
                category: req.body.category,
                condition,
                avgRating,
              },
              author: {
                id: req.user._id,
                username: req.user.username,
                city: req.user.city,
                state: req.user.state,
                country: req.user.country,
                continent: req.user.continent
              }
            };
          } else {
            search = {
              query: req.body.searchName,
              queryFilters: {
                category: req.body.category,
                condition,
                avgRating,
              }
            };
          }
          searchTerm.create(search);
        }
        await Product.search(
          { 
            "bool": { 
              "must": [
                { "match": { "category": `${req.body.category}` }},
                { "wildcard": { "author.continent": `*${continent}*`}},
                { "wildcard": {"condition": `*${condition}*`}}
              ],
              "should": [
                { "wildcard": { "searchableTags": `*${req.body.searchName}*` }},
                { "wildcard": { "name": `*${req.body.searchName}*` }}
              ],
              "minimum_should_match": 1
            },
          }, 
          { from: from, size: 10, sort: [`${currency[0]}Price:${currency[1]}`, `avgRating:${avgRating}`, "feat_1.status:desc", "createdAt:desc"] },
          (err, products) => {
            if (err) {
              if(req.user) {
                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
              } else {
                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
              }
              console.log(err);
            } else {
              Categories.forEach((item) => {
                if (req.body.category == item.name) {
                  secCat = item.opt;
                }
              });
              res.render('index/searchFirstCateg', { 
                products: products.hits.hits, 
                total: products.hits.total, 
                from, 
                searchName: req.body.searchName, 
                searchCateg: req.body.category, 
                secCat, 
                currency: req.body.currency, 
                continent, 
                avgRating, 
                condition,
                pageTitle: `${req.body.searchName} - Deal Your Crypto`,
                pageDescription: 'Description',
                pageKeywords: 'Keywords'
              });
            }
          }
        ); 
      }
    },
    async secondCategSearch(req, res) {
      let currency = [];
      let thiCat = [];
      let from = 0;
      req.check('searchName', 'Error: The query contains illegal characters.').matches(/^$|[a-zA-Z0-9 ]+$/g).isLength({ max: 500 });
      req.check('category', 'Error: The category contains illegal characters.').matches(/^[a-zA-Z0-9 ]+$/g).notEmpty().isLength({ max: 500 });
      req.check('searchCateg', 'Error: The category contains illegal characters.').matches(/^[a-zA-Z0-9 ]+$/g).notEmpty().isLength({ max: 500 });
      if (req.body.from) {
        req.check('from', 'Error: Page does not match. Please contact us regarding this issue.').isNumeric().notEmpty().isLength({ max: 500 });
        from = req.body.from;
      }
      let continent = '';
      if (req.body.continent) {
        req.check('continent', 'Error: Continent does not match. Please contact us regarding this issue.').matches(/^(fric|si|urop|orth|ceani|outh)$/g).notEmpty();
        continent = req.body.continent;
      }
      if (req.body.currency) {
        // The currency is given is this format -> currency-asc/desc
        req.check('currency', 'Error: Currency does not match. Please contact us regarding this issue.').matches(/^(btc-asc|btc-desc)$/g);
        currency = req.body.currency.split('-');
      }
      let condition = '';
      if (req.body.condition) {
        req.check('condition', 'Error: Condition does not match. Please contact us regarding this issue.').matches(/^(and|ik|efur|se|oke)$/g);
        condition = req.body.condition;
      }
      let avgRating = '';
      if (req.body.avgRating) {
        req.check('avgRating', 'Error: Rating does not match. Please contact us regarding this issue.').matches(/^(asc|desc)$/g);
        avgRating = req.body.avgRating;
      }
      const errors = req.validationErrors();
      if (errors) {
        const products = await Product.paginate({ "feat_2.status": true, available: "True" }, {
          page: req.query.page || 1,
          limit: 20,
        });
        products.page = Number(products.page);
        res.render('index', {
          user: req.user,
          errors,
          products,
          pageTitle: 'Deal Your Crypto',
          pageDescription: 'Description',
          pageKeywords: 'Keywords'
        });
      } else {
        if (from === 0) {
          let search = {};
          if (req.user) {
            search = {
              query: req.body.searchName,
              queryFilters: {
                category: req.body.searchCateg,
                secondCategory: req.body.category,
                condition,
                avgRating,
              },
              author: {
                id: req.user._id,
                username: req.user.username,
                city: req.user.city,
                state: req.user.state,
                country: req.user.country,
                continent: req.user.continent
              }
            };
          } else {
            search = {
              query: req.body.searchName,
              queryFilters: {
                category: req.body.searchCateg,
                secondCategory: req.body.category,
                condition,
                avgRating,
              }
            };
          }
          searchTerm.create(search);
        }
        await Product.search(
          { 
            "bool": { 
              "must": [
                { "match": { "category": `${req.body.searchCateg}`}},
                { "match": { "category": `${req.body.category}`}},
                { "wildcard": { "author.continent": `*${continent}*`}},
                { "wildcard": {"condition": `*${condition}*`}}
              ],
              "should": [
                { "wildcard": { "searchableTags": `*${req.body.searchName}*` }},
                { "wildcard": { "name": `*${req.body.searchName}*` }}
              ],
              "minimum_should_match": 1
            }
          }, 
          { from: from, size: 10, sort: [`${currency[0]}Price:${currency[1]}`, `avgRating:${avgRating}`, "feat_1.status:desc", "createdAt:desc"] },
          (err, products) => {
            if (err) {
              if(req.user) {
                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
              } else {
                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
              }
              console.log(err);
            } else {
              secCategories.forEach((item) => {
                if (req.body.category == item.name) {
                  thiCat = item.opt;
                }
              });
              res.render('index/searchSecondCateg', { 
                products: products.hits.hits, 
                searchName: req.body.searchName, 
                total: products.hits.total, 
                from, 
                searchCateg: req.body.searchCateg, 
                secondSearchCateg: req.body.category, 
                thiCat, 
                currency: req.body.currency, 
                continent, 
                avgRating, 
                condition,
                pageTitle: `${req.body.searchName} - Deal Your Crypto`,
                pageDescription: 'Description',
                pageKeywords: 'Keywords'
              });
            }
          }
        );
      }
    },
    async thirdCategSearch(req, res){
      let currency = [];
      let from = 0;
      req.check('searchName', 'Error: The query contains illegal characters.').matches(/^$|[a-zA-Z0-9 ]+$/g).isLength({ max: 500 });
      req.check('category', 'Error: The category contains illegal characters.').matches(/^[a-zA-Z0-9 ]+$/g).notEmpty().isLength({ max: 500 });
      req.check('searchCateg', 'Error: The category contains illegal characters.').matches(/^[a-zA-Z0-9 ]+$/g).notEmpty().isLength({ max: 500 });
      req.check('secondSearchCateg', 'Error: The category contains illegal characters.').matches(/^[a-zA-Z0-9 ]+$/g).notEmpty().isLength({ max: 500 });
      if (req.body.from) {
        req.check('from', 'Error: Page does not match. Please contact us regarding this issue.').isNumeric().notEmpty().isLength({ max: 500 });
        from = req.body.from;
      }
      let continent = '';
      if (req.body.continent) {
        req.check('continent', 'Error: Continent does not match. Please contact us regarding this issue.').matches(/^(fric|si|urop|orth|ceani|outh)$/g).notEmpty();
        continent = req.body.continent;
      }
      if (req.body.currency) {
        // The currency is given is this format -> currency-asc/desc
        req.check('currency', 'Error: Currency does not match. Please contact us regarding this issue.').matches(/^(btc-asc|btc-desc)$/g);
        currency = req.body.currency.split('-');
      }
      let condition = '';
      if (req.body.condition) {
        req.check('condition', 'Error: Condition does not match. Please contact us regarding this issue.').matches(/^(and|ik|efur|se|oke)$/g);
        condition = req.body.condition;
      }
      let avgRating = '';
      if (req.body.avgRating) {
        req.check('avgRating', 'Error: Rating does not match. Please contact us regarding this issue.').matches(/^(asc|desc)$/g);
        avgRating = req.body.avgRating;
      }
      const errors = req.validationErrors();
      if (errors) {
        const products = await Product.paginate({ "feat_2.status": true, available: "True" }, {
          page: req.query.page || 1,
          limit: 20,
        });
        products.page = Number(products.page);
        res.render('index', {
          user: req.user,
          errors,
          products,
          pageTitle: 'Deal Your Crypto',
          pageDescription: 'Description',
          pageKeywords: 'Keywords'
        });
      } else {
        if (from === 0) {
          let search = {};
          if (req.user) {
            search = {
              query: req.body.searchName,
              queryFilters: {
                category: req.body.searchCateg,
                secondCategory: req.body.secondSearchCateg,
                thirdCategory: req.body.category,
                condition,
                avgRating,
              },
              author: {
                id: req.user._id,
                username: req.user.username,
                city: req.user.city,
                state: req.user.state,
                country: req.user.country,
                continent: req.user.continent
              }
            };
          } else {
            search = {
              query: req.body.searchName,
              queryFilters: {
                category: req.body.searchCateg,
                secondCategory: req.body.secondSearchCateg,
                thirdCategory: req.body.category,
                condition,
                avgRating,
              }
            };
          }
          searchTerm.create(search);
        }
        await Product.search(
          { 
            "bool": { 
              "must": [
                { "match": { "category": `${req.body.searchCateg}`}},
                { "match": { "category": `${req.body.secondSearchCateg}`}},
                { "match": { "category": `${req.body.category}`}},
                { "wildcard": { "author.continent": `*${continent}*`}},
                { "wildcard": {"condition": `*${condition}*`}}
              ],
              "should": [
                { "wildcard": { "searchableTags": `*${req.body.searchName}*` }},
                { "wildcard": { "name": `*${req.body.searchName}*` }}
              ],
              "minimum_should_match": 1
            }
          }, 
          { from: from, size: 10, sort: [`${currency[0]}Price:${currency[1]}`, `avgRating:${avgRating}`, "feat_1.status:desc", "createdAt:desc"] },
          (err, products) => {
            if (err) {
              if(req.user) {
                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
              } else {
                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
              }
              console.log(err);
            } else {
              res.render('index/searchThirdCateg', { 
                products: products.hits.hits, 
                searchName: req.body.searchName, 
                total: products.hits.total, 
                from, 
                searchCateg: req.body.searchCateg, 
                secondSearchCateg: req.body.secondSearchCateg, 
                thirdSearchCateg: req.body.category, 
                currency: req.body.currency, 
                continent, 
                avgRating, 
                condition,
                pageTitle: `${req.body.searchName} - Deal Your Crypto`,
                pageDescription: 'Description',
                pageKeywords: 'Keywords'
              });
            }
          }
        );
      }
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
        res.render('index/reset', { 
          token: req.params.token,
          pageTitle: 'Reset Password - Deal Your Crypto',
          pageDescription: 'Description',
          pageKeywords: 'Keywords'
        });
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
  async getContact(req, res) {
    if (req.user) {
      let premium = await Subscription.findOne({userid: req.user._id}, (err, sub) => {
        if(err) {
          console.log('Failed to retrieve subscription.');
          errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Failed to retrieve subscription\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        }
      });
      res.render('index/contact', {
        user: req.user,
        premium,
        errors: false, 
        validationErrors: false,
        pageTitle: 'Contact - Deal Your Crypto',
        pageDescription: 'Description',
        pageKeywords: 'Keywords'
      });
    } else {
      res.render('index/contact', {
        user: false,
        premium: false,
        errors: false, 
        validationErrors: false,
        pageTitle: 'Contact - Deal Your Crypto',
        pageDescription: 'Description',
        pageKeywords: 'Keywords'
      });
    }
  },
  async postContact(req, res) {
    if (req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
      let errors = { msg: String };
      errors.msg = 'Please complete the captcha.';
      return res.render('index/contact', {
        errors, 
        validationErrors: false,
        pageTitle: 'Contact - Deal Your Crypto',
        pageDescription: 'Description',
        pageKeywords: 'Keywords'
      });
    }
    const secretKey = RECAPTCHA_SECRET;
    const verificationURL = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;
    request(verificationURL, async (error, response, body) => {
      body = JSON.parse(body);
      if (body.success !== undefined && !body.success) {
        let errors = { msg: String };
        errors.msg = 'Captcha verification failed. Please try again.';
        return res.render('index/contact', {
          errors,
          pageTitle: 'Contact - Deal Your Crypto',
          pageDescription: 'Description',
          pageKeywords: 'Keywords'
        });
      }
      req.check('name', 'The name contains invalid characters.').matches(/^[a-zA-Z0-9 -]+$/g).trim().notEmpty()
      .isLength({ max: 500 });
      req.check('email', 'The email address is invalid.').isEmail().normalizeEmail().notEmpty()
      .trim()
      .isLength({ max: 500 });
      req.check('topic', 'Something went wrong. Please try again.').matches(/^(General|Payments|Delivery|Bugs|Suggestions)$/g).notEmpty();
      req.check('message', 'The message is too long.').notEmpty().trim().isLength({ max: 2000 });
      const validationErrors = req.validationErrors();
      if (validationErrors) {
        res.render('index/contact', {
          user: req.user,
          validationErrors,
          errors: false,
          pageTitle: 'Contact - Deal Your Crypto',
          pageDescription: 'Description',
          pageKeywords: 'Keywords'
        });
      } else {
        const message = escapeHTML(req.body.message);
        ejs.renderFile(path.join(__dirname, "../views/email_templates/contact.ejs"), {
          name: req.body.name,
          email: req.body.email,
          topic: req.body.topic,
          message,
          subject: 'Deal Your Crypto - Contact Request',
        }, function (err, data) {
          if (err) {
            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
            console.log(err);
          } else {
          const mailOptions = {
            from: `${req.body.name} <${req.body.email}>`, // sender address
            to: 'ionitamihneadjgogu@gmail.com', // list of receivers
            subject: 'Deal Your Crypto - Contact Request', // Subject line
            html: data, // html body
          };
          transporter.sendMail(mailOptions, (error) => {
            if (error) {
              if(req.user) {
                errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message} - Email: ${req.body.email}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
              } else {
                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Email: ${req.body.email}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
              }
              req.flash('error', `${error.message}`);
              res.redirect('back', { error: error.message });
            }
            req.flash('success', 'Message sent successfully! We will get back to you as soon as possible!');
            res.redirect('/');
          });
        }
       });
      }
    });
  },
  async postContactUser(req, res) {
    if (req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
      let errors = { msg: String };
      errors.msg = 'Please complete the captcha.';
      return res.render('index/contact', {
        errors, 
        validationErrors: false,
        pageTitle: 'Contact - Deal Your Crypto',
        pageDescription: 'Description',
        pageKeywords: 'Keywords'
      });
    }
    const secretKey = RECAPTCHA_SECRET;
    const verificationURL = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;
    request(verificationURL, async (error, response, body) => {
      body = JSON.parse(body);
      if (body.success !== undefined && !body.success) {
        let errors = { msg: String };
        errors.msg = 'Captcha verification failed. Please try again.';
        return res.render('index/contact', {
          errors,
          pageTitle: 'Contact - Deal Your Crypto',
          pageDescription: 'Description',
          pageKeywords: 'Keywords'
        });
      }
      req.check('name', 'The name contains invalid characters.').matches(/^[a-zA-Z0-9 -]+$/g).trim().notEmpty()
      .isLength({ max: 500 });
      req.check('email', 'The email address is invalid.').isEmail().normalizeEmail().notEmpty()
      .trim()
      .isLength({ max: 500 });
      req.check('topic', 'Something went wrong. Please try again.').matches(/^(General|Payments|Delivery|Bugs|Suggestions)$/g).notEmpty();
      req.check('message', 'The message is too long.').notEmpty().trim().isLength({ max: 2000 });
      const validationErrors = req.validationErrors();
      if (validationErrors) {
        let premium = await Subscription.findOne({userid: req.user._id}, (err, sub) => {
          if(err) {
            console.log('Failed to retrieve subscription.');
            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Failed to retrieve subscription\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
          }
        });
        res.render('index/contact', {
          user: req.user,
          premium,
          validationErrors,
          errors: false,
          pageTitle: 'Contact - Deal Your Crypto',
          pageDescription: 'Description',
          pageKeywords: 'Keywords'
        });
      } else {
        let premium = await Subscription.findOne({userid: req.user._id}, (err, sub) => {
          if(err) {
            console.log('Failed to retrieve subscription.');
            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Failed to retrieve subscription\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
          }
        });
        if (!premium) {
          ejs.renderFile(path.join(__dirname, "../views/email_templates/contact.ejs"), {
            name: req.body.name,
            email: req.body.email,
            topic: req.body.topic,
            message: req.body.message,
            subject: 'Deal Your Crypto - Contact Request',
          }, function (err, data) {
            if (err) {
              errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
              console.log(err);
            } else {
            const mailOptions = {
              from: `${req.body.name} <${req.body.email}>`, // sender address
              to: 'adrianpopa97@gmail.com', // list of receivers
              subject: 'Deal Your Crypto - Contact Request', // Subject line
              html: data, // html body
            };
            transporter.sendMail(mailOptions, (error) => {
              if (error) {
                errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                req.flash('error', `${error.message}`);
                res.redirect('back', { error: error.message });
              }
              req.flash('success', 'Message sent successfully! We will get back to you as soon as possible!');
              res.redirect('/');
            });
          }
         });
        } else {
          ejs.renderFile(path.join(__dirname, "../views/email_templates/contact.ejs"), {
            name: req.body.name,
            email: req.body.email,
            topic: req.body.topic,
            message: req.body.message,
            subject: 'Deal Your Crypto - Priority Contact Request',
          }, function (err, data) {
            if (err) {
              errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);              
              console.log(err);
            } else {
            const mailOptions = {
              from: `${req.body.name} <${req.body.email}>`, // sender address
              to: 'adrianpopa97@gmail.com', // list of receivers
              subject: 'Deal Your Crypto - Priority Contact Request', // Subject line
              html: data, // html body
            };
            transporter.sendMail(mailOptions, (error) => {
              if (error) {
                errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                req.flash('error', `${error.message}`);
                res.redirect('back', { error: error.message });
              }
              req.flash('success', 'Message sent successfully! We will get back to you as soon as possible!');
              res.redirect('/');
            });
          }
         });
        }
      }
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
        req.check('email', 'Invalid email address.').isEmail().notEmpty().isLength({ max: 500 });
        const errors = req.validationErrors();
        if (errors) {
          req.flash('error', 'Invalid email address.');
          return res.redirect('/dashboard');
        }
        User.findOne({ email: req.body.email }, (err, user) => {
          if (!user) {
            req.flash('success', 'An email was sent to that address if it is linked with an account.');
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
          req.flash('success', `An email was sent to that address if it is linked with an account.`);
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
        res.render('index/resetemail', { 
          token: req.params.token,
          pageTitle: 'Reset Email - Deal Your Crypto',
          pageDescription: 'Description',
          pageKeywords: 'Keywords'
         });
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
  getAbout(req, res) {
    res.render('about', {
      pageTitle: 'About - Deal Your Crypto',
      pageDescription: 'Description',
      pageKeywords: 'Keywords'
    });
  },
  getTeam(req, res) {
    res.render('team', {
      pageTitle: 'Our Team - Deal Your Crypto',
      pageDescription: 'Description',
      pageKeywords: 'Keywords'
    });
  },
  getServices(req, res) {
    res.render('services', {
      pageTitle: 'Services - Deal Your Crypto',
      pageDescription: 'Description',
      pageKeywords: 'Keywords'
    });
  },
  getFaq(req, res) {
    res.render('faq', {
      pageTitle: 'Frequently Asked Questions - Deal Your Crypto',
      pageDescription: 'Description',
      pageKeywords: 'Keywords'
    });
  },
  getGdpr(req, res) {
    res.render('gdpr', {
      pageTitle: 'General Data Protection - Deal Your Crypto',
      pageDescription: 'Description',
      pageKeywords: 'Keywords'
    });
  },
  getTos(req, res) {
    res.render('terms-of-service', {
      pageTitle: 'Terms of Service - Deal Your Crypto',
      pageDescription: 'Description',
      pageKeywords: 'Keywords'
    });
  },
  getPrivPol(req, res) {
    res.render('privacy-policy', {
      pageTitle: 'Privacy Policy - Deal Your Crypto',
      pageDescription: 'Description',
      pageKeywords: 'Keywords'
    });
  },
};
