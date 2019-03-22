/* eslint-disable no-param-reassign */
const passport = require('passport');
const nodemailer = require('nodemailer');
const async = require('async');
const crypto = require('crypto');
const User = require('../models/user');
const Product = require('../models/product');
const searchTerm = require('../models/searchTerm');
const Nexmo = require('nexmo');
const request = require("request");
const { Categories, secCategories } = require('../dist/js/categories');
const jwt = require('jsonwebtoken');

const nexmo = new Nexmo({
  apiKey: process.env.NEXMO_API_KEY,
  apiSecret: process.env.NEXMO_API_SECRET
});
const EMAIL_USER = process.env.EMAIL_USER || 'k4nsyiavbcbmtcxx@ethereal.email';
const EMAIL_API_KEY = process.env.EMAIL_API_KEY || 'Mx2qnJcNKM5mp4nrG3';
const EMAIL_PORT = process.env.EMAIL_PORT || '587';
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.ethereal.email';
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET;
const EMAIL_SECRET = 'monkaS';
const SECRET = 'monkaMega';
const SECRET2 = 'monkaGiga';

function sendConfirmationEmail(userid, useremail) {
  const token = jwt.sign({
    user: userid
  }, 
  SECRET, 
  { expiresIn: '10m' }
  );
  const output = `
  <h1>Please confirm your email</h1>
  <p>An account was created using this email address. Click <a href="localhost:8080/confirmation/${token}">here</a> in order to confirm it.</p>
  <p>Ignore this message if you did not request the account creation.</p>
  `;
  nodemailer.createTestAccount(() => {
    const transporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: EMAIL_PORT,
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_API_KEY,
        },
    });
    const mailOptions = {
        from: `Deal Your Crypto <noreply@dyc.com>`,
        to: `${useremail}`,
        subject: 'Email Confirmation Required',
        html: output,
    };
    transporter.sendMail(mailOptions, (error) => {
        if (error) {
          console.log(error);
        }
    });
  });
};

