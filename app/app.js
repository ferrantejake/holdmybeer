const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const router = express.Router();
const init = require('./lib/utils').init;      // load environment variables
const debug = require('debug')('holdmybeer:app')
const cors = require('cors');
const app = express();

// enable CORS
app.use(cors());

function start() {
  debug('loading..')
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
  const routes = require('./lib/routes');   // load file dependencies
  const app = express();                  // create app

  // view engine setup
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'pug');

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/', routes);

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