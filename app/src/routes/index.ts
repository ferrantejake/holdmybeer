'use strict';

import * as express from 'express';
const router = express.Router();
const debug = require('debug')('holdmybeer:index');
const pkg = require('../../../package.json');
/* GET home page. */
router.get('/', (req: express.Request, res: express.Response) => {
  console.log('serving index...');
  // res.send('success');
  res.render('index', { title: pkg.name, version: pkg.version, description: pkg.description, message: '' });
});

module.exports = router;