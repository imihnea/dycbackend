const express = require('express');

const path = require('path');

const compression = require('compression');

const app = express();

const bodyParser = require('body-parser');

const expressValidator = require('express-validator');

app.use(expressValidator());

const mongoose = require('mongoose');

const passport = require('passport');

const flash = require('connect-flash');

const helmet = require('helmet');

app.use(helmet());

const LocalStrategy = require('passport-local');

const FacebookStrategy = require('passport-facebook').Strategy;

const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

const methodOverride = require('method-override');
// configure dotenv

require('dotenv').config();

const User = require('./models/user');

const Product = require('./models/product');

// requiring routes

const categoryRoutes = require('./routes/categories');

const indexRoutes = require('./routes/index');

const dashboardRoutes = require('./routes/dashboard');

const productRoutes = require('./routes/products');

const profileRoutes = require('./routes/profile');

const reviewsRoutes = require('./routes/reviews');

const reviewsRoutesUser = require('./routes/reviewsusers');

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

// refactored routes
app.use('/', indexRoutes);
app.use('/categories', categoryRoutes); // by saying this we write shorter code in routes
app.use('/dashboard', dashboardRoutes);
app.use('/products', productRoutes);
app.use('/profile', profileRoutes);
app.use('/products/:id/reviews', reviewsRoutes);
app.use('/profile/:id/reviews', reviewsRoutesUser);

// error 404 page
app.get('*', (req, res) => {
  res.send('Error 404');
});

// Remove expired feature fields

setInterval(() => {
  Product.updateMany({"feat_1.status": true, "feat_1.expiry_date": { $lt: Date.now() } }, { $set: { "feat_1.status": false }}, {multi: true}, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      // console.log(result);
    }
  });
}, 300000);

app.listen(process.env.PORT || 8080, process.env.IP, () => {
  console.log('Server started');
});