module.exports = {
  getRegister(req, res) {
    res.render('index/register', {errors: false, regErrors: false});
  },
  // POST /register
  async postRegister(req, res) {
    if (req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
      let errors = { msg: String };
      errors.msg = 'Please complete the captcha.';
      return res.render('index/register', {errors} );
    }
    const secretKey = RECAPTCHA_SECRET;
    const verificationURL = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;
    request(verificationURL, async (error, response, body) => {
      body = JSON.parse(body);
      if (body.success !== undefined && !body.success) {
        let errors = { msg: String };
        errors.msg = 'Captcha verification failed. Please try again.';
        return res.render('index/register', {errors});
      }
      req.check('email', 'The email address is invalid').isEmail().notEmpty();
      req.check('username', 'The username must contain only alphanumeric characters').matches(/^[a-zA-Z0-9]+$/g).notEmpty();
      req.check('username', 'The username must be between 6 and 32 characters').isLength({ min: 6, max: 32 });
      req.check('password', 'The password must be between 8 and 64 characters').isLength({ min: 8, max: 64});
      req.check('password', 'The password must contain at least one uppercase character').matches(/[A-Z]/g);
      req.check('password', 'The password must contain at least one number').matches(/[0-9]/g);
      const regErrors = req.validationErrors();
      if (regErrors) {
        res.render('index/register', {errors: false, regErrors});
      } else {
        const newUser = new User({ email: req.body.email, username: req.body.username });
        try {
          await User.register(newUser, req.body.password);
          sendConfirmationEmail(newUser._id, newUser.email, SECRET);
        } catch (error) {
          req.flash('error', error.message);
          return res.redirect('back');
        }
        passport.authenticate('local', { session: false })(req, res, () => {
          req.flash('success', `Successfully signed up! Please confirm your email address.`);
          res.render('index/confirmEmail', {user: newUser});
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
          res.render('/login');
        }
        if (err.message.match(/Expired/i)) {
          req.flash('error', 'The link has expired. You should receive another email shortly.');
          const id = jwt.decode(req.params.token);
          uuser = await User.findById(id.user);
          sendConfirmationEmail(uuser._id, uuser.email, SECRET);
          res.redirect('/login');
        }
      } else {
        const user = jwt.decode(req.params.token);
        uuser = await User.findByIdAndUpdate(user.user, { confirmed: true }, async (err) => {
          if (err) {
            console.log(err);
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
    let phoneNumber = req.body.number;
   
    nexmo.verify.check({request_id: requestId, code: pin}, (err, result) => {
      if(err) {
        req.flash('error', err.message);
        return res.redirect('back');
      } else {
        if(result && result.status == '0') { // Success!
          User.findByIdAndUpdate(req.user._id, { number: phoneNumber, twofactor: true }, (err) => {
            if (err) {
              req.flash('error', err.message);
              res.redirect('back');
            }
          });
          req.flash('success', 'Account 2-Factor enabled successfully! 🎉');
          res.redirect('/dashboard')
        } else {
          req.flash('error', 'Wrong PIN code, please try again.');
          return res.redirect('back');
        }
      }
    });
  },
  get2factor(req, res) {
    res.render('index/2factor')
  },
  async post2factor(req, res) {
    let phoneNumber = req.body.number;
    const user = await User.findOne({number: phoneNumber});
    if (user) {
      req.flash('error', 'Phone number already used. Please try again using another number.');
      res.redirect('/2factor');
    } else {
      nexmo.verify.request({number: phoneNumber, brand: 'Deal Your Crypto'}, (err, result) => {
        if(err) {
          req.flash('error', err.message);
          res.redirect('back');
        } else {
          let requestId = result.request_id;
          if(result.status == '0') {
            res.render('index/verify', { number: phoneNumber, requestId: requestId }); // Success! Now, have your user enter the PIN
          } else {
            req.flash('error', 'Something went wrong, please try again.');
            res.redirect('back');
          }
        }
      });
    }
  },
  postdisable2factor(req, res) {
    User.findByIdAndUpdate(req.user._id, { number: undefined, twofactor: false }, (err) => { // Change number: null to delete number completely
      if (err) {
        req.flash('error', err.message);
        res.redirect('back');
      } else {
        req.flash('success', 'Successfully disabled 2-Factor authentication.');
        res.redirect('back');
      }
    });
  },
  getLogin(req, res) {
    if ( req.user ) {
      res.render('index/login', { user: req.user, errors: false });
    } else {
      res.render('index/login', { errors: false });
    }
  },
  // POST /login
  postLogin(req, res, next) {
    // Captcha only shows if the user had an invalid login request 
    if (req.query.errors === 1) {
      if (req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
        let errors = { msg: String };
        errors.msg = 'Please complete the captcha.';
        return res.render('index/login', {errors} );
      }
      const secretKey = "6LdvYJcUAAAAABRACFNVD7CyVxgDa3M04i1_aGs5";
      const verificationURL = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;
      request(verificationURL, (error, response, body) => {
        body = JSON.parse(body);
        if (body.success !== undefined && !body.success) {
          let errors = { msg: String };
          errors.msg = 'Captcha verification failed. Please try again.';
          return res.render('index/login', {errors});
        } 
      });
    }
    if (req.body.remember) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // Cookie expires after 30 days
    } else {
      req.session.cookie.expires = false; // Cookie expires at end of session
    }
    User.findOne({ username: req.body.username }, (err, user) => {
      if(err) {
        let errors = { msg: String };
        errors.msg = err.message;
        return res.render('index/login', {errors});
      }
      if(!user) {
        let errors = { msg: String };
        errors.msg = 'Invalid user/password combination or the user does not exist.';
        return res.render('index/login', {errors});
      }
      if ((!user.confirmed) && (!user.googleId) && (!user.facebookId)){
        res.render('index/confirmEmail', {user});
      } else {
        if (user.twofactor === true) {
          nexmo.verify.request({number: user.number, brand: 'Deal Your Crypto'}, (err, result) => {
            if(err) {
              let errors = { msg: String };
              errors.msg = err.message;
              return res.render('index/login', {errors});
            } else {
              let requestId = result.request_id;
              if(result.status == '0') {
                res.render('index/verifylogin', { username: req.body.username, password: req.body.password, requestId: requestId }); // Success! Now, have your user enter the PIN
              } else {
                let errors = { msg: String };
                errors.msg = 'Something went wrong. Please try again.';
                return res.render('index/login', {errors});
              }
            }
          });
        } else {
          passport.authenticate('local',
          {
            successFlash: 'Welcome to Deal Your Crypto!',
            successRedirect: '/',
            failureRedirect: '/login',
            failureFlash: true,
          })(req, res, next);
        }
      }
    });
  },
  async resendEmail(req, res) {
    const user = await User.findById(req.params.id);
    sendConfirmationEmail(user._id, user.email);
    req.flash('success', 'Confirmation email resent. Please check your inbox.');
    res.redirect('/login');
  },
  postVerifyLogin(req, res, next) {
    let pin = req.body.pin;
    let requestId = req.body.requestId;
    nexmo.verify.check({request_id: requestId, code: pin}, (err, result) => {
      if(err) {
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
    const products = await Product.paginate({ "feat_2.status": true, available: "True" }, {
      page: req.query.page || 1,
      limit: 20,
    });
    products.page = Number(products.page);
    res.render('index', { currentUser: req.user, products, errors: false });
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
    async firstCategSearch(req, res) {
      let tags = [];
      let currency = [];
      let secCat = [];
      let from = 0;
      req.check('searchName', 'Error: The query contains illegal characters.').matches(/^$|[a-zA-Z0-9 ]+$/g);
      req.check('category', 'Error: The category contains illegal characters.').matches(/^[a-zA-Z0-9 ]+$/g).notEmpty();
      if (req.body.from) {
        req.check('from', 'Error: Page does not match. Please contact us regarding this issue.').isNumeric().notEmpty();
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
        tags.push(currency[0]);
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
          products
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
        if (tags.length > 0) {
          await Product.search(
            {
              "bool": { 
                "must": [
                  { "wildcard": { "name": `*${req.body.searchName}*` }},
                  { "match": { "category": `${req.body.category}`}},
                  { "wildcard": { "author.continent": `*${continent}*`}},
                  { "wildcard": {"condition": `*${condition}*`}}
                ],
                "filter": [
                  { "terms": { "tags": tags }}
                ]
              }
            }, 
            { from: from, size: 10, sort: [`${currency[0]}Price:${currency[1]}`, `avgRating:${avgRating}`, "feat_1.status:desc", "createdAt:desc"] },
            (err, products) => {
              if (err) {
                console.log(err);
              } else {
                Categories.forEach((item) => {
                  if (req.body.category == item.name) {
                    secCat = item.opt;
                  }
                });
                res.render('index/searchFirstCateg', { products: products.hits.hits, total: products.hits.total, from, searchName: req.body.searchName, searchCateg: req.body.category, secCat, currency: req.body.currency, continent, avgRating, condition });
              }
            }
          );
        } else {
          await Product.search(
            { 
              "bool": { 
                "must": [
                  { "wildcard": { "name": `*${req.body.searchName}*` }},
                  { "match": { "category": `${req.body.category}` }},
                  { "wildcard": { "author.continent": `*${continent}*`}},
                  { "wildcard": {"condition": `*${condition}*`}}
                ],
              }
            }, 
            { from: from, size: 10, sort: [`avgRating:${avgRating}`, "feat_1.status:desc", "createdAt:desc"] },
            (err, products) => {
              if (err) {
                console.log(err);
              } else {
                Categories.forEach((item) => {
                  if (req.body.category == item.name) {
                    secCat = item.opt;
                  }
                });
                res.render('index/searchFirstCateg', { products: products.hits.hits, total: products.hits.total, from, searchName: req.body.searchName, searchCateg: req.body.category, secCat, currency: req.body.currency, continent, avgRating, condition });
              }
            }
          );
        }
      }
    },
    async secondCategSearch(req, res) {
      let tags = [];
      let currency = [];
      let thiCat = [];
      let from = 0;
      req.check('searchName', 'Error: The query contains illegal characters.').matches(/^$|[a-zA-Z0-9 ]+$/g);
      req.check('category', 'Error: The category contains illegal characters.').matches(/^[a-zA-Z0-9 ]+$/g).notEmpty();
      req.check('searchCateg', 'Error: The category contains illegal characters.').matches(/^[a-zA-Z0-9 ]+$/g).notEmpty();
      if (req.body.from) {
        req.check('from', 'Error: Page does not match. Please contact us regarding this issue.').isNumeric().notEmpty();
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
        tags.push(currency[0]);
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
          products
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
        if (tags.length > 0) {
          await Product.search(
            {
              "bool": { 
                "must": [
                  { "wildcard": { "name": `*${req.body.searchName}*` }},
                  { "match": { "category": `${req.body.searchCateg}`}},
                  { "match": { "category": `${req.body.category}`}},
                  { "wildcard": { "author.continent": `*${continent}*`}},
                  { "wildcard": {"condition": `*${condition}*`}}
                ],
                "filter": [
                  { "terms": { "tags": tags }}
                ]
              }
            }, 
            { from: from, size: 10, sort: [`${currency[0]}Price:${currency[1]}`, `avgRating:${avgRating}`, "feat_1.status:desc", "createdAt:desc"] },
            (err, products) => {
              if (err) {
                console.log(err);
              } else {
                secCategories.forEach((item) => {
                  if (req.body.category == item.name) {
                    thiCat = item.opt;
                  }
                });
                res.render('index/searchSecondCateg', { products: products.hits.hits, searchName: req.body.searchName, total: products.hits.total, from, searchCateg: req.body.searchCateg, secondSearchCateg: req.body.category, thiCat, currency: req.body.currency, continent, avgRating, condition });
              }
            }
          );
        } else {
          await Product.search(
            { 
              "bool": { 
                "must": [
                  { "wildcard": { "name": `*${req.body.searchName}*` }},
                  { "match": { "category": `${req.body.searchCateg}`}},
                  { "match": { "category": `${req.body.category}`}},
                  { "wildcard": { "author.continent": `*${continent}*`}},
                  { "wildcard": {"condition": `*${condition}*`}}
                ],
              }
            }, 
            { from: from, size: 10, sort: [`avgRating:${avgRating}`, "feat_1.status:desc", "createdAt:desc"] },
            (err, products) => {
              if (err) {
                console.log(err);
              } else {
                secCategories.forEach((item) => {
                  if (req.body.category == item.name) {
                    thiCat = item.opt;
                  }
                });
                res.render('index/searchSecondCateg', { products: products.hits.hits, searchName: req.body.searchName, total: products.hits.total, from, searchCateg: req.body.searchCateg, secondSearchCateg: req.body.category, thiCat, currency: req.body.currency, continent, avgRating, condition });
              }
            }
          );
        }
      }
    },
    async thirdCategSearch(req, res){
      let tags = [];
      let currency = [];
      let from = 0;
      req.check('searchName', 'Error: The query contains illegal characters.').matches(/^$|[a-zA-Z0-9 ]+$/g);
      req.check('category', 'Error: The category contains illegal characters.').matches(/^[a-zA-Z0-9 ]+$/g).notEmpty();
      req.check('searchCateg', 'Error: The category contains illegal characters.').matches(/^[a-zA-Z0-9 ]+$/g).notEmpty();
      req.check('secondSearchCateg', 'Error: The category contains illegal characters.').matches(/^[a-zA-Z0-9 ]+$/g).notEmpty();
      if (req.body.from) {
        req.check('from', 'Error: Page does not match. Please contact us regarding this issue.').isNumeric().notEmpty();
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
        tags.push(currency[0]);
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
          products
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
        if (tags.length > 0) {
          await Product.search(
            {
              "bool": { 
                "must": [
                  { "wildcard": { "name": `*${req.body.searchName}*` }},
                  { "match": { "category": `${req.body.searchCateg}`}},
                  { "match": { "category": `${req.body.secondSearchCateg}`}},
                  { "match": { "category": `${req.body.category}`}},
                  { "wildcard": { "author.continent": `*${continent}*`}},
                  { "wildcard": {"condition": `*${condition}*`}}
                ],
                "filter": [
                  { "terms": { "tags": tags }}
                ]
              }
            }, 
            { from: from, size: 10, sort: [`${currency[0]}Price:${currency[1]}`, `avgRating:${avgRating}`, "feat_1.status:desc", "createdAt:desc"] },
            (err, products) => {
              if (err) {
                console.log(err);
              } else {
                res.render('index/searchThirdCateg', { products: products.hits.hits, searchName: req.body.searchName, total: products.hits.total, from, searchCateg: req.body.searchCateg, secondSearchCateg: req.body.secondSearchCateg, thirdSearchCateg: req.body.category, currency: req.body.currency, continent, avgRating, condition });
              }
            }
          );
        } else {
          await Product.search(
            { 
              "bool": { 
                "must": [
                  { "wildcard": { "name": `*${req.body.searchName}*` }},
                  { "match": { "category": `${req.body.searchCateg}`}},
                  { "match": { "category": `${req.body.secondSearchCateg}`}},
                  { "match": { "category": `${req.body.category}`}},
                  { "wildcard": { "author.continent": `*${continent}*`}},
                  { "wildcard": {"condition": `*${condition}*`}}
                ],
              }
            }, 
            { from: from, size: 10, sort: [`avgRating:${avgRating}`, "feat_1.status:desc", "createdAt:desc"] },
            (err, products) => {
              if (err) {
                console.log(err);
              } else {
                res.render('index/searchThirdCateg', { products: products.hits.hits, searchName: req.body.searchName, total: products.hits.total, from, searchCateg: req.body.searchCateg, secondSearchCateg: req.body.secondSearchCateg, thirdSearchCateg: req.body.category, currency: req.body.currency, continent, avgRating, condition });
              }
            }
          );
        }
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
    res.render('index/contact', {errors: false, validationErrors: false});
  },
  postContact(req, res) {
    if (req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
      let errors = { msg: String };
      errors.msg = 'Please complete the captcha.';
      return res.render('index/contact', {errors, validationErrors: false} );
    }
    const secretKey = RECAPTCHA_SECRET;
    const verificationURL = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;
    request(verificationURL, async (error, response, body) => {
      body = JSON.parse(body);
      if (body.success !== undefined && !body.success) {
        let errors = { msg: String };
        errors.msg = 'Captcha verification failed. Please try again.';
        return res.render('index/contact', {errors});
      }
      req.check('name', 'The name contains illegal characters.').matches(/^[a-zA-Z ]$/g).trim().notEmpty();
      req.check('email', 'The email address is invalid.').isEmail().normalizeEmail().notEmpty().trim();
      req.check('topic', 'Something went wrong. Please try again.').matches(/^(General|Payments|Delivery|Bugs|Suggestion)$/g).notEmpty();
      req.check('message', 'The message contains illegal characters.').matches(/^[a-zA-Z0-9.!? ]$/).trim().notEmpty();
      const validationErrors = req.validationErrors();
      if (validationErrors) {
        res.render('index/contact', {
          user: req.user,
          validationErrors,
          errors: false
        });
      } else {
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
            req.flash('success', 'Message sent successfully! We will get back to you as soon as possible!');
            res.redirect('/contact');
          });
        });
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
