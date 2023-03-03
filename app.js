const path = require('path');
// const cookieParser = require('cookie-parser');
// const csrfDSC = require('express-csrf-double-submit-cookie');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoDbSession = require('connect-mongodb-session')(session);
const flash = require('connect-flash');
const errorController = require('./controllers/error');
const mongoConnect = require('./util/database').mongoConnect;
const multer = require('multer');

const { csrfSync } = require("csrf-sync");
const {
  invalidCsrfTokenError, // This is just for convenience if you plan on making your own middleware.
  generateToken, // Use this in your routes to generate, store, and get a CSRF token.
  getTokenFromState, // The default method for retrieving a token from state.
  storeTokenInState, // The default method for storing a token in state.
  revokeToken, // Revokes/deletes a token by calling storeTokenInState(undefined)
  csrfSynchronisedProtection, // This is the default CSRF protection middleware.
} = csrfSync({
  getTokenFromRequest: (req) => {
    if (req.headers['csrf-token']){
      return req.headers['csrf-token'];
    }
    return req.body.token; 
  },
});

const app = express();
const store = new MongoDbSession({
  uri: 'mongodb+srv://dax523:7355608@cluster0.poi9kq7.mongodb.net/test',
  collection: 'sessions'
}
);

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');//directory with name 'images' should be created beforehand
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname);
  }
})

const fileFilter = (req, file, cb) => {
  if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
    cb(null, true);
  } else {
    cb (null, false);
  }
}

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const User = require('./models/user');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(session({
  secret: 'my secret',
  resave: false,
  saveUninitialized: false,
  store: store
}));

app.use(flash());

app.use((req, res, next) => {
  req.session.csrfToken = generateToken(req);
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.token = req.session.csrfToken;
  next();
})

app.use(csrfSynchronisedProtection);


app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      if (!user) {
        return next();
      }
      req.user = new User(user.name,
        user.email,
        user.password,
        user.cart,
        user._id,
        null,
        null
      );
      next();
    })

    .catch(err => {
      next(new Error(err)); //need to call next with new error when inside a promise otherwise just throw new error
    })
})



app.use('/admin', adminRoutes);

app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);
app.get('/500', errorController.get500);

// app.use((error, req, res, next) => {
//   res.status(500).render('500', {
//     pageTitle: 'OOPS :/',
//     path: '/500'
//   });
// })

mongoConnect(() => {
  app.listen(3000);
});
