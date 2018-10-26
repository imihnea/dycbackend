const express = require('express');

const compression = require('compression');

const app = express();

const bodyParser = require('body-parser');

const mongoose = require('mongoose');

const passport = require('passport');

const flash = require('connect-flash');

const helmet = require('helmet');

app.use(helmet());

const LocalStrategy = require('passport-local');

const methodOverride = require('method-override');

const User = require('./models/user');

// requiring routes

const categoryRoutes = require('./routes/categories');

const indexRoutes = require('./routes/index');

const dashboardRoutes = require('./routes/dashboard');

// Gzip compression

app.use(compression());

// assign mongoose promise library and connect to database
mongoose.Promise = global.Promise;

const DATABASEURL = process.env.DATABASEURL || 'mongodb://localhost/DYC';

// Database

mongoose.set('useFindAndModify', false); // disables warnings
mongoose.set('useCreateIndex', true); // disables warnings
mongoose.connect(DATABASEURL, { useNewUrlParser: true });

app.use(require('express-session')({
  secret: 'this is a spoopy secret used to decode session',
  resave: false,
  saveUninitialized: false,
}));

app.use(express.static(`${__dirname}/dist`));
app.use(methodOverride('_method'));

app.locals.moment = require('moment');

app.use(flash());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

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

// error 404 page

app.get('*', (req, res) => {
  res.send('Error 404');
});

app.listen(8080);
