const express = require('express');

const path = require('path');

const compression = require('compression');

const app = express();

const bodyParser = require('body-parser');

const expressValidator = require('express-validator');

app.use(expressValidator());

const rateLimit = require("express-rate-limit");
 
// app.enable("trust proxy"); // only if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: "Too many attempts to register from this IP, please try again in an hour."
});
// only apply to register requests
app.use("/register", registerLimiter);

const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 500,
  message: "Too many login attempts from this IP, please try again in an hour."
});
// only apply to login requests
app.use("/login", loginLimiter);

const mongoose = require('mongoose');

const passport = require('passport');

const flash = require('connect-flash');

const helmet = require('helmet');

app.use(helmet());

app.use(helmet.hidePoweredBy({ setTo: 'PHP 7.3.3'}));

app.use(helmet.ieNoOpen());

app.use(helmet.contentSecurityPolicy({
  directives: {
    // defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com', 'use.fontawesome.com', 'res.cloudinary.com'],
    scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.polyfill.io', 'ajax.googleapis.com', 'geodata.solutions']
  }
}));

app.use(helmet.noSniff());

app.use(helmet.frameguard({ action: 'sameorigin' }));

app.use(helmet.xssFilter());

// Need SSL set up for these

// app.use(helmet.hsts({
//   maxAge: 31536000,
//   includeSubDomains: true,
//   preload: true
// }));

// const hpkp = require('hpkp');

// const ninetyDaysInSeconds = 7776000
// app.use(hpkp({
//   maxAge: ninetyDaysInSeconds,
//   sha256s: ['AbCdEf123=', 'ZyXwVu456='],
//   includeSubDomains: true,         // optional
//   reportUri: 'http://example.com', // optional
//   reportOnly: false,               // optional
 
//   // Set the header based on a condition.
//   // This is optional.
//   setIf: function (req, res) {
//     return req.secure
//   }
// }));

const LocalStrategy = require('passport-local');

const FacebookStrategy = require('passport-facebook').Strategy;

const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

const methodOverride = require('method-override');
// configure dotenv

require('dotenv').config();

const User = require('./models/user');

// requiring routes

const indexRoutes = require('./routes/index');

const dashboardRoutes = require('./routes/dashboard');

const productRoutes = require('./routes/products');

const profileRoutes = require('./routes/profile');

const messagesRoutes = require('./routes/messages');

const reviewsRoutes = require('./routes/reviews');

const dealsRoutes = require('./routes/deals');

const savvycallbackRoutes = require('./routes/savvy/callback');

const savvycurrenciesRoutes = require('./routes/savvy/currencies');

const savvystatusRoutes = require('./routes/savvy/status');

// Gzip compression

app.use(compression());

// assign mongoose promise library and connect to database
mongoose.Promise = global.Promise;

const DATABASEURL = process.env.DATABASEURL || 'mongodb://localhost/DYC';

// Database

mongoose.set('useFindAndModify', false); // disables warnings
mongoose.set('useCreateIndex', true); // disables warnings
mongoose.connect(DATABASEURL, { useNewUrlParser: true });

const SECRET = process.env.SECRET || 'monkaomega';

app.use(require('express-session')({
  secret: SECRET,
  resave: true,
  saveUninitialized: true,
}));

app.use('/dist', express.static(path.join(__dirname, '/dist')));
app.use(methodOverride('_method'));

app.locals.moment = require('moment');

app.use(flash());
app.use(bodyParser.json()); // for parsing POST req
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
/* eslint-disable */
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: 'http://localhost:8080/auth/facebook/callback',
  profileFields: ['id', 'displayName', 'email']
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate(
    { 
      name: profile.displayName,
      username: profile.displayName,
      email: profile.emails[0].value,
      facebookId: profile.id 
    }, 
    (err, User) => {
    return cb(err, User);
  });
}
));
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:8080/auth/google/callback',
},
function(accessToken, refreshToken, profile, done) {
  User.findOrCreate(
    { 
      name: profile.name.familyName + ' ' + profile.name.givenName,
      username: profile.name.familyName + ' ' + profile.name.givenName,
      email: profile.emails[0].value,
      googleId: profile.id 
    },
    (err, user) => {
    return done(err, user);
  });
}
));
/* eslint-enable */
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');
  next();
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  handler: (req, res) => {
    req.flash('error', 'Too many register attempts from this IP, please try again in an hour.');
    res.redirect('/');
  },
});
// only apply to register requests
app.use("/register", registerLimiter);

const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  handler: (req, res) => {
    req.flash('error', 'Too many login attempts from this IP, please try again in an hour.');
    res.redirect('/');
  },
});
// only apply to login requests
app.use("/login", loginLimiter);

// refactored routes
app.use('/', indexRoutes);
app.use('/', savvycallbackRoutes);
app.use('/', savvycurrenciesRoutes);
app.use('/', savvystatusRoutes);
app.use('/dashboard', dashboardRoutes); // by saying this we write shorter code in routes
app.use('/products', productRoutes);
app.use('/profile', profileRoutes);
app.use('/messages', messagesRoutes);
app.use('/reviews', reviewsRoutes);
app.use('/deals', dealsRoutes);

// error 404 page
app.get('*', (req, res) => {
  res.send('Your friendly 404.');
});

// error handler
app.use(function(err, req, res, next) {
  // // set locals, only providing error in development
  // res.locals.message = err.message;
  // res.locals.error = req.app.get('env') === 'development' ? err : {};

  // // render the error page
  // res.status(err.status || 500);
  // res.render('error');
  req.session.error = req.flash('error', err.message);
  res.redirect('back');
});

app.listen(process.env.PORT || 8080, process.env.IP, () => {
  console.log('Server started');
});
