/* eslint-disable no-param-reassign */
const passport = require('passport');
const nodemailer = require('nodemailer');
const async = require('async');
const crypto = require('crypto');
const User = require('../models/user');
const Product = require('../models/product');
const Nexmo = require('nexmo');
const { Categories, secCategories } = require('../dist/js/categories');

const nexmo = new Nexmo({
  apiKey: process.env.NEXMO_API_KEY,
  apiSecret: process.env.NEXMO_API_SECRET
});
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
      res.render('index/login', { user: req.user });
    } else {
      res.render('index/login');
    }
  },
  // POST /login
  postLogin(req, res, next) {
    if (req.body.remember) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // Cookie expires after 30 days
    } else {
      req.session.cookie.expires = false; // Cookie expires at end of session
    }
    User.findOne({ username: req.body.username }, (err, user) => {
      if(err) {
        req.flash('error', err.message);
        return res.redirect('back');
      }
      if(!user) {
        req.flash('error', 'Invalid user/password combination or the user does not exist.')
        return res.redirect('back');
      }
        if (user.twofactor === true) {
          nexmo.verify.request({number: user.number, brand: 'Deal Your Crypto'}, (err, result) => {
            if(err) {
              req.flash('error', err.message);
              return res.redirect('back');
            } else {
              let requestId = result.request_id;
              if(result.status == '0') {
                res.render('index/verifylogin', { username: req.body.username, password: req.body.password, requestId: requestId }); // Success! Now, have your user enter the PIN
              } else {
                req.flash('error', 'Something went wrong, please try again.');
                return res.redirect('back');
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
      });
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
  //TODO: change size on production - also modify pagination partials
  async firstCategSearch(req, res) {
    //TODO: validation
    let tags = [];
    let currency = [];
    let secCat = [];
    let from = 0;
    if (req.body.from) {
      from = req.body.from;
    }
    let continent = '';
    if (req.body.continent) {
      continent = req.body.continent;
    }
    if (req.body.currency) {
      // The currency is given is this format -> currency-asc/desc
      currency = req.body.currency.split('-');
      tags.push(currency[0]);
    }
    let condition = '';
    if (req.body.condition) {
      condition = req.body.condition;
    }
    let avgRating = req.body.avgRating;
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
        { from: from, size: 2, sort: [`${currency[0]}Price:${currency[1]}`, `avgRating:${avgRating}`, "feat_1.status:desc", "createdAt:desc"] },
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
        { from: from, size: 2, sort: [`avgRating:${avgRating}`, "feat_1.status:desc", "createdAt:desc"] },
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
  },
  async secondCategSearch(req, res) {
    //TODO: validation
    let tags = [];
    let currency = [];
    let thiCat = [];
    let from = 0;
    if (req.body.from) {
      from = req.body.from;
    }
    let continent = '';
    if (req.body.continent) {
      continent = req.body.continent;
    }
    if (req.body.currency) {
      // The currency is given is this format -> currency-asc/desc
      currency = req.body.currency.split('-');
      tags.push(currency[0]);
    }
    let condition = '';
    if (req.body.condition) {
      condition = req.body.condition;
    }
    let avgRating = req.body.avgRating;
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
        { from: from, size: 2, sort: [`${currency[0]}Price:${currency[1]}`, `avgRating:${avgRating}`, "feat_1.status:desc", "createdAt:desc"] },
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
        { from: from, size: 2, sort: [`avgRating:${avgRating}`, "feat_1.status:desc", "createdAt:desc"] },
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
  },
  async thirdCategSearch(req, res){
    //TODO: validation
    let tags = [];
    let currency = [];
    let from = 0;
    if (req.body.from) {
      from = req.body.from;
    }
    let continent = '';
    if (req.body.continent) {
      continent = req.body.continent;
    }
    if (req.body.currency) {
      // The currency is given is this format -> currency-asc/desc
      currency = req.body.currency.split('-');
      tags.push(currency[0]);
    }
    let condition = '';
    if (req.body.condition) {
      condition = req.body.condition;
    }
    let avgRating = req.body.avgRating;
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
        { from: from, size: 2, sort: [`${currency[0]}Price:${currency[1]}`, `avgRating:${avgRating}`, "feat_1.status:desc", "createdAt:desc"] },
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
        { from: from, size: 2, sort: [`avgRating:${avgRating}`, "feat_1.status:desc", "createdAt:desc"] },
        (err, products) => {
          if (err) {
            console.log(err);
          } else {
            res.render('index/searchThirdCateg', { products: products.hits.hits, searchName: req.body.searchName, total: products.hits.total, from, searchCateg: req.body.searchCateg, secondSearchCateg: req.body.secondSearchCateg, thirdSearchCateg: req.body.category, currency: req.body.currency, continent, avgRating, condition });
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
