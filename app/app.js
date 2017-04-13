const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const router = express.Router();
const init = require('./lib/init');      // Load environment variables
const debug = require('debug')('holdmybeer:app')
const cors = require('cors');
const passport = require('passport');

function start() {
  debug('Loading application dependencies..')
  return new Promise((resolve, reject) => {
    init.load()
      .then(() => {
        const app = loadApplication();
        debug('**ready**');
        resolve(app);
      }).catch(error => { throw error });
  });
}

function loadApplication() {
  debug('Loading application..')
  const app = express();                    // Create app
  app.use(require('serve-static')(__dirname + '/../../public'));
  app.use(require('cookie-parser')());
  app.use(cors());                          // Enable CORS
  const routes = require('./lib/routes');   // Load file dependencies

  // view engine setup
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'pug');

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/', routes);

  // Enable sessions for passport
  // app.use(require('express-session')({ secret: process.env.SESSION_SECRET, resave: true, saveUninitialized: true }));
  app.use(passport.initialize());
  // app.use(passport.session());

  // catch 404 and forward to error handler
  app.use((req, res, next) => {
    let err = new Error('Not Found');
    (err).status = 404;
    next(err);
  });

  // error handlers

  // development error handler
  // will print stacktrace
  if (app.get('env') === 'development') {
    const devErrorHandler =
      (err, req, res, next) => {
        router.
          res.status(err.status || 500);
        res.render('error', {
          message: err.message,
          error: err
        });
      };

    // hide ErrorRequestHandler as RequestHandler
    app.use(devErrorHandler);
  }

  // production error handler
  // no stacktraces leaked to user
  const prodErrorHandler =
    (err, req, res, next) => {
      res.status(err.status || 500);
      res.render('error', {
        message: err.message,
        error: {}
      });
    };

  // hide ErrorRequestHandler as RequestHandler
  app.use(prodErrorHandler);

  return app;
}
module.exports = { start }