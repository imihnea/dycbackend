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
const middleware = require('../middleware/index');

const { asyncErrorHandler } = middleware; // destructuring assignment

const nexmo = new Nexmo({
  apiKey: process.env.NEXMO_API_KEY,
  apiSecret: process.env.NEXMO_API_SECRET
});
const EMAIL_USER = process.env.EMAIL_USER || 'k4nsyiavbcbmtcxx@ethereal.email';
const EMAIL_API_KEY = process.env.EMAIL_API_KEY || 'Mx2qnJcNKM5mp4nrG3';
const EMAIL_PORT = process.env.EMAIL_PORT || '587';
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.ethereal.email';
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET;
const SECRET = process.env.REGISTER_SECRET;
const SECRET2 = process.env.TWOFACTOR_SECRET;

let transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  auth: {
      user: EMAIL_USER,
      pass: EMAIL_API_KEY,
  },
});

const { client } = require('../config/elasticsearch');

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

const cleanHTML = (unclean) => {
  return unclean
    .replace(/</g, "")
    .replace(/>/g, "");
};

function sendConfirmationEmail(req, userid, useremail) {
  const token = jwt.sign({
    user: userid
  }, 
  SECRET, 
  { expiresIn: '1h' });
  ejs.renderFile(path.join(__dirname, "../views/email_templates/register.ejs"), {
    link: `https://${req.headers.host}/confirmation/${token}`,
    footerlink: `https://${req.headers.host}/dashboard/notifications`,
    subject: 'Confirm Your Email - Deal Your Crypto',
  }, function (err, data) {
    if (err) {
        errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
    } else {
    const mailOptions = {
        from: `Deal Your Crypto <noreply@dealyourcrypto.com>`,
        to: `${useremail}`,
        subject: 'Email Confirmation Required',
        html: data,
    };
    transporter.sendMail(mailOptions, (error) => {
        if (error) {
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
      pageDescription: 'Register an account on Deal Your Crypto and start buying and selling products!',
      pageKeywords: 'register account, register, sign up, deal your crypto, dealyourcrypto, crypto deal, deal crypto'
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
        pageDescription: 'Register an account on Deal Your Crypto and start buying and selling products!',
        pageKeywords: 'register account, register, sign up, deal your crypto, dealyourcrypto, crypto deal, deal crypto'
      } );
    }
    const secretKey = RECAPTCHA_SECRET;
    const verificationURL = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;
    request(verificationURL, asyncErrorHandler(async (error, response, body) => {
      body = JSON.parse(body);
      if (body.success !== undefined && !body.success) {
        let errors = { msg: String };
        errors.msg = 'Captcha verification failed. Please try again.';
        return res.render('index/register', {
          errors, 
          regErrors: false,
          pageTitle: 'Register - Deal Your Crypto',
          pageDescription: 'Register an account on Deal Your Crypto and start buying and selling products!',
          pageKeywords: 'register account, register, sign up, deal your crypto, dealyourcrypto, crypto deal, deal crypto'
        });
      }
      req.check('email', 'The email address is invalid').isEmail().notEmpty().isLength({ max: 500 });
      req.check('username', 'The username must contain only alphanumeric characters').matches(/^[a-zA-Z0-9]+$/g).notEmpty();
      req.check('username', 'The username must be between 6 and 32 characters').isLength({ min: 6, max: 32 });
      req.check('password', 'The password must be between 8 and 64 characters').isLength({ min: 8, max: 64});
      req.check('password', 'The password must contain at least one uppercase character').matches(/[A-Z]/g);
      req.check('password', 'The password must contain at least one lowercase character').matches(/[a-z]/g);
      req.check('password', 'The password must contain at least one number').matches(/[0-9]/g);
      req.check('password', 'The password must contain at least one special character').matches(/(`|!|@|#|\$|%|\^|&|\*|\(|\)|_|\\|-|=|\+|,|<|>|\.|\/|\?|;|:|'|\]|\[|\{|\}|\|)/g);
      req.check('password', 'The password contains an unsupported character').matches(/^[a-zA-Z0-9 `!@#$%^&*()_\-=+,<>./?;:'\][{}\\|]+$/g);
      req.check('vfPassword', 'The passwords do not match.').equals(`${req.body.password}`).notEmpty();
      const regErrors = req.validationErrors();
      if (regErrors) {
        res.render('index/register', {
          errors: false, 
          regErrors,
          pageTitle: 'Register - Deal Your Crypto',
          pageDescription: 'Register an account on Deal Your Crypto and start buying and selling products!',
          pageKeywords: 'register account, register, sign up, deal your crypto, dealyourcrypto, crypto deal, deal crypto'
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
            pageDescription: 'Confirm your email on Deal Your Crypto and start buying and selling products!',
            pageKeywords: 'confirm email, email, deal your crypto, dealyourcrypto, crypto deal, deal crypto'
          });
        }); 
      }
    }));
  },
  async confirmEmail(req, res) {
    let uuser;
    jwt.verify(req.params.token, SECRET, asyncErrorHandler(async (err) => {
      if (err) {
        if (err.message.match(/Invalid/i)) {
          req.flash('error', 'Invalid link.');
          return res.redirect('/login');
        }
        if (err.message.match(/Expired/i)) {
          req.flash('error', 'The link has expired. You should receive another email shortly.');
          const id = jwt.decode(req.params.token);
          uuser = await User.findById(id.user);
          sendConfirmationEmail(req, uuser._id, uuser.email, SECRET);
          return res.redirect('/login');
        }
      } else {
        const user = jwt.decode(req.params.token);
        uuser = await User.findByIdAndUpdate(user.user, { confirmed: true }, async (err) => {
          if (err) {
            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
          } else {
            req.flash('success', 'You have successfully confirmed your email. You can now log in!');
            return res.redirect('/login');
          }
        });
      }
    }));
  },
  // postVerify(req, res) {
  //   let pin = req.body.pin;
  //   let requestId = req.body.requestId;

  //   nexmo.verify.check({request_id: requestId, code: pin}, (err, result) => {
  //     if(err) {
  //       errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
  //       req.flash('error', err.message);
  //       return res.redirect('back');
  //     } else {
  //       if(result && result.status == '0') { // Success!
  //         req.check('number', 'Something went wrong. Please try again.').matches(/^[0-9]+$/g).notEmpty().isLength({ max: 500 });
  //         const errors = req.validationErrors();
  //         if (errors) {
  //           res.render('dashboard/dashboard', {
  //             user: req.user,
  //             errors: errors,
  //             pageTitle: 'Dashboard - Deal Your Crypto',
  //             pageDescription: 'Your personal dashboard on Deal Your Crypto, the first marketplace dedicated to cryptocurrency.',
  //             pageKeywords: 'dashboard, personal dashboard, deal your crypto, dealyourcrypto, crypto deal, deal crypto'
  //           });
  //         } else {
  //           let phoneNumber = req.body.number;
  //           User.findByIdAndUpdate(req.user._id, { number: phoneNumber, twofactor: true }, (err) => {
  //             if (err) {
  //               errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
  //               req.flash('error', err.message);
  //               return res.redirect('back');
  //             }
  //           });
  //           req.flash('success', 'Account 2-Factor enabled successfully! 🎉');
  //           return res.redirect('/dashboard');
  //         }
  //       } else {
  //         req.flash('error', 'Wrong PIN code, please try again.');
  //         return res.redirect('back');
  //       }
  //     }
  //   });
  // },
  // get2factor(req, res) {
  //   res.render('index/2factor',{
  //     pageTitle: 'Two-Factor - Deal Your Crypto',
  //     pageDescription: 'Enable two-factor authentication to enhance your account security!',
  //     pageKeywords: 'two-factor, 2factor, security, deal your crypto, dealyourcrypto, crypto deal, deal crypto'
  //   })
  // },
  // async post2factor(req, res) {
  //   req.check('number', 'Something went wrong. Please try again.').matches(/^[0-9]+$/g).notEmpty().isLength({ max: 500 });
  //   const errors = req.validationErrors();
  //   if (errors) {
  //     res.render('dashboard/dashboard', {
  //       user: req.user,
  //       errors: errors,
  //       pageTitle: 'Dashboard - Deal Your Crypto',
  //       pageDescription: 'Your personal dashboard on Deal Your Crypto, the first marketplace dedicated to cryptocurrency.',
  //       pageKeywords: 'dashboard, personal dashboard, deal your crypto, dealyourcrypto, crypto deal, deal crypto'
  //     });
  //   } else {
  //     let phoneNumber = req.body.number;
  //     const user = await User.findOne({number: phoneNumber});
  //     if (user) {
  //       req.flash('error', 'Phone number already used. Please try again using another number.');
  //       return res.redirect('/2factor');
  //     } else {
  //       nexmo.verify.request({number: phoneNumber, brand: 'Deal Your Crypto'}, (err, result) => {
  //         if(err) {
  //           errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
  //           req.flash('error', err.message);
  //           return res.redirect('back');
  //         } else {
  //           let requestId = result.request_id;
  //           if(result.status == '0') {
  //             res.render('index/verify', { 
  //               number: phoneNumber, 
  //               requestId: requestId,
  //               pageTitle: 'Verify - Deal Your Crypto',
  //               pageDescription: 'Verify your phone number to activate two-factor authentication.',
  //               pageKeywords: 'phone number, verify, check, deal your crypto, dealyourcrypto, crypto deal, deal crypto'
  //             }); // Success! Now, have your user enter the PIN
  //           } else {
  //             req.flash('error', 'Something went wrong, please try again.');
  //             return res.redirect('back');
  //           }
  //         }
  //       });
  //     }
  //   }
  // },
  // postDisable2FactorRequest(req, res) {
  //   const token = jwt.sign({
  //     user: req.user._id
  //   }, 
  //   SECRET2, 
  //   { expiresIn: '1h' });
  //   ejs.renderFile(path.join(__dirname, "../views/email_templates/disable_2factor.ejs"), {
  //     link: `https://${req.headers.host}/disable2factor/${token}`,
  //     footerlink: `https://${req.headers.host}/dashboard/notifications`,
  //     subject: 'Disable Two-Factor Authentication - Deal Your Crypto',
  //   }, function (err, data) {
  //     if (err) {
  //       errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
  //     } else {
  //       const mailOptions = {
  //           from: `Deal Your Crypto <noreply@dealyourcrypto.com>`,
  //           to: `${req.user.email}`,
  //           subject: 'Disable two-factor authentication',
  //           html: data,
  //       };
  //       transporter.sendMail(mailOptions, (error) => {
  //           if (error) {
  //             errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message} - Email: ${req.user.email}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
  //           }
  //       });
  //       userLogger.info(`Message: User requested 2F disable\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
  //       req.flash('success', `An e-mail with further instructions has been sent to ${req.user.email}.`);
  //       return res.redirect('back');
  //     }
  //   });
  // },
  // postDisable2Factor(req, res) {
  //   jwt.verify(req.params.token, SECRET2, asyncErrorHandler(async (err) => {
  //     if (err) {
  //       if (err.message.match(/Invalid/i)) {
  //         req.flash('error', 'Invalid link.');
  //         return res.redirect('/');
  //       }
  //       if (err.message.match(/Expired/i)) {
  //         req.flash('error', 'The link has expired. Please try again.');
  //         return res.redirect('/');
  //       }
  //     } else {
  //       const user = jwt.decode(req.params.token);
  //       User.findByIdAndUpdate(user.user, { number: undefined, twofactor: false }, (err) => {
  //         if (err) {
  //           errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${user.user}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
  //           req.flash('error', err.message);
  //           return res.redirect('/');
  //         } else {
  //           userLogger.info(`Message: User disabled 2F\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
  //           req.flash('success', 'Successfully disabled 2-Factor authentication.');
  //           return res.redirect('/');
  //         }
  //       });
  //     }
  //   }));
  // },
  getLogin(req, res) {
    if ( req.user ) {
      res.render('index/login', { 
        user: req.user, 
        errors: false,
        pageTitle: 'Login - Deal Your Crypto',
        pageDescription: 'Login on Deal Your Crypto and start buying and selling products!',
        pageKeywords: 'login account, login, log in, deal your crypto, dealyourcrypto, crypto deal, deal crypto'
      });
    } else {
      res.render('index/login', { 
        errors: false,
        pageTitle: 'Login - Deal Your Crypto',
        pageDescription: 'Login on Deal Your Crypto and start buying and selling products!',
        pageKeywords: 'login account, login, log in, deal your crypto, dealyourcrypto, crypto deal, deal crypto'
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
          pageDescription: 'Login on Deal Your Crypto and start buying and selling products!',
          pageKeywords: 'login account, login, log in, deal your crypto, dealyourcrypto, crypto deal, deal crypto'
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
            pageDescription: 'Login on Deal Your Crypto and start buying and selling products!',
            pageKeywords: 'login account, login, log in, deal your crypto, dealyourcrypto, crypto deal, deal crypto'
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
        pageDescription: 'Login on Deal Your Crypto and start buying and selling products!',
        pageKeywords: 'login account, login, log in, deal your crypto, dealyourcrypto, crypto deal, deal crypto'
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
            pageDescription: 'Login on Deal Your Crypto and start buying and selling products!',
            pageKeywords: 'login account, login, log in, deal your crypto, dealyourcrypto, crypto deal, deal crypto'
          });
        }
        if(!user) {
          let errors = { msg: String };
          errors.msg = 'Invalid user/password combination or the user does not exist.';
          return res.render('index/login', {
            errors,
            pageTitle: 'Login - Deal Your Crypto',
            pageDescription: 'Login on Deal Your Crypto and start buying and selling products!',
            pageKeywords: 'login account, login, log in, deal your crypto, dealyourcrypto, crypto deal, deal crypto'
          });
        }
        if (user.ban.length > 0) {
          if (user.ban[user.ban.length - 1].until > Date.now()) {
            req.flash('error', 'Your account is suspended. Please check your email for more information');
            return res.redirect('/');
          }
        }
        if ((!user.confirmed) && (!user.googleId) && (!user.facebookId)){
          res.render('index/confirmEmail', {
            user,
            pageTitle: 'Confirm Email - Deal Your Crypto',
            pageDescription: 'Confirm your email to activate your account on Deal Your Crypto.',
            pageKeywords: 'confirm email, confirm, email, deal your crypto, dealyourcrypto, crypto deal, deal crypto'
          });
        } else {
          // verif password
          // if (user.twofactor === true) {
          //   nexmo.verify.request({number: user.number, brand: 'Deal Your Crypto'}, (err, result) => {
          //     if(err) {
          //       errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
          //       let errors = { msg: String };
          //       errors.msg = err.message;
          //       return res.render('index/login', {
          //         errors,
          //         pageTitle: 'Login - Deal Your Crypto',
          //         pageDescription: 'Login on Deal Your Crypto and start buying and selling products!',
          //         pageKeywords: 'login account, login, log in, deal your crypto, dealyourcrypto, crypto deal, deal crypto'
          //       });
          //     } else {
          //       let requestId = result.request_id;
          //       if(result.status == '0') {
          //         res.render('index/verifylogin', { 
          //           username: req.body.username, 
          //           password: escapeHTML(req.body.password), 
          //           requestId: requestId,
          //           pageTitle: 'Verify Login - Deal Your Crypto',
          //           pageDescription: 'Verify your login on Deal Your Crypto.',
          //           pageKeywords: 'verify login, verify, login, deal your crypto, dealyourcrypto, crypto deal, deal crypto'
          //          }); // Success! Now, have your user enter the PIN
          //       } else {
          //         let errors = { msg: String };
          //         errors.msg = 'Something went wrong. Please try again.';
          //         return res.render('index/login', {
          //           errors,
          //           pageTitle: 'Login - Deal Your Crypto',
          //           pageDescription: 'Login on Deal Your Crypto and start buying and selling products!',
          //           pageKeywords: 'login account, login, log in, deal your crypto, dealyourcrypto, crypto deal, deal crypto'
          //         });
          //       }
          //     }
          //   });
          // } else {
            req.body.password = escapeHTML(req.body.password);
            passport.authenticate('local',
            {
              successFlash: 'Welcome to Deal Your Crypto!',
              successRedirect: '/dashboard',
              failureRedirect: '/login',
              failureFlash: true,
            })(req, res, next);
          // }
        }
      });
    }
  },
  async resendEmail(req, res) {
    const user = await User.findById(req.params.id);
    sendConfirmationEmail(req, user._id, user.email);
    req.flash('success', 'Confirmation email resent. Please check your inbox.');
    return res.redirect('/login');
  },
  // postVerifyLogin(req, res, next) {
  //   let pin = req.body.pin;
  //   let requestId = req.body.requestId;
  //   nexmo.verify.check({request_id: requestId, code: pin}, (err, result) => {
  //     if(err) {
  //       errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
  //       req.flash('error', err.message);
  //       return res.redirect('back');
  //     } else {
  //       if(result && result.status == '0') { // Success!
  //           passport.authenticate('local',
  //         {
  //           successFlash: 'Welcome to Deal Your Crypto!',
  //           successRedirect: '/',
  //           failureRedirect: '/login',
  //           failureFlash: true,
  //         })(req, res, next);
  //       } else {
  //         req.flash('error', 'Wrong PIN code, please try again.');
  //         return res.redirect('back');
  //       }
  //     }
  //   });
  // },
  // GET /logout
  getLogout(req, res) {
    req.logout();
    req.flash('success', 'Successfully logged out!');
    return res.redirect('/');
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
            pageDescription: 'Buy and sell art, jewelry, electronics, fashion apparel, sporting goods and everything else for Bitcoin on Deal Your Crypto, the first marketplace dedicated to cryptocurrency.',
            pageKeywords: 'buy with bitcoin, sell for bitcoin, bitcoin, bitcoin market, crypto, cryptocurrency, deal your crypto, dealyourcrypto, crypto deal, deal crypto'
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
                  pageDescription: 'Buy and sell art, jewelry, electronics, fashion apparel, sporting goods and everything else for Bitcoin on Deal Your Crypto, the first marketplace dedicated to cryptocurrency.',
                  pageKeywords: 'buy with bitcoin, sell for bitcoin, bitcoin, bitcoin market, crypto, cryptocurrency, deal your crypto, dealyourcrypto, crypto deal, deal crypto'
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
                    pageDescription: 'Buy and sell art, jewelry, electronics, fashion apparel, sporting goods and everything else for Bitcoin on Deal Your Crypto, the first marketplace dedicated to cryptocurrency.',
                    pageKeywords: 'buy with bitcoin, sell for bitcoin, bitcoin, bitcoin market, crypto, cryptocurrency, deal your crypto, dealyourcrypto, crypto deal, deal crypto'
                  }); 
                } else {
                  return res.render('index', { 
                    user: req.user, 
                    products,
                    errors: false,
                    onlyFeatured: false,
                    pageTitle: 'Deal Your Crypto',
                    pageDescription: 'Buy and sell art, jewelry, electronics, fashion apparel, sporting goods and everything else for Bitcoin on Deal Your Crypto, the first marketplace dedicated to cryptocurrency.',
                    pageKeywords: 'buy with bitcoin, sell for bitcoin, bitcoin, bitcoin market, crypto, cryptocurrency, deal your crypto, dealyourcrypto, crypto deal, deal crypto'
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
              pageDescription: 'Buy and sell art, jewelry, electronics, fashion apparel, sporting goods and everything else for Bitcoin on Deal Your Crypto, the first marketplace dedicated to cryptocurrency.',
              pageKeywords: 'buy with bitcoin, sell for bitcoin, bitcoin, bitcoin market, crypto, cryptocurrency, deal your crypto, dealyourcrypto, crypto deal, deal crypto'
            });
          }
        }
    });
  },
  getError(req, res) {
    res.render('errorPage', {
      pageTitle: 'Error - Deal Your Crypto',
      pageDescription: 'Error 404, the page you were looking for does not exist.',
      pageKeywords: 'error, bug, error page, 404, error 404'
    });
  },
  getForgot(req, res) {
    res.render('index/forgot', {
      pageTitle: 'Forgot Password - Deal Your Crypto',
      pageDescription: 'Forgot your password? Fill out the form and we will send you an email!',
      pageKeywords: 'forgot password, forgot, password, email'
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
          from: 'noreply@dealyourcrypto.com',
          subject: 'Deal Your Crypto Password Reset',
          text: `${'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n'
            + 'Please click on the following link, or paste this into your browser to complete the process:\n\n'
            + 'https://'}${req.headers.host}/reset/${token}\n\n`
            + 'If you did not request this, please ignore this email and your password will remain unchanged.\n',
        };
        smtpTransport.sendMail(mailOptions, (err) => {
          userLogger.info(`Message: User requested a password reset\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserEmail: ${user.email}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
          req.flash('success', `An e-mail with further instructions has been sent to ${user.email}.`);
          done(err, 'done');
        });
      },
    ], (err) => {
      if (err) return next(err);
      return res.redirect('back');
    });
  },
  getCategories(req, res) {
    res.render('index/categories',{
      errors: false, 
      pageTitle: 'Categories - Deal Your Crypto',
      pageDescription: 'Browse all categories for products to buy and sell for Bitcoin on Deal Your Crypto, the first marketplace dedicated to cryptocurrency.',
      pageKeywords: 'all categories, categories, bitcoin, bitcoin market, crypto, cryptocurrency'
    });
  },
  postFirstCategSearch(req, res) {
    let query = '';
    let errors;
    if (req.body.continent) {
      req.check('continent', 'Error: Continent does not match. Please contact us regarding this issue.').matches(/^(fric|si|urop|orth|ceani|outh)$/g).notEmpty();
      errors = req.validationErrors();
      if (errors) {
        return res.redirect('/error');
      }
      continent = req.body.continent;
      query += `continent=${req.body.continent}&`
    }     
    if (req.body.avgRating) {
      req.check('avgRating', 'Error: Rating does not match. Please contact us regarding this issue.').matches(/^(asc|desc)$/g);
      errors = req.validationErrors();
      if (errors) {
        return res.redirect('/error');
      }
      avgRating = req.body.avgRating;
      query += `avgRating=${req.body.avgRating}&`
    }
    if (req.body.currency) {
      req.check('currency', 'Error: Currency does not match. Please contact us regarding this issue.').matches(/^(asc|desc)$/g);
      errors = req.validationErrors();
      if (errors) {
        return res.redirect('/error');
      }
      query += `currency=${req.body.currency}&`;
    }
    if (req.body.condition) {
      req.check('condition', 'Error: Condition does not match. Please contact us regarding this issue.').matches(/^(and|ik|efur|se|oke)$/g);
      errors = req.validationErrors();
      if (errors) {
        return res.redirect('/error');
      }
      query += `condition=${req.body.condition}&`
    }
    if (req.body.from) {
      req.check('from', 'Error: Page does not match. Please contact us regarding this issue.').isNumeric().notEmpty().isLength({ max: 500 });
      errors = req.validationErrors();
      if (errors) {
        return res.redirect('/error');
      }
      query += `from=${req.body.from}`;
    }
    return res.redirect(`${req.originalUrl}?category=${req.body.category}&searchName=${req.body.searchName}&${query}`);
  },
  postSecondCategSearch(req, res) {
    let query = '';
    let errors;
    if (req.body.continent) {
      req.check('continent', 'Error: Continent does not match. Please contact us regarding this issue.').matches(/^(fric|si|urop|orth|ceani|outh)$/g).notEmpty();
      errors = req.validationErrors();
      if (errors) {
        return res.redirect('/error');
      }
      continent = req.body.continent;
      query += `continent=${req.body.continent}&`
    }     
    if (req.body.avgRating) {
      req.check('avgRating', 'Error: Rating does not match. Please contact us regarding this issue.').matches(/^(asc|desc)$/g);
      errors = req.validationErrors();
      if (errors) {
        return res.redirect('/error');
      }
      avgRating = req.body.avgRating;
      query += `avgRating=${req.body.avgRating}&`
    }
    if (req.body.currency) {
      req.check('currency', 'Error: Currency does not match. Please contact us regarding this issue.').matches(/^(asc|desc)$/g);
      errors = req.validationErrors();
      if (errors) {
        return res.redirect('/error');
      }
      query += `currency=${req.body.currency}&`;
    }
    if (req.body.condition) {
      req.check('condition', 'Error: Condition does not match. Please contact us regarding this issue.').matches(/^(and|ik|efur|se|oke)$/g);
      errors = req.validationErrors();
      if (errors) {
        return res.redirect('/error');
      }
      query += `condition=${req.body.condition}&`
    }
    if (req.body.from) {
      req.check('from', 'Error: Page does not match. Please contact us regarding this issue.').isNumeric().notEmpty().isLength({ max: 500 });
      errors = req.validationErrors();
      if (errors) {
        return res.redirect('/error');
      }
      query += `from=${req.body.from}`;
    }
    return res.redirect(`${req.originalUrl}?category=${req.body.category}&searchCateg=${req.body.searchCateg}&searchName=${req.body.searchName}&${query}`);
  },
  postThirdCategSearch(req, res) {
    let query = '';
    let errors;
    if (req.body.continent) {
      req.check('continent', 'Error: Continent does not match. Please contact us regarding this issue.').matches(/^(fric|si|urop|orth|ceani|outh)$/g).notEmpty();
      errors = req.validationErrors();
      if (errors) {
        return res.redirect('/error');
      }
      continent = req.body.continent;
      query += `continent=${req.body.continent}&`
    }     
    if (req.body.avgRating) {
      req.check('avgRating', 'Error: Rating does not match. Please contact us regarding this issue.').matches(/^(asc|desc)$/g);
      errors = req.validationErrors();
      if (errors) {
        return res.redirect('/error');
      }
      avgRating = req.body.avgRating;
      query += `avgRating=${req.body.avgRating}&`
    }
    if (req.body.currency) {
      req.check('currency', 'Error: Currency does not match. Please contact us regarding this issue.').matches(/^(asc|desc)$/g);
      errors = req.validationErrors();
      if (errors) {
        return res.redirect('/error');
      }
      query += `currency=${req.body.currency}&`;
    }
    if (req.body.condition) {
      req.check('condition', 'Error: Condition does not match. Please contact us regarding this issue.').matches(/^(and|ik|efur|se|oke)$/g);
      errors = req.validationErrors();
      if (errors) {
        return res.redirect('/error');
      }
      query += `condition=${req.body.condition}&`
    }
    if (req.body.from) {
      req.check('from', 'Error: Page does not match. Please contact us regarding this issue.').isNumeric().notEmpty().isLength({ max: 500 });
      errors = req.validationErrors();
      if (errors) {
        return res.redirect('/error');
      }
      query += `from=${req.body.from}`;
    }
    return res.redirect(`${req.originalUrl}?category=${req.body.category}&searchCateg=${req.body.searchCateg}&secondSearchCateg=${req.body.secondSearchCateg}&searchName=${req.body.searchName}&${query}`);
  },
    async firstCategSearch(req, res) {
      let currency;
      let secCat = [];
      let from = 0;
      req.check('searchName', 'Error: The query contains too many characters.').isLength({ max: 500 });
      req.check('category', 'Error: The category contains illegal characters.').matches(/^[a-zA-Z &]+$/g).notEmpty().isLength({ max: 500 });
      let sort = [{"feat_1.status": {'order': "desc"}}, {"_score": {"order": "desc"}}, {"createdAt": {'order': "desc"}}];
      let continent = '';
      let avgRating = '';
      let condition = '';
      if (req.query.continent) {
        continent = req.query.continent;
      }
      if (req.query.avgRating) {
        avgRating = req.query.avgRating;
        sort.unshift({'avgRating': {'order': `${avgRating}`}});
      }
      if (req.query.currency) {
        currency = req.query.currency;
        sort.unshift({'btcPrice': {'order': `${currency}`}});
      }
      if (req.query.condition) {
        condition = req.query.condition;
      }
      if (req.query.from) {
        from = req.query.from;
      }
      const errors = req.validationErrors();
      if (errors) {
        return res.status(404).redirect('/error');
      } else {
        req.query.searchName = cleanHTML(req.query.searchName);     
        if (from === 0) {
          let search = {};
          if (req.user) {
            search = {
              query: req.query.searchName,
              queryFilters: {
                category: req.query.category,
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
              query: req.params.searchName,
              queryFilters: {
                category: req.query.category,
                condition,
                avgRating,
              }
            };
          }
          searchTerm.create(search);
        }
        client.search({
          index: 'products',
          type: 'products',
          body: {
              from: from,
              size: 10,
              "track_scores": true,
              sort,
              query: {
                bool: {
                  must: [
                    { "match": { "category": `${req.query.category}` }},
                    { "wildcard": { "author.continent": `*${continent}*`}},
                    { "wildcard": {"condition": `*${condition}*`}}
                  ],
                  "should": [
                    { "wildcard": { "searchableTags": `*${req.query.searchName}*` }},
                    { "wildcard": { "name": `*${req.query.searchName}*` }}
                  ],
                  "minimum_should_match": 1
                }
              }
          }
        }).then(function(products) {
          Categories.forEach((item) => {
            if (req.query.category == item.name) {
              secCat = item.opt;
            }
          });
          res.render('index/searchFirstCateg', { 
            products: products.hits.hits, 
            total: products.hits.total.value, 
            from, 
            searchName: req.query.searchName, 
            searchCateg: req.query.category, 
            secCat, 
            currency: req.query.currency, 
            continent, 
            avgRating, 
            condition,
            pageTitle: `${req.query.searchName} - Deal Your Crypto`,
            pageDescription: `Get the best deal for ${req.query.searchName} paid with Bitcoin on Deal Your Crypto, the first marketplace dedicated to cryptocurrency.`,
            pageKeywords: `${req.query.searchName}, buy ${req.query.searchName} with bitcoin, sell ${req.query.searchName} for bitcoin, bitcoin, bitcoin market, crypto`
          });
        }, function(err) {
            console.trace(err.message);
            if(req.user) {
              errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
            } else {
              errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
            }
        });
      }
    },
    async secondCategSearch(req, res) {
      let currency;
      let thiCat = [];
      let from = 0;
      req.query.searchName = String(req.query.searchName);
      req.check('searchName', 'Error: The query contains too many characters.').isLength({ max: 500 });      
      req.check('category', 'Error: The category contains illegal characters.').matches(/^[a-zA-Z0-9 &]+$/g).notEmpty().isLength({ max: 500 });
      req.check('searchCateg', 'Error: The category contains illegal characters.').matches(/^[a-zA-Z0-9 &]+$/g).notEmpty().isLength({ max: 500 });
      let sort = [{"feat_1.status": {'order': "desc"}}, {"_score": {"order": "desc"}}, {"createdAt": {'order': "desc"}}];
      let continent = '';
      let avgRating = '';
      let condition = '';
      if (req.query.continent) {
        continent = req.query.continent;
      }
      if (req.query.avgRating) {
        avgRating = req.query.avgRating;
        sort.unshift({'avgRating': {'order': `${avgRating}`}});
      }
      if (req.query.currency) {
        currency = req.query.currency;
        sort.unshift({'btcPrice': {'order': `${currency}`}});
      }
      if (req.query.condition) {
        condition = req.query.condition;
      }
      if (req.query.from) {
        from = req.query.from;
      }
      const errors = req.validationErrors();
      if (errors) {
        return res.status(404).redirect('/error');
      } else {
        req.body.searchName = cleanHTML(req.query.searchName);
        if (from === 0) {
          let search = {};
          if (req.user) {
            search = {
              query: req.query.searchName,
              queryFilters: {
                category: req.query.searchCateg,
                secondCategory: req.query.category,
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
                category: req.query.searchCateg,
                secondCategory: req.query.category,
                condition,
                avgRating,
              }
            };
          }
          searchTerm.create(search);
        }
        client.search({
          index: 'products',
          type: 'products',
          body: {
              from: from,
              size: 10,
              "track_scores": true,
              sort,
              query: {
                bool: {
                  must: [
                    { "match": { "category": `${req.query.searchCateg}`}},
                    { "match": { "category": `${req.query.category}`}},
                    { "wildcard": { "author.continent": `*${continent}*`}},
                    { "wildcard": {"condition": `*${condition}*`}}
                  ],
                  "should": [
                    { "wildcard": { "searchableTags": `*${req.query.searchName}*` }},
                    { "wildcard": { "name": `*${req.query.searchName}*` }}
                  ],
                  "minimum_should_match": 1
                }
              }
          }
        }).then(function(products) {
          secCategories.forEach((item) => {
            if (req.query.category == item.name) {
              thiCat = item.opt;
            }
          });
          res.render('index/searchSecondCateg', { 
            products: products.hits.hits, 
            searchName: req.query.searchName, 
            total: products.hits.total.value, 
            from, 
            searchCateg: req.query.searchCateg, 
            secondSearchCateg: req.query.category, 
            thiCat, 
            currency: req.query.currency, 
            continent, 
            avgRating, 
            condition,
            pageTitle: `${req.query.searchName} - Deal Your Crypto`,
            pageDescription: `Get the best deal for ${req.query.searchName} paid with Bitcoin on Deal Your Crypto, the first marketplace dedicated to cryptocurrency.`,
            pageKeywords: `${req.query.searchName}, buy ${req.query.searchName} with bitcoin, sell ${req.query.searchName} for bitcoin, bitcoin, bitcoin market, crypto`
          });
        }, function(err) {
            console.trace(err.message);
            if(req.user) {
              errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
            } else {
              errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
            }
        });
      }
    },
    async thirdCategSearch(req, res){
      let currency;
      let from = 0;
      req.query.searchName = String(req.query.searchName);
      req.check('searchName', 'Error: The query contains too many characters.').isLength({ max: 500 });      
      req.check('category', 'Error: The category contains illegal characters.').matches(/^[a-zA-Z0-9 &]+$/g).notEmpty().isLength({ max: 500 });
      req.check('searchCateg', 'Error: The category contains illegal characters.').matches(/^[a-zA-Z0-9 &]+$/g).notEmpty().isLength({ max: 500 });
      req.check('secondSearchCateg', 'Error: The category contains illegal characters.').matches(/^[a-zA-Z0-9 &]+$/g).notEmpty().isLength({ max: 500 });
      let sort = [{"feat_1.status": {'order': "desc"}}, {"_score": {"order": "desc"}}, {"createdAt": {'order': "desc"}}];
      let continent = '';
      let avgRating = '';
      let condition = '';
      if (req.query.continent) {
        continent = req.query.continent;
      }
      if (req.query.avgRating) {
        avgRating = req.query.avgRating;
        sort.unshift({'avgRating': {'order': `${avgRating}`}});
      }
      if (req.query.currency) {
        currency = req.query.currency;
        sort.unshift({'btcPrice': {'order': `${currency}`}});
      }
      if (req.query.condition) {
        condition = req.query.condition;
      }
      if (req.query.from) {
        from = req.query.from;
      }
      const errors = req.validationErrors();
      if (errors) {
        return res.redirect('/error');
      } else {
        req.query.searchName = cleanHTML(req.query.searchName);   
        if (from === 0) {
          let search = {};
          if (req.user) {
            search = {
              query: req.query.searchName,
              queryFilters: {
                category: req.query.searchCateg,
                secondCategory: req.query.secondSearchCateg,
                thirdCategory: req.query.category,
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
              query: req.query.searchName,
              queryFilters: {
                category: req.query.searchCateg,
                secondCategory: req.query.secondSearchCateg,
                thirdCategory: req.query.category,
                condition,
                avgRating,
              }
            };
          }
          searchTerm.create(search);
        }
        client.search({
          index: 'products',
          type: 'products',
          body: {
              from: from,
              size: 10,
              "track_scores": true,
              sort,
              query: {
                bool: {
                  must: [
                    { "match": { "category": `${req.query.searchCateg}`}},
                    { "match": { "category": `${req.query.secondSearchCateg}`}},
                    { "match": { "category": `${req.query.category}`}},
                    { "wildcard": { "author.continent": `*${continent}*`}},
                    { "wildcard": {"condition": `*${condition}*`}}
                  ],
                  "should": [
                    { "wildcard": { "searchableTags": `*${req.query.searchName}*` }},
                    { "wildcard": { "name": `*${req.query.searchName}*` }}
                  ],
                  "minimum_should_match": 1
                }
              }
          }
        }).then(function(products) {
          res.render('index/searchThirdCateg', { 
            products: products.hits.hits, 
            searchName: req.query.searchName, 
            total: products.hits.total.value, 
            from, 
            searchCateg: req.query.searchCateg, 
            secondSearchCateg: req.query.secondSearchCateg, 
            thirdSearchCateg: req.query.category, 
            currency: req.query.currency, 
            continent, 
            avgRating, 
            condition,
            pageTitle: `${req.query.searchName} - Deal Your Crypto`,
            pageDescription: `Get the best deal for ${req.query.searchName} paid with Bitcoin on Deal Your Crypto, the first marketplace dedicated to cryptocurrency.`,
            pageKeywords: `${req.query.searchName}, buy ${req.query.searchName} with bitcoin, sell ${req.query.searchName} for bitcoin, bitcoin, bitcoin market, crypto`
          });
        }, function(err) {
            console.trace(err.message);
            if(req.user) {
              errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
            } else {
              errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
            }
        });
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
          pageDescription: 'Reset your password, make sure you choose a strong one!',
          pageKeywords: 'password reset, reset, password'
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
          from: 'noreply@dealyourcrypto.com',
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
      return res.redirect('/');
    });
  },
  async getContact(req, res) {
    if (req.user) {
      let premium = await Subscription.findOne({userid: req.user._id}, (err, sub) => {
        if(err) {
          errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Failed to retrieve subscription\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        }
      });
      res.render('index/contact', {
        user: req.user,
        premium,
        errors: false, 
        validationErrors: false,
        pageTitle: 'Contact - Deal Your Crypto',
        pageDescription: 'Contact Deal Your Crypto about anything you need support with! We will respond as soon as possible!',
        pageKeywords: 'contact page, contact, support'
      });
    } else {
      res.render('index/contact', {
        user: false,
        premium: false,
        errors: false, 
        validationErrors: false,
        pageTitle: 'Contact - Deal Your Crypto',
        pageDescription: 'Contact Deal Your Crypto about anything you need support with! We will respond as soon as possible!',
        pageKeywords: 'contact page, contact, support'
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
        pageDescription: 'Contact Deal Your Crypto about anything you need support with! We will respond as soon as possible!',
        pageKeywords: 'contact page, contact, support'
      });
    }
    const secretKey = RECAPTCHA_SECRET;
    const verificationURL = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;
    request(verificationURL, asyncErrorHandler(async (error, response, body) => {
      body = JSON.parse(body);
      if (body.success !== undefined && !body.success) {
        let errors = { msg: String };
        errors.msg = 'Captcha verification failed. Please try again.';
        return res.render('index/contact', {
          errors,
          pageTitle: 'Contact - Deal Your Crypto',
          pageDescription: 'Contact Deal Your Crypto about anything you need support with! We will respond as soon as possible!',
          pageKeywords: 'contact page, contact, support'
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
          pageDescription: 'Contact Deal Your Crypto about anything you need support with! We will respond as soon as possible!',
          pageKeywords: 'contact page, contact, support'
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
            if (req.user) {
              errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
            } else {
              errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
            }
          } else {
          const mailOptions = {
            from: `${req.body.name} <${req.body.email}>`, // sender address
            to: 'support@dealyourcrypto.com', // list of receivers
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
              return res.redirect('back', { error: error.message });
            }
            req.flash('success', 'Message sent successfully! We will get back to you as soon as possible!');
            return res.redirect('/');
          });
        }
       });
      }
    }));
  },
  async postContactUser(req, res) {
    if (req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
      let errors = { msg: String };
      errors.msg = 'Please complete the captcha.';
      return res.render('index/contact', {
        errors, 
        validationErrors: false,
        pageTitle: 'Contact - Deal Your Crypto',
        pageDescription: 'Contact Deal Your Crypto about anything you need support with! We will respond as soon as possible!',
        pageKeywords: 'contact page, contact, support'
      });
    }
    const secretKey = RECAPTCHA_SECRET;
    const verificationURL = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;
    request(verificationURL, asyncErrorHandler(async (error, response, body) => {
      body = JSON.parse(body);
      if (body.success !== undefined && !body.success) {
        let errors = { msg: String };
        errors.msg = 'Captcha verification failed. Please try again.';
        return res.render('index/contact', {
          errors,
          pageTitle: 'Contact - Deal Your Crypto',
          pageDescription: 'Contact Deal Your Crypto about anything you need support with! We will respond as soon as possible!',
          pageKeywords: 'contact page, contact, support'
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
            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Failed to retrieve subscription\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
          }
        });
        res.render('index/contact', {
          user: req.user,
          premium,
          validationErrors,
          errors: false,
          pageTitle: 'Contact - Deal Your Crypto',
          pageDescription: 'Contact Deal Your Crypto about anything you need support with! We will respond as soon as possible!',
          pageKeywords: 'contact page, contact, support'
        });
      } else {
        let premium = await Subscription.findOne({userid: req.user._id}, (err, sub) => {
          if(err) {
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
            } else {
            const mailOptions = {
              from: `${req.body.name} <${req.body.email}>`, // sender address
              to: 'support@dealyourcrypto.com', // list of receivers
              subject: 'Deal Your Crypto - Contact Request', // Subject line
              html: data, // html body
            };
            transporter.sendMail(mailOptions, (error) => {
              if (error) {
                errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                req.flash('error', `${error.message}`);
                return res.redirect('back', { error: error.message });
              }
              req.flash('success', 'Message sent successfully! We will get back to you as soon as possible!');
              return res.redirect('/');
            });
          }
         });
        } else {
          ejs.renderFile(path.join(__dirname, "../views/email_templates/contact.ejs"), {
            name: req.body.name,
            email: req.body.email,
            topic: req.body.topic,
            message: req.body.message,
            subject: 'Deal Your Crypto - ⭐ Priority ⭐ Contact Request',
          }, function (err, data) {
            if (err) {
              errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);              
            } else {
            const mailOptions = {
              from: `${req.body.name} <${req.body.email}>`, // sender address
              to: 'support@dealyourcrypto.com', // list of receivers
              subject: 'Deal Your Crypto - ⭐ Priority ⭐ Contact Request', // Subject line
              html: data, // html body
            };
            transporter.sendMail(mailOptions, (error) => {
              if (error) {
                errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                req.flash('error', `${error.message}`);
                return res.redirect('back', { error: error.message });
              }
              req.flash('success', 'Message sent successfully! We will get back to you as soon as possible!');
              return res.redirect('/');
            });
          }
         });
        }
      }
    }));
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
          from: 'noreply@dealyourcrypto.com',
          subject: 'Deal Your Crypto Change Email Request',
          text: `${'You are receiving this because you (or someone else) have requested to change the email for your account.\n\n'
            + 'Please click on the following link, or paste this into your browser to complete the process:\n\n'
            + 'https://'}${req.headers.host}/resetemail/${token}\n\n`
            + 'If you did not request this, please ignore this email and your email will remain unchanged.\n',
        };
        smtpTransport.sendMail(mailOptions, (err) => {
          req.flash('success', `An email was sent to that address if it is linked with an account.`);
          done(err, 'done');
        });
      },
    ], (err) => {
      if (err) return next(err);
      return res.redirect('back');
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
          pageDescription: 'Change your email on Deal Your Crypto.',
          pageKeywords: 'change email, email'
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
          from: 'noreply@dealyourcrypto.com',
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
      return res.redirect('/');
    });
  },
  getAbout(req, res) {
    res.render('about', {
      pageTitle: 'About - Deal Your Crypto',
      pageDescription: 'We are an online marketplace that connects buyers and sellers of any products, with the primary currency used being Bitcoin. The aim of what we built is to provide the best experience for everyone interested in buying and selling products for Bitcoin.',
      pageKeywords: 'about, about page, bitcoin marketplace, bitcoin'
    });
  },
  getBuyBitcoin(req, res) {
    res.render('buy-bitcoin', {
      pageTitle: 'Buy Bitcoin - Deal Your Crypto',
      pageDescription: 'Check out all websites you can buy bitcoin from! Buying Bitcoin was never so easy!',
      pageKeywords: 'buy bitcoin, bitcoin, bitcoin platform, buy bitcoin credit card'
    });
  },
  getFaq(req, res) {
    res.render('faq', {
      pageTitle: 'Frequently Asked Questions - Deal Your Crypto',
      pageDescription: 'Frequently asked questions about Deal Your Crypto. If you contact us about something, your question might end up here.',
      pageKeywords: 'frequently asked questions, faq, deal your crypto, dealyourcrypto, crypto deal, deal crypto'
    });
  },
  getShipping(req, res) {
    res.render('shipping', {
      pageTitle: 'Shipping & Delivery - Deal Your Crypto',
      pageDescription: 'Shipping and delivery policies for Deal Your Crypto.',
      pageKeywords: 'shipping, delivery, policy, policies, deal your crypto, dealyourcrypto, crypto deal, deal crypto'
    });
  },
  getTos(req, res) {
    res.render('terms-of-service', {
      pageTitle: 'Terms of Service - Deal Your Crypto',
      pageDescription: 'Terms of service for Deal Your Crypto.',
      pageKeywords: 'terms of service, terms, tos, deal your crypto, dealyourcrypto, crypto deal, deal crypto'
    });
  },
  getPrivPol(req, res) {
    res.render('privacy-policy', {
      pageTitle: 'Privacy Policy - Deal Your Crypto',
      pageDescription: 'Privacy policy for Deal Your Crypto.',
      pageKeywords: 'privacy policy, policy, privacy, deal your crypto, dealyourcrypto, crypto deal, deal crypto'
    });
  },
  getSetUsername(req, res) {
    if(req.user) {
      if(req.user.username) {
        req.flash('error', 'You\'ve already set your username.')
        return res.redirect('/dashboard');
      } else {
        res.render('index/set-username', {
          regErrors: false,
          pageTitle: 'Set Username - Deal Your Crypto',
          pageDescription: 'Set your username for Deal Your Crypto.',
          pageKeywords: 'set username, username, new username, deal your crypto, dealyourcrypto, crypto deal, deal crypto'
        });
      }
    } else {
      req.flash('error', 'You must be signed in to do that!')
      return res.redirect('back');
    }
  },
  postSetUsername(req, res) {
    req.check('username', 'The username must contain only alphanumeric characters').matches(/^[a-zA-Z0-9]+$/g).notEmpty();
    req.check('username', 'The username must be between 6 and 32 characters').isLength({ min: 6, max: 32 });
    const regErrors = req.validationErrors();
    if (regErrors) {
      res.render('index/set-username', {
        regErrors,
        pageTitle: 'Set Username - Deal Your Crypto',
        pageDescription: 'Set your username for Deal Your Crypto.',
        pageKeywords: 'set username, username, new username, deal your crypto, dealyourcrypto, crypto deal, deal crypto'
      });
    } else {
      const CurrentUser = req.user._id;
      const NewUsername = req.body.username;
      User.findOne({username: NewUsername}, (err, ExistingUser) => {
        if(err) {
          errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
          return res.redirect('back');
        } else {
          if(ExistingUser) {
            req.flash('error', 'The username is unavailable.');
            return res.redirect('back');
          } else {
            User.findByIdAndUpdate({_id: CurrentUser}, {username: NewUsername}, (err) => {
              if(err) {
                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                return res.redirect('back');
              } else {
                req.flash('success', `Successfully set your username! Welcome ${NewUsername}!`);
                return res.redirect('/dashboard');
              }
            });
          }
        }
      });
    }
  },
};
