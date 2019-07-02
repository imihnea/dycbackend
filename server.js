const express = require('express');

const ejs = require('ejs');

const path = require('path');

const compression = require('compression');

const app = express();

const bodyParser = require('body-parser');

const cookieParser = require('cookie-parser');

app.use(cookieParser());

const expressValidator = require('express-validator');

app.use(expressValidator());

const rateLimit = require("express-rate-limit");

const mongoose = require('mongoose');

const passport = require('passport');

const flash = require('connect-flash');

const {errorLogger, logger, warnLogger} = require('./config/winston');

const {startElastic} = require('./config/elasticsearch');

startElastic();

const helmet = require('helmet');

app.use(helmet());

app.use(helmet.hidePoweredBy({ setTo: 'PHP 7.3.3' }));

app.use(helmet.ieNoOpen());

app.use(helmet.contentSecurityPolicy({
  directives: {
    // defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com', 'use.fontawesome.com', 'res.cloudinary.com'],
    scriptSrc: ["'self'", "'unsafe-inline'",  'cdn.polyfill.io', 'ajax.googleapis.com', 'geodata.solutions', 'https://www.gstatic.com', 'https://www.google.com', 'https://www.googletagmanager.com', 'https://www.google-analytics.com']
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

const adminRoutes = require('./routes/admin');

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
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

app.use(session({
  secret: SECRET,
  store: new MongoStore({
    mongooseConnection: mongoose.connection,
    ttl: 2 * 60 * 60
  }),
  resave: true,
  saveUninitialized: true,
  // these need SSL
  // secure: true,
  // httpOnly: true,
  maxAge: 2 * 60 * 60 * 1000,
}));

app.use('/dist', express.static(path.join(__dirname, '/dist'), {
  setHeaders: function (res, path, stat) {
      res.set('Service-Worker-Allowed', '/');
  },
}));
app.use(methodOverride('_method'));

app.locals.moment = require('moment');

app.use(flash());
app.use(bodyParser.json()); // for parsing POST req
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.engine('html', ejs.__express);
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
/* eslint-disable */
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: 'https://www.dealyourcrypto.com/auth/facebook/callback',
  profileFields: ['id', 'displayName', 'email'],
  passReqToCallback: true
},
function(req, accessToken, refreshToken, profile, cb) {
  if (req.user) {
    let user = req.user;
    if ((user.googleId && user.facebookId) || (user.facebookId && user.salt && user.hash)) {
      user.facebookId = '';
    } else {
      user.facebookId = profile.id;
    }
    user.save((err, user) => {return cb(err, user)});
  } else {
    User.findOne({facebookId: profile.id}, (err, res) => {
      if (res !== null) {
        return cb(err, res);
      } else {
        User.create(
          { 
            full_name: profile.displayName,
            email: profile.emails[0].value,
            facebookId: profile.id 
          }, 
          (err, User) => {
          return cb(err, User);
        });
      }
    });
  }
}
));
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'https://www.dealyourcrypto.com/auth/google/callback',
  passReqToCallback: true
},
function(req, accessToken, refreshToken, profile, done) {
  if (req.user) {
    let user = req.user;
    if ((user.googleId && user.facebookId) || (user.googleId && user.salt && user.hash)) {
      user.googleId = '';
    } else {
      user.googleId = profile.id;
    }
    user.save((err, user) => {return done(err, user)});
  } else {
    User.findOne({googleId: profile.id}, (err, res) => {
      if (res !== null) {
        return done(err, res);
      } else {
        User.create(
          { 
            full_name: profile.name.familyName + ' ' + profile.name.givenName,
            email: profile.emails[0].value,
            googleId: profile.id 
          },
          (err, user) => {
          return done(err, user);
        });
      }
    });
  }
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
  res.locals.user = req.user;
  // if (req.cookies._csrf){
  //   res.locals.csrfToken = req.cookies._csrf;
  // }
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');
  next();
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  handler: (req, res) => {
    warnLogger.warn(`Message: Too many register requests\r\nIP:${req.ip}\r\nTime: ${app.locals.moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`)
    req.flash('error', 'Too many register attempts from this IP, please try again in an hour.');
    return res.redirect('/');
  },
});
// only apply to register requests
app.use("/register", registerLimiter);

const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 500,
  handler: (req, res) => {
    warnLogger.warn(`Message: Too many login requests\r\nIP:${req.ip}\r\nTime: ${app.locals.moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`)
    req.flash('error', 'Too many login attempts from this IP, please try again in an hour.');
    return res.redirect('/');
  },
});
// only apply to login requests
app.use("/login", loginLimiter);

const forgotEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  handler: (req, res) => {
    warnLogger.warn(`Message: Too many email reset requests\r\nIP:${req.ip}\r\nTime: ${app.locals.moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`)
    req.flash('error', 'Too many email reset attempts from ths IP, please try again in an hour.');
    return res.redirect('/');
  }
});
app.use("/forgotemail", forgotEmailLimiter);

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  handler: (req, res) => {
    warnLogger.warn(`Message: Too many password reset requests\r\nIP:${req.ip}\r\nTime: ${app.locals.moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`)
    req.flash('error', 'Too many password reset attempts from this IP, please try again in an hour.');
    return res.redirect('/');
  }
});
app.use("/forgot", forgotPasswordLimiter);

// refactored routes
app.use('/', indexRoutes);
app.use('/dashboard', dashboardRoutes); // by saying this we write shorter code in routes
app.use('/products', productRoutes);
app.use('/profile', profileRoutes);
app.use('/messages', messagesRoutes);
app.use('/reviews', reviewsRoutes);
app.use('/deals', dealsRoutes);
app.use('/admin', adminRoutes);

// error 404 page
app.get('*', (req, res) => {
  return res.status(404).redirect('/error');
});

// const middleware = require('./middleware/index');

// const { checkUrl } = middleware;

// app.all('*', checkUrl);

// error handler
app.use((err, req, res, next) => {
  // // set locals, only providing error in development
  // res.locals.message = err.message;
  // res.locals.error = req.app.get('env') === 'development' ? err : {};

  // // render the error page
  // res.status(err.status || 500);
  // res.render('error');
  req.session.error = req.flash('error', err.message);
  if (req.user) {
    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${app.locals.moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
  } else {
    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nTime: ${app.locals.moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
  }
  return res.redirect('back');
});

const { fork } = require("child_process");
fork('./config/recurringTasks.js');
fork('./config/deleteWithdraws.js');

app.listen(process.env.PORT || 8080, process.env.IP, () => {
  if (process.env.NODE_ENV === 'production') {
    logger.info(`Server started on ${app.locals.moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
  }
});
